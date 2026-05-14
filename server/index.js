const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the live demo
    methods: ["GET", "POST"]
  }
});

const GRID_SIZE = 20;
let grid = Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, index) => ({
  id: index,
  ownerId: null,
  color: '#27272a',
  lastClaimedBy: null
}));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('init_grid', grid);

  socket.on('claim_block', (data) => {
    const { blockId, color, userName } = data;
    
    if (blockId >= 0 && blockId < grid.length) {
      const currentBlock = grid[blockId];
      let actionType = 'claim';

      if (currentBlock.ownerId === socket.id) {
        grid[blockId] = {
          id: blockId,
          ownerId: null,
          color: '#27272a',
          lastClaimedBy: userName
        };
        actionType = 'release';
      } else {
        grid[blockId] = {
          ...currentBlock,
          ownerId: socket.id,
          color: color,
          lastClaimedBy: userName
        };
        actionType = 'claim';
      }

      io.emit('block_updated', { 
        block: grid[blockId], 
        actionType: actionType 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Grid size 20x20 = 400 blocks
const GRID_SIZE = 20;
let grid = Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, index) => ({
  id: index,
  ownerId: null,
  color: '#27272a', // zinc-800
  lastClaimedBy: null
}));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send the current grid state to the new user
  socket.emit('init_grid', grid);

  socket.on('claim_block', (data) => {
    const { blockId, color, userName } = data;
    
    // Simple validation
    if (blockId >= 0 && blockId < grid.length) {
      grid[blockId] = {
        ...grid[blockId],
        ownerId: socket.id,
        color: color,
        lastClaimedBy: userName
      };

      // Broadcast the update to everyone (including the sender)
      io.emit('block_updated', grid[blockId]);
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

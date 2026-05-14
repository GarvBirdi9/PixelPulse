import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

// Grid size must match backend
const GRID_SIZE = 20;

function App() {
  const [socket, setSocket] = useState(null);
  const [grid, setGrid] = useState([]);
  const [user, setUser] = useState({
    name: 'User_' + Math.floor(Math.random() * 1000),
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
  });
  const [hoveredBlock, setHoveredBlock] = useState(null);

  // Initialize socket
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('init_grid', (initialGrid) => {
      setGrid(initialGrid);
    });

    newSocket.on('block_updated', (updatedBlock) => {
      setGrid((prevGrid) => 
        prevGrid.map(block => block.id === updatedBlock.id ? updatedBlock : block)
      );
    });

    return () => newSocket.close();
  }, []);

  const handleBlockClick = (blockId) => {
    if (socket) {
      socket.emit('claim_block', {
        blockId,
        color: user.color,
        userName: user.name
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          PixelPulse
        </h1>
        <p className="text-zinc-400">Real-time shared grid. Click a block to capture it!</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-6xl">
        {/* Left Side: Stats & User Info */}
        <div className="flex flex-col gap-6 w-full md:w-64">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Your Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Display Name</label>
                <div className="text-lg font-medium">{user.name}</div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Your Color</label>
                <div className="flex items-center gap-3 mt-1">
                  <div 
                    className="w-10 h-10 rounded-lg shadow-lg" 
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-sm font-mono text-zinc-400">{user.color}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
            <h2 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-widest">Board Info</h2>
            <div className="text-2xl font-bold">{grid.length} Pixels</div>
            <p className="text-xs text-zinc-500 mt-1">Live updates enabled</p>
          </div>
        </div>

        {/* Center: The Grid */}
        <div className="relative group">
          <div 
            className="grid gap-1 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: 'fit-content'
            }}
          >
            {grid.map((block) => (
              <div
                key={block.id}
                onClick={() => handleBlockClick(block.id)}
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
                className="w-6 h-6 md:w-8 md:h-8 rounded-sm cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                style={{ 
                  backgroundColor: block.color,
                  boxShadow: block.ownerId ? `0 0 10px ${block.color}44` : 'none'
                }}
              />
            ))}
          </div>

          {/* Tooltip */}
          {hoveredBlock && (
            <div 
              className="absolute pointer-events-none bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow-xl border border-zinc-700 z-20 whitespace-nowrap"
              style={{
                left: `${(hoveredBlock.id % GRID_SIZE) * (100 / GRID_SIZE)}%`,
                top: `${Math.floor(hoveredBlock.id / GRID_SIZE) * (100 / GRID_SIZE)}%`,
                transform: 'translate(-50%, -120%)'
              }}
            >
              {hoveredBlock.lastClaimedBy ? `Owned by ${hoveredBlock.lastClaimedBy}` : 'Unclaimed'}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-zinc-600 text-sm">
        Built with Socket.io & React • Real-time Sync Active
      </footer>
    </div>
  );
}

export default App;

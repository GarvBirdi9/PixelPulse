import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

const GRID_SIZE = 20;

// Production URL from Render
const BACKEND_URL = 'https://pixelpulse-n7g5.onrender.com';

const ADJECTIVES = ['Neon', 'Cyber', 'Pixel', 'Turbo', 'Digital', 'Hyper', 'Mega', 'Sonic', 'Flash', 'Zen'];
const NOUNS = ['Ninja', 'Wizard', 'Ghost', 'Knight', 'Pilot', 'Hacker', 'Hero', 'Rover', 'Wave', 'Pulse'];

function App() {
  const [socket, setSocket] = useState(null);
  const [grid, setGrid] = useState([]);
  const [activity, setActivity] = useState([]);
  const [user] = useState(() => {
    const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
    return {
      name,
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`
    };
  });
  const [hoveredBlock, setHoveredBlock] = useState(null);

  useEffect(() => {
    // UPDATED to use the live Render URL
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('init_grid', (initialGrid) => {
      setGrid(initialGrid);
    });

    newSocket.on('block_updated', (data) => {
      const { block, actionType } = data;
      
      setGrid((prevGrid) => 
        prevGrid.map(b => b.id === block.id ? block : b)
      );
      
      const x = block.id % GRID_SIZE;
      const y = Math.floor(block.id / GRID_SIZE);

      setActivity(prev => [
        { 
          id: Date.now(), 
          user: block.lastClaimedBy, 
          color: actionType === 'release' ? '#52525b' : block.color,
          coords: `(${x}, ${y})`,
          action: actionType,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 7)
      ]);
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

  const leaderboard = useMemo(() => {
    const counts = {};
    grid.forEach(block => {
      if (block.lastClaimedBy && block.ownerId) {
        counts[block.lastClaimedBy] = {
          count: (counts[block.lastClaimedBy]?.count || 0) + 1,
          color: block.color
        };
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [grid]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-2 md:p-4 flex flex-col items-center font-sans selection:bg-emerald-500/30">
      <header className="mb-4 md:mb-6 text-center pt-2">
        <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-[0.2em] uppercase mb-2">
          Live Multiplayer Grid
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-1">
          Pixel<span className="text-emerald-500">Pulse</span>
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto">
          Capture pixels in real-time.
        </p>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-7xl">
        {/* Left Side */}
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2rem] shadow-xl">
            <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">You</h2>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl shadow-lg border border-white/10"
                style={{ backgroundColor: user.color }}
              />
              <div className="min-w-0">
                <div className="text-base font-bold text-white truncate leading-none">{user.name}</div>
                <div className="text-[9px] text-zinc-500 font-mono mt-1">COLOR ACTIVE</div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2rem] shadow-xl min-h-[300px]">
            <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Pulse Feed</h2>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 text-[11px] leading-tight">
                    <span className="font-bold text-zinc-100">{item.user}</span>
                    <br />
                    <span className={item.action === 'release' ? 'text-zinc-600' : 'text-zinc-500'}>
                      {item.action === 'release' ? 'released' : 'acquired'} block <span className="text-zinc-300 font-mono">{item.coords}</span>
                    </span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-zinc-700 text-[10px] italic">Waiting for incoming pulses...</p>
              )}
            </div>
          </div>
        </div>

        {/* The Main Board */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative p-2 bg-zinc-900/80 border border-white/5 rounded-[2rem] shadow-2xl">
            <div 
              className="grid gap-1 md:gap-1.5"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'fit-content'
              }}
            >
              {grid.map((block) => (
                <div
                  key={block.id}
                  onClick={() => handleBlockClick(block.id)}
                  onMouseEnter={() => setHoveredBlock(block)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  className="w-4 h-4 md:w-8 md:h-8 rounded-[4px] cursor-pointer transition-all duration-300 hover:scale-125 hover:z-[100] hover:rounded-lg hover:shadow-lg active:scale-90"
                  style={{ 
                    backgroundColor: block.color,
                    boxShadow: block.ownerId ? `0 0 10px ${block.color}44` : 'none',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-3 text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync • {grid.filter(b => b.ownerId).length} / {grid.length} Claimed
          </div>
        </div>

        {/* Right Side: Leaderboard */}
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2rem] shadow-xl">
            <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-6">Leaderboard</h2>
            <div className="space-y-5">
              {leaderboard.map(([name, data], index) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="text-zinc-700 font-mono text-[10px]">#0{index + 1}</div>
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: data.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-zinc-200 truncate leading-none">{name}</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                      Acquired: {data.count}
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-zinc-700 text-[10px] italic">No territory claimed yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Tooltip */}
      {hoveredBlock && hoveredBlock.lastClaimedBy && (
        <div className="fixed bottom-6 px-4 py-2 bg-zinc-100 text-black rounded-xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-300">
          Captured by {hoveredBlock.lastClaimedBy}
        </div>
      )}

      <footer className="mt-12 mb-8 text-zinc-800 text-[8px] font-bold uppercase tracking-[0.5em]">
        Assessment Project v1.2.0
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

const GRID_SIZE = 20;

function App() {
  const [socket, setSocket] = useState(null);
  const [grid, setGrid] = useState([]);
  const [activity, setActivity] = useState([]);
  const [user, setUser] = useState({
    name: 'User_' + Math.floor(Math.random() * 1000),
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
  });
  const [hoveredBlock, setHoveredBlock] = useState(null);

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
      
      setActivity(prev => [
        { 
          id: Date.now(), 
          user: updatedBlock.lastClaimedBy, 
          color: updatedBlock.color,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 4)
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

  // Calculate Leaderboard
  const leaderboard = useMemo(() => {
    const counts = {};
    grid.forEach(block => {
      if (block.lastClaimedBy) {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center selection:bg-emerald-500/30 font-sans">
      <header className="mb-8 md:mb-16 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold mb-6 tracking-[0.2em] uppercase">
          Live Pixel Canvas
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Pixel<span className="text-emerald-500">Pulse</span>
        </h1>
        <p className="text-zinc-500 max-w-lg mx-auto text-lg leading-relaxed">
          Capture pixels on a global shared grid. Experience the pulse of a living, breathing canvas.
        </p>
      </header>

      <main className="flex flex-col lg:flex-row gap-10 items-start justify-center w-full max-w-7xl">
        {/* Left Side: Identity & Activity */}
        <div className="flex flex-col gap-6 w-full lg:w-72 order-2 lg:order-1">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-8">Identity</h2>
            <div className="flex items-center gap-5 mb-8">
              <div 
                className="w-16 h-16 rounded-3xl shadow-2xl flex-shrink-0 border border-white/10"
                style={{ backgroundColor: user.color }}
              />
              <div className="min-w-0">
                <div className="text-xl font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">COLOR ACTIVE</div>
              </div>
            </div>
            <button 
              onClick={() => setUser(prev => ({ ...prev, color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` }))}
              className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-sm font-bold transition-all active:scale-95"
            >
              Shuffle Color
            </button>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-6">Live Activity</h2>
            <div className="space-y-4">
              {activity.length === 0 && (
                <p className="text-zinc-700 text-xs italic">Waiting for incoming pulses...</p>
              )}
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-700">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 text-xs truncate">
                    <span className="font-bold text-zinc-100">{item.user}</span>
                    <span className="text-zinc-600 ml-1">captured a pixel</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: The Board */}
        <div className="flex-1 flex flex-col items-center order-1 lg:order-2">
          <div className="relative p-4 bg-zinc-900/80 border border-white/10 rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.7)] group">
            <div 
              className="grid gap-1.5 p-1.5"
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
                  className="w-5 h-5 md:w-9 md:h-9 rounded-[6px] cursor-pointer transition-all duration-500 hover:scale-150 hover:z-[100] hover:rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-90"
                  style={{ 
                    backgroundColor: block.color,
                    boxShadow: block.ownerId ? `0 0 20px ${block.color}22` : 'none',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync • {grid.filter(b => b.ownerId).length} / {grid.length} Pixels Claimed
          </div>
        </div>

        {/* Right Side: Leaderboard */}
        <div className="flex flex-col gap-6 w-full lg:w-64 order-3">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-8">Leaderboard</h2>
            <div className="space-y-6">
              {leaderboard.length === 0 && (
                <p className="text-zinc-700 text-xs italic">No owners yet...</p>
              )}
              {leaderboard.map(([name, data], index) => (
                <div key={name} className="flex items-center gap-4">
                  <div className="text-zinc-700 font-mono text-xs w-4">0{index + 1}</div>
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: data.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-200 truncate">{name}</div>
                    <div className="text-[10px] text-zinc-600 font-mono uppercase">{data.count} Pixels</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Info Overlay */}
      {hoveredBlock && hoveredBlock.lastClaimedBy && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[200]">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          PIXEL #{hoveredBlock.id} CONTROLLED BY {hoveredBlock.lastClaimedBy.toUpperCase()}
        </div>
      )}

      <footer className="mt-32 pb-20 text-center">
        <div className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.6em] mb-4">
          Advanced Coding Assessment Project
        </div>
        <div className="flex justify-center gap-4">
          <div className="w-12 h-[1px] bg-zinc-900 self-center" />
          <div className="text-zinc-600 text-xs font-mono">STABLE v1.0.0</div>
          <div className="w-12 h-[1px] bg-zinc-900 self-center" />
        </div>
      </footer>
    </div>
  );
}

export default App;

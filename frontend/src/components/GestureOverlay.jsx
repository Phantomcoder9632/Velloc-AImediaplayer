import React from 'react';
import { Info } from 'lucide-react';

const GestureOverlay = ({ lastCommandName }) => {
  const commands = [
    { key: '1', label: 'Play/Pause' }, { key: '2', label: 'Vol UP' },
    { key: '3', label: 'Vol DOWN' }, { key: '4', label: 'Fwd 10s' },
    { key: '5', label: 'Rwd 10s' }, { key: '6', label: 'Next Track' },
    { key: '7', label: 'Prev Track' }, { key: '8', label: 'Subtitles' },
    { key: '9', label: 'Speed UP' }, { key: 'd', label: 'Speed DOWN' },
    { key: 'a', label: 'Aspect Ratio' }, { key: 'b', label: 'Audio Track' },
    { key: 'f', label: 'Fullscreen' }, { key: 'm', label: 'Mute' },
    { key: 's', label: 'Snapshot' },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 p-8 rounded-3xl border border-blue-500/40 text-center w-full max-w-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)]">
        
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
          <Info className="text-blue-500 animate-pulse" size={32} />
          <h2 className="text-2xl font-bold text-white">System Armed</h2>
          <p className="text-zinc-400 text-sm">Perform a gesture. Show FIST to close menu and resume.</p>
        </div>
        
        {/* 5-column grid for all 15 commands */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs font-bold uppercase tracking-wide">
          {commands.map((cmd) => (
            <div key={cmd.key} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1">
              <span className="text-zinc-500 text-[10px]">Class {cmd.key}</span>
              <span className="text-blue-400">{cmd.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 h-12 flex items-center justify-center">
          {lastCommandName ? (
            <div className="text-green-400 font-bold text-xl uppercase tracking-widest bg-green-900/20 px-8 py-3 rounded-full border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              {lastCommandName}
            </div>
          ) : (
            <div className="text-zinc-600 font-medium">Waiting for input...</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GestureOverlay;
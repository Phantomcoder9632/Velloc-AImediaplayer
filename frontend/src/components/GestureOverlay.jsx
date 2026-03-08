import React from 'react';
import { BrainCircuit } from 'lucide-react';

const GestureOverlay = () => {
  // Mapping all 15 trained classes to their local skeleton image assets
  const commands = [
    { key: '1', icon: '/gestures/Class_1.png', label: 'Play / Pause' },
    { key: '2', icon: '/gestures/Class_2.png', label: 'Volume UP' },
    { key: '3', icon: '/gestures/Class_3.png', label: 'Volume DOWN' },
    { key: '4', icon: '/gestures/Class_4.png', label: 'Forward 10s' },
    { key: '5', icon: '/gestures/Class_5.png', label: 'Rewind 10s' },
    { key: '6', icon: '/gestures/Class_6.png', label: 'Next Track' },
    { key: '7', icon: '/gestures/Class_7.png', label: 'Prev Track' },
    { key: '8', icon: '/gestures/Class_8.png', label: 'Subtitles' },
    { key: '9', icon: '/gestures/Class_9.png', label: 'Speed UP' },
    { key: 'd', icon: '/gestures/Class_d.png', label: 'Speed DOWN' },
    { key: 'a', icon: '/gestures/Class_a.png', label: 'Aspect Ratio' },
    { key: 'b', icon: '/gestures/Class_b.png', label: 'Audio Track' },
    { key: 'f', icon: '/gestures/Class_f.png', label: 'Fullscreen' },
    { key: 'm', icon: '/gestures/Class_m.png', label: 'Mute' },
    { key: 's', icon: '/gestures/Class_s.png', label: 'Snapshot' },
  ];

  return (
    // Lowered background opacity (bg-slate-950/60) for maximum transparency
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-slate-900/90 p-6 rounded-3xl border border-blue-500/30 text-center w-full max-w-6xl shadow-[0_0_80px_rgba(37,99,235,0.15)] flex flex-col items-center">
        
        <div className="flex items-center gap-4 mb-5 border-b border-slate-800 pb-4 w-full justify-center">
          <BrainCircuit className="text-blue-500" size={28} />
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Velloc AI Commander</h2>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 max-w-xl italic">
          Perform a gesture below to execute. System auto-rewinds {5}s and resumes playback instantly.
        </p>
        
        {/* Massive 5x3 Grid focusing on the generated skeleton icons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full px-2">
          {commands.map((cmd) => (
            <div key={cmd.key} className="p-3 bg-black/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-slate-800 transition-all shadow-xl group">
              
              {/* This container ensures the generated white-on-transparent image is visible */}
              <div className="w-20 h-20 flex items-center justify-center p-2 rounded-lg bg-slate-950/80 border border-slate-800 group-hover:border-blue-500/30 transition-all">
                <img 
                    src={cmd.icon} 
                    alt={cmd.label} 
                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" 
                    // Added a blue drop-shadow to make the white skeletons "glow"
                />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-blue-400 text-[10px] font-mono mt-1 font-bold tracking-wide">{cmd.label}</span>
                <span className="text-slate-600 text-[9px] uppercase tracking-tighter mt-0.5">Class {cmd.key}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GestureOverlay;
import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, FolderOpen, Play, Pause, Volume2, VolumeX, Maximize, 
  Clock, Download, Film, Hand, ChevronDown, SkipForward, Activity, Camera,
  SkipBack, Square, Minimize, Settings, PictureInPicture, Repeat, ListVideo,
  MonitorPlay, Music, AlertTriangle
} from 'lucide-react';
import GestureOverlay from './components/GestureOverlay';

function App() {
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  
  // Playlist & Folder Engine
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [videoSrc, setVideoSrc] = useState(""); 
  const [fileType, setFileType] = useState("video"); 
  const [videoError, setVideoError] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Time, Volume & Settings
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState("contain"); 
  const [isLooping, setIsLooping] = useState(false);

  // Rewind & OSD
  const [rewindTime, setRewindTime] = useState(5);
  const [isRewindMenuOpen, setIsRewindMenuOpen] = useState(false);
  const [osd, setOsd] = useState({ visible: false, text: "" });
  
  const osdTimeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null); 
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null); 
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null); 
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws");
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "ARMED") {
        setIsArmed(true);
        if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); }
      } 
      else if (data.status === "DISARMED") {
        setIsArmed(false);
        if (videoRef.current && !videoError) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - rewindTime);
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
      else if (data.status === "TRIGGERED") {
        handleGestureCommand(data.command, data.command_name);
      }
    };

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (socketRef.current) socketRef.current.close();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [rewindTime, videoError]);

  const showOSD = (text) => {
    setOsd({ visible: true, text });
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => setOsd({ visible: false, text: "" }), 2000);
  };

  // --- BULLETPROOF FILE HANDLER ---
  const handleFileUpload = (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const files = Array.from(e.target.files).filter(f => {
        const type = (f.type || "").toLowerCase();
        const name = (f.name || "").toLowerCase();
        return type.startsWith('video/') || type.startsWith('audio/') || 
               name.match(/\.(mp4|mkv|webm|avi|mov|mp3|wav|flac|aac)$/);
      });
      
      if (files.length > 0) {
        setPlaylist(files);
        setCurrentIndex(0);
        setVideoError(false);
        
        const isAudio = (files[0].type || "").startsWith('audio/') || (files[0].name || "").toLowerCase().match(/\.(mp3|wav|flac|aac)$/);
        setFileType(isAudio ? 'audio' : 'video');
        
        setVideoSrc(URL.createObjectURL(files[0]));
        showOSD(`Loaded: ${files[0].name}`);
      } else {
        showOSD("❌ Unsupported file format");
      }
      e.target.value = '';
    } catch (error) {
      console.error("File upload crash intercepted:", error);
      showOSD("❌ System Error reading file");
    }
  };

  const loadNextTrack = () => {
    if (currentIndex < playlist.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVideoError(false);
      setFileType((playlist[nextIdx].type || "").startsWith('audio') ? 'audio' : 'video');
      setVideoSrc(URL.createObjectURL(playlist[nextIdx]));
      showOSD(`⏭ Next Track`);
    } else { showOSD("End of Playlist"); }
  };

  const loadPrevTrack = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setVideoError(false);
      setFileType((playlist[prevIdx].type || "").startsWith('audio') ? 'audio' : 'video');
      setVideoSrc(URL.createObjectURL(playlist[prevIdx]));
      showOSD(`⏮ Prev Track`);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || fileType === 'audio' || videoError) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const link = document.createElement('a');
      link.download = `Velloc_Snapshot_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      showOSD("📸 Snapshot Saved");
    } catch (err) { showOSD("❌ Cannot capture this codec"); }
  };

  const togglePiP = async () => {
    if (!videoRef.current || fileType === 'audio' || videoError) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch (e) { console.error("PiP Error"); showOSD("❌ PiP Not Supported"); }
  };

  const formatTime = (t) => {
    if (isNaN(t)) return "00:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current || videoError) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); } 
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  const toggleFullscreen = () => {
    if (fileType === 'audio') return;
    if (!document.fullscreenElement) playerContainerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // --- THE MISSING AI TOGGLE FUNCTION ---
  const toggleAI = () => {
    const newState = !isAiEnabled;
    setIsAiEnabled(newState);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // This line physically tells Python to turn the camera ON/OFF
        socketRef.current.send(JSON.stringify({ type: "TOGGLE_AI", value: newState }));
    } else {
        showOSD("❌ Backend disconnected");
    }
  };

  const handleGestureCommand = (cmd, cmdName) => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setHistory(prev => [{ cmd: cmdName, time: timeStr }, ...prev].slice(0, 10));

    const v = videoRef.current;
    if (!v) return;

    switch (cmd) {
      case '1': togglePlay(); break;
      case '2': v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); break;
      case '3': v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); break;
      case '4': v.currentTime += 10; break;
      case '5': v.currentTime -= 10; break;
      case '6': loadNextTrack(); break;
      case '7': loadPrevTrack(); break;
      case 'f': toggleFullscreen(); break;
      case 'm': v.muted = !v.muted; setIsMuted(v.muted); break;
      case 's': takeSnapshot(); break;
      default: break;
    }

    setIsArmed(false);
    if (!videoError) {
        v.currentTime = Math.max(0, v.currentTime - rewindTime);
        setTimeout(() => { v.play(); setIsPlaying(true); }, 100);
    }
    if (socketRef.current) socketRef.current.send(JSON.stringify({ type: "RESET_STATE" }));
  };

  const exportLog = () => {
    const logText = history.map(h => `[${h.time}] ${h.cmd}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'velloc_gesture_log.txt';
    a.click();
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col p-6 font-sans overflow-hidden">
      
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <Brain className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Velloc</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">AI Media Player</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input type="file" accept="video/*,audio/*,.mkv" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 text-sm font-medium">
            <Film size={16} /> Open Files
          </button>

          <input type="file" webkitdirectory="true" directory="" ref={folderInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => folderInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 text-sm font-medium text-blue-400">
            <FolderOpen size={16} /> Open Folder
          </button>

          {/* AI Toggle Button - Now correctly linked to toggleAI */}
          <button onClick={toggleAI} className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-bold shadow-lg ${isAiEnabled ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Brain size={18} /> {isAiEnabled ? "AI Active" : "AI Offline"}
          </button>
        </div>
      </div>

      <div className="flex gap-6 grow overflow-hidden">
        
        {/* Main Player Display */}
        <div ref={playerContainerRef} className={`flex-1 relative bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl group ${isFullscreen ? 'rounded-none border-none' : 'rounded-3xl'}`}>
          
          {!videoSrc ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 mb-6 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-800/50">
                 <MonitorPlay className="text-blue-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Velloc Pro Engine</h2>
              <p className="text-slate-400 text-sm max-w-sm">Select files or a folder to begin playback.</p>
            </div>
          ) : (
            <>
              {/* Codec Error Warning */}
              {videoError && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-sm">
                    <AlertTriangle size={64} className="text-red-500 mb-4 animate-pulse" />
                    <h3 className="text-2xl font-bold text-white">Format Not Supported</h3>
                    <p className="text-slate-400 mt-2 max-w-md text-center">Your browser cannot render the codec used in this file (common with .mkv files). Please try loading a standard .mp4 video.</p>
                 </div>
              )}

              {/* Audio Visualizer Placeholder */}
              {fileType === 'audio' && !videoError && (
                <div className="flex flex-col items-center justify-center gap-6 z-10">
                  <div className="w-48 h-48 rounded-full bg-blue-600/10 border-4 border-blue-500/20 flex items-center justify-center animate-pulse">
                    <Music size={64} className="text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white text-center px-10">{playlist[currentIndex]?.name}</h3>
                </div>
              )}

              {/* --- THE VIDEO ELEMENT --- */}
              <video 
                ref={videoRef} 
                className={`w-full h-full cursor-pointer transition-all duration-300 z-10 ${fileType === 'audio' ? 'hidden' : (aspectRatio === 'cover' ? 'object-cover' : 'object-contain')}`}
                src={videoSrc} 
                loop={isLooping}
                onClick={() => {
                  if (clickTimeoutRef.current) {
                    clearTimeout(clickTimeoutRef.current);
                    clickTimeoutRef.current = null;
                    toggleFullscreen();
                  } else {
                    clickTimeoutRef.current = setTimeout(() => { togglePlay(); clickTimeoutRef.current = null; }, 250);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                onEnded={loadNextTrack}
                onError={(e) => {
                  console.error("Video Codec Error");
                  setVideoError(true);
                  setIsPlaying(false);
                }}
              />
              
              {/* OSD */}
              {osd.visible && (
                <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xl z-50">
                  {osd.text}
                </div>
              )}

              {playlist.length > 1 && (
                <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white font-bold text-xs uppercase tracking-widest z-40 flex items-center gap-2">
                  <ListVideo size={14}/> Track {currentIndex + 1} / {playlist.length}
                </div>
              )}

              {isArmed && <GestureOverlay lastCommandName="" />}
              
              {/* Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-16 bg-gradient-to-t from-slate-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-xs font-mono text-slate-300 w-full">
                  <span>{formatTime(currentTime)}</span>
                  <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => { videoRef.current.currentTime = e.target.value; }} className="flex-1 h-1.5 bg-slate-600 rounded-full appearance-none accent-blue-500 cursor-pointer" />
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <button onClick={loadPrevTrack} className="text-slate-200 hover:text-blue-400"><SkipBack size={20} fill="currentColor" /></button>
                    <button onClick={togglePlay} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30">
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>
                    <button onClick={loadNextTrack} className="text-slate-200 hover:text-blue-400"><SkipForward size={20} fill="currentColor"/></button>
                    
                    <div className="flex items-center gap-2 ml-4 group/vol">
                      <button onClick={() => { videoRef.current.muted = !videoRef.current.muted; setIsMuted(videoRef.current.muted); }} className="text-slate-200 hover:text-blue-400">
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                      <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => { videoRef.current.volume = e.target.value; setVolume(e.target.value); }} className="w-0 opacity-0 group-hover/vol:w-20 group-hover/vol:opacity-100 transition-all duration-300 h-1.5 bg-slate-600 rounded-full appearance-none accent-blue-500 cursor-pointer" />
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-slate-300">
                    <button onClick={takeSnapshot} className="hover:text-blue-400"><Camera size={18} /></button>
                    <button onClick={togglePiP} className="hover:text-blue-400"><PictureInPicture size={18} /></button>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="hover:text-blue-400"><Settings size={18} /></button>
                    <button onClick={toggleFullscreen} className="hover:text-blue-400"><Maximize size={20} /></button>
                  </div>
                </div>
              </div>

              {/* Settings Dropup */}
              {isSettingsOpen && (
                <div className="absolute bottom-24 right-10 bg-slate-900 border border-slate-700 rounded-xl p-4 w-60 z-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Speed</span>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg mb-4">
                    {[0.5, 1, 1.5, 2].map(s => (
                      <button key={s} onClick={() => { videoRef.current.playbackRate = s; setPlaybackSpeed(s); }} className={`flex-1 py-1 text-xs rounded ${playbackSpeed === s ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{s}x</button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Loop Track</span>
                    <input type="checkbox" checked={isLooping} onChange={e => setIsLooping(e.target.checked)} className="accent-blue-500" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Log */}
        {!isFullscreen && (
          <div className="w-80 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 font-semibold text-sm flex items-center gap-2"><Clock size={16} className="text-blue-500"/> Command Log</div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {history.map((item, i) => (
                <div key={i} className={`flex justify-between p-4 rounded-xl border ${i===0 ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800/50 text-slate-400'}`}>
                  <span className="text-sm font-medium">{item.cmd}</span>
                  <span className="text-[10px] font-mono opacity-50">{item.time}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <button onClick={exportLog} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-xs font-semibold tracking-wide">
                <Download size={14} /> EXPORT LOG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
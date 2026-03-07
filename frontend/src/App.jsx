import React, { useState, useEffect, useRef } from 'react';
import { Hand, SkipBack, FolderOpen } from 'lucide-react';
import GestureOverlay from './components/GestureOverlay';

function App() {
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [lastCommandName, setLastCommandName] = useState("");
  const [aspectMode, setAspectMode] = useState("contain"); // For aspect ratio toggle
  
  const [videoSrc, setVideoSrc] = useState("https://www.w3schools.com/html/mov_bbb.mp4");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws");

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "ARMED") {
        setIsArmed(true);
        if (videoRef.current) videoRef.current.pause(); 
      } 
      else if (data.status === "DISARMED") {
        setIsArmed(false);
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          videoRef.current.play();
        }
      }
      else if (data.status === "TRIGGERED") {
        handleGestureCommand(data.command, data.command_name);
      }
    };
    return () => socketRef.current.close();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) setVideoSrc(URL.createObjectURL(file));
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'velloc_snapshot.png';
    a.click();
  };

  const handleGestureCommand = (cmd, cmdName) => {
    setLastCommandName(cmdName);
    const video = videoRef.current;
    if (!video) return;

    switch (cmd) {
      case '1': video.paused ? video.play() : video.pause(); break;
      case '2': video.volume = Math.min(1, video.volume + 0.1); break;
      case '3': video.volume = Math.max(0, video.volume - 0.1); break;
      case '4': video.currentTime += 10; break;
      case '5': video.currentTime -= 10; break;
      case '9': video.playbackRate = Math.min(3.0, video.playbackRate + 0.25); break;
      case 'd': video.playbackRate = Math.max(0.25, video.playbackRate - 0.25); break;
      case 'm': video.muted = !video.muted; break;
      case 'f': if (video.requestFullscreen) video.requestFullscreen(); break;
      case 's': takeSnapshot(); break;
      case 'a': 
        setAspectMode(prev => prev === "contain" ? "cover" : prev === "cover" ? "fill" : "contain"); 
        break;
      // Tracks and Subtitles require multi-file architecture, logging for now
      case '6': console.log("Next Track Requested"); break;
      case '7': console.log("Prev Track Requested"); break;
      case '8': console.log("Subtitles Toggle Requested"); break;
      case 'b': console.log("Audio Track Toggle Requested"); break;
      default: break;
    }

    setTimeout(() => setLastCommandName(""), 1500);
  };

  const toggleAI = () => {
    const newState = !isAiEnabled;
    setIsAiEnabled(newState);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "TOGGLE_AI", value: newState }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-6 text-blue-500">Velloc <span className="text-sm font-light text-zinc-500 underline">AI Player</span></h1>

      <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex justify-center items-center" style={{ minHeight: '500px' }}>
        <video 
          ref={videoRef}
          className="w-full h-full transition-all duration-300"
          style={{ objectFit: aspectMode }}
          src={videoSrc}
          controls
        />
        {isArmed && <GestureOverlay lastCommandName={lastCommandName} />}
      </div>

      <div className="mt-8 flex gap-6 items-center bg-zinc-900 p-4 rounded-full border border-zinc-700 px-10">
        <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-6 py-2 rounded-full cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
          <FolderOpen size={20} /> Open File
        </button>
        <button onClick={toggleAI} className={`flex items-center gap-2 px-6 py-2 rounded-full cursor-pointer ${isAiEnabled ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
          <Hand size={20} /> {isAiEnabled ? "Gesture Mode: ON" : "Gesture Mode: OFF"}
        </button>
        <div className="flex items-center gap-2 text-zinc-400">
          <SkipBack size={18} /> <span className="text-xs font-mono uppercase tracking-widest">Auto-Rewind: 5s</span>
        </div>
      </div>
    </div>
  );
}

export default App;
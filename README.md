# 🤖 Velloc – AI Gesture-Controlled Media Player

**Control your media player with hand gestures — no mouse, no keyboard.**

Velloc uses a trained Random Forest AI model + MediaPipe hand tracking to let you control video/audio playback through your webcam gestures in real time.

---

## ✨ Features

- 🎬 Play, Pause, Skip, Rewind with hand gestures
- 🔊 Volume Up / Down via gesture
- ⏩ 10-second forward / backward seek
- 📸 Snapshot capture
- 🔇 Mute toggle
- 🖥️ Fullscreen toggle
- 📋 Playlist & folder loading
- 📄 Gesture command log export
- 🌐 **Fully browser-based** – no desktop app needed

---

## 🧠 How It Works

```
Your Webcam (Browser)
        ↓
  MediaPipe Hands JS
  (landmark extraction)
        ↓
  WebSocket → Cloud Backend
        ↓
  AI Model (Random Forest)
  predicts gesture
        ↓
  Command sent to Player
```

1. **Frontend** (Vite + React): Captures webcam, detects 21 hand landmarks via MediaPipe in the browser, normalizes them into 43 features, and sends to the backend.
2. **Backend** (FastAPI + Python): Receives landmark arrays, runs them through the trained `RandomForestClassifier`, and returns a gesture command over WebSocket.

---

## 🚀 Deployment

### Frontend → [Vercel](https://vercel.com)

The React app is deployed on Vercel.

**Steps:**  
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub  
2. Set **Root Directory** → `frontend`  
3. Add Environment Variable:
   - `VITE_WS_URL` = `wss://<your-render-service>.onrender.com/ws`  
4. Deploy ✅

### Backend → [Render](https://render.com)

The FastAPI WebSocket server is deployed on Render.

**Steps:**  
1. Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo  
2. Set **Root Directory** → `backend`  
3. **Build Command**: `pip install -r requirements.txt`  
4. **Start Command**: `python server.py`  
5. Deploy ✅

> ⚠️ Render free tier "sleeps" after ~15 min of inactivity. First request may take 30–60 seconds to wake up.

---

## 🖐️ Gesture Map

| Gesture | Command |
|---------|---------|
| ✊ Fist | Arm / Disarm AI |
| ☝️ Index finger | Play / Pause |
| ✌️ Two fingers | Volume Up |
| 🤟 Three fingers | Volume Down |
| 🖖 Four fingers | Forward 10s |
| 🖐️ Open hand | Rewind 10s |
| 👍 Thumbs up | Next Track |
| 👎 Thumbs down | Prev Track |
| 🤙 Pinky + Thumb | Fullscreen |
| 🤜 Others | Various |

---

## 🛠️ Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
Velloc-Media_player/
├── backend/
│   ├── server.py               # FastAPI WebSocket server
│   ├── requirements.txt        # Python deps
│   └── vlc_gesture_model_v2.pkl  # Trained RandomForest model
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main player UI
│   │   ├── services/
│   │   │   └── CameraService.js  # MediaPipe hand tracking
│   │   └── components/
│   │       └── GestureOverlay.jsx
│   ├── index.html              # Loads MediaPipe from CDN
│   └── vercel.json
├── scripts/
│   ├── train_vlc_model.py      # Model training script
│   └── dataset_generator.py
└── render.yaml                 # Render.com deploy config
```

---

## 🔒 Security

- ✅ No hardcoded API keys or passwords in any file
- ✅ `.pkl` model contains only a trained `RandomForestClassifier` (sklearn)
- ✅ No PII or local file paths committed to the repo
- ✅ CORS configured to allow all origins (safe for public API)

---

*Built with ❤️ using React, FastAPI, MediaPipe & scikit-learn.*

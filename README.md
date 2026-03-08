<div align="center">
  <img src="https://raw.githubusercontent.com/Phantomcoder9632/Velloc-AImediaplayer/main/frontend/public/gestures/Class_0.png" width="100" alt="Velloc Logo">
  
  # 🎥 Velloc AI Media Player
  
  **The Future of Human-Computer Interaction (HCI)** <br>
  *Control your cinema with the wave of a hand. No remote. No mouse. Just vision.*

  [![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)](https://www.python.org/)
  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision-FF6F00?logo=google&logoColor=white)](https://mediapipe.dev/)
</div>

---

## 📖 Table of Contents
- [🚀 The Vision](#-the-vision)
- [✨ Core Features](#-core-features)
- [🎮 Gesture Dictionary](#-gesture-dictionary)
- [🧠 Under the Hood (Machine Learning)](#-under-the-hood-machine-learning)
- [🚀 Getting Started](#-getting-started)
- [🎓 Developer](#-developer)

---

## 🚀 The Vision
**Velloc** is a professional-grade, hybrid media player that bridges the gap between traditional UI and the future of spatial computing. Built to rival standard desktop players, it features a comprehensive manual control suite alongside **Real-Time Hand Gesture Recognition**. By leveraging a **Random Forest Classifier** and **MediaPipe Hand Landmarks**, Velloc offers a seamless, touchless experience optimized for power users.

> **Note:** Drop a GIF of the Velloc UI and you doing the hand gestures right here!
> `![Velloc Demo](link-to-your-gif.gif)`

---

## ✨ Core Features

<details>
<summary><b>🛡️ The "Fist-to-Arm" State Machine (Click to expand)</b></summary>
Traditional gesture controls suffer from "accidental triggers" (e.g., scratching your face pauses the video). Velloc solves this with a robust State-Machine Architecture:
<ol>
  <li><b>Standby Mode:</b> The AI tracks your hand but ignores all movement.</li>
  <li><b>The Trigger:</b> Show a <b>Fist</b> to "Arm" the system.</li>
  <li><b>The HUD Menu:</b> A sleek, transparent overlay appears. You can now perform multiple commands sequentially.</li>
  <li><b>Resumption:</b> Show a <b>Fist</b> again to close the menu and automatically resume playback.</li>
</ol>
</details>

<details>
<summary><b>🕒 The "Safety Rewind" Logic (Click to expand)</b></summary>
Whenever you finish a gesture command and close the menu, Velloc automatically <b>rewinds the video by a customizable duration (e.g., 5 seconds)</b>. This ensures you never miss a single line of dialogue or frame of action while operating the AI menu.
</details>

<details>
<summary><b>📂 Pro-Grade Playlist Engine (Click to expand)</b></summary>
Velloc isn't just a tech demo; it's a daily driver. The built-in engine supports:
<ul>
  <li><b>Batch Loading:</b> Open entire folders or multiple <code>.mp4</code>, <code>.mkv</code>, and audio files at once.</li>
  <li><b>Hybrid Controls:</b> Use gestures to skip tracks, or use the gorgeous macOS-inspired hover controls.</li>
  <li><b>Picture-in-Picture (PiP):</b> Pop out your video into a floating window to watch while coding.</li>
</ul>
</details>

---

## 🎮 Gesture Dictionary
Velloc utilizes 16 distinct neural classes. We implemented **Dynamic Cooldowns** to ensure extreme responsiveness while preventing double-triggers.

| Icon | Gesture | Action | Cooldown |
| :---: | :--- | :--- | :---: |
| ✊ | **Fist** | **ARM / DISARM MENU** | `1.5s` |
| ✋ | **Open Palm** | Play / Pause | `1.5s` |
| 👍 | **Thumb Up** | Increase Volume | `0.1s` |
| 👎 | **Thumb Down** | Decrease Volume | `0.1s` |
| 👉 | **Point Right** | Forward 10s | `0.5s` |
| 👈 | **Point Left** | Rewind 10s | `0.5s` |
| 👆 | **L-Shape (Left)** | Next Track | `2.0s` |
| 👆 | **L-Shape (Right)** | Previous Track | `2.0s` |
| ✌️ | **Peace Sign** | Toggle Subtitles | `1.0s` |
| 🤘 | **Rock On** | Speed Up (up to 3x) | `0.5s` |
| 🤙 | **Shaka** | Speed Down | `0.5s` |
| 🖐️ | **4 Fingers** | Aspect Ratio (Crop/Fit) | `1.0s` |
| 🖖 | **3 Fingers** | Cycle Audio Track | `1.0s` |
| 👌 | **OK Sign** | Toggle Fullscreen | `1.5s` |
| 🤏 | **Pinky Up** | Mute Audio | `1.5s` |
| 🤌 | **Pinch** | **Take High-Res Snapshot** | `2.0s` |

---

## 🧠 Under the Hood (Machine Learning)

Velloc is designed as a low-latency (<10ms) **Monorepo**.

### The Architecture
* **Frontend UI**: React, Vite, Lucide Icons, and Tailwind CSS v4.0 for a custom "Dark Slate" Glass-morphism interface.
* **Backend Engine**: Python FastAPI WebSocket server handling the real-time continuous video feed and async messaging.
* **AI Brain**: MediaPipe + Scikit-Learn Random Forest Classifier.

### Landmark Normalization Strategy
To ensure the AI recognizes your gestures regardless of how close or far your hand is from the webcam, we normalize all 21 3D coordinates relative to the wrist using mathematical transformation before feeding it to the Random Forest model:
$$X_{norm} = X_{raw} - X_{wrist}$$
$$Y_{norm} = Y_{raw} - Y_{wrist}$$

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- `Python 3.9+`
- `Node.js & npm`

### 2. Quick Setup

**Step A: Clone the repository**
```bash
git clone [https://github.com/Phantomcoder9632/Velloc-AImediaplayer.git](https://github.com/Phantomcoder9632/Velloc-AImediaplayer.git)
cd Velloc-AImediaplayer
```

**Step B: Initialize the AI Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install fastapi uvicorn opencv-python mediapipe scikit-learn pandas
python server.py
```

**Step C: Initialize the Frontend Player**
```bash
# Open a new terminal window
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser. Add your media, hit **AI Active**, and take control.

---

## 🎓 Developer
Developed as a specialized Computer Vision and Human-Computer Interaction project by **Bikram Hawladar**, Computer Science and Engineering student at the **Indian Institute of Information Technology (IIIT), Dharwad**.

<div align="center">
  <br>
  <i>If you found this project interesting, don't forget to hit the ⭐ button!</i>
</div>

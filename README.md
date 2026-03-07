# 🎥 Velloc AI Media Player
> **The Future of Human-Computer Interaction (HCI)** > *Control your cinema with the wave of a hand. No remote. No mouse. Just vision.*

[![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🚀 The Vision
**Velloc** is a professional-grade media player that replaces traditional controls with **Real-Time Hand Gesture Recognition**. By leveraging a **Random Forest Classifier** and **MediaPipe Hand Landmarks**, Velloc offers a seamless, touchless experience optimized for movie lovers and power users.



---

## 🧠 Core Engineering Innovations

### 🛡️ The "Fist-to-Arm" Workflow
Traditional gesture controls suffer from "accidental triggers" (e.g., scratching your head might pause the video). Velloc solves this with a **State-Machine Architecture**:
1.  **Standby Mode**: AI ignores all movement.
2.  **The Trigger**: Show a **Fist (Class 0)** to "Arm" the system.
3.  **The Menu**: A sleek overlay appears. You can now perform multiple commands in a row.
4.  **Resumption**: Show a **Fist** again to close the menu and resume the movie.

### 🕒 The 5s "Safety Rewind"
Whenever you finish a gesture command and close the menu, Velloc automatically **rewinds 5 seconds**. This ensures you don't miss a single line of dialogue or action while you were looking at the gesture menu.

---

## 🎮 Command Gallery (15+ Classes)
Velloc uses **Dynamic Cooldowns** to ensure responsiveness while preventing double-triggers.

| Gesture | Action | Cooldown |
| :--- | :--- | :--- |
| ✊ **Fist** | **ARM / DISARM MENU** | 1.5s |
| ✋ **Open Palm** | Play / Pause | 1.5s |
| 👍 **Thumb Up** | Increase Volume | 0.1s |
| 👎 **Thumb Down** | Decrease Volume | 0.1s |
| 👉 **Point Right** | Forward 10s | 0.5s |
| 👌 **OK Sign** | Toggle Fullscreen | 1.5s |
| 🤙 **Pinky Up** | **Take Snapshot** | 2.0s |



---

## 🛠️ Tech Stack & Architecture
Velloc is a **Monorepo** designed for low latency (<10ms).

* **Frontend**: React + Lucide Icons + Tailwind v4.0 for a custom "VLC-Pro" Glass-morphism UI.
* **Backend**: FastAPI WebSocket server handling the AI inference loop.
* **AI Engine**: MediaPipe for landmark extraction + Scikit-Learn Random Forest for classification.



---

## 📂 Project Roadmap
```text
VELLOC-MEDIA_PLAYER/
├── backend/        # Python FastAPI + AI Brain
│   ├── server.py   # State machine logic
│   └── model.pkl   # Trained gesture model
├── frontend/       # React UI + Video Engine
│   └── src/        # Custom VLC-style components
├── dataset/        # Raw hand-landmark CSV data
└── scripts/        # Training & Collection utilities
```

## 🏗️ Getting Started
### 1. Prerequisites
*  Python 3.9+
*  Node.js & npm

### 2. Setup

#### Clone the repository
* git clone [https://github.com/Phantomcoder9632/Velloc-AImediaplayer.git](https://github.com/Phantomcoder9632/Velloc-AImediaplayer.git)

#### Initialize Backend
* cd backend
* pip install -r requirements.txt
* python server.py

#### Initialize Frontend
* cd ../frontend
* npm install
* npm run dev
# 🎓 Academic Recognition
Developed as a specialized Computer Vision project by Bikram Hawladar, a student at the Indian Institute of Information Technology (IIIT), Dharwad.

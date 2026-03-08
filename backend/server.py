import cv2
import mediapipe as mp
import numpy as np
import pickle
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import warnings

# Suppress annoying sci-kit warnings
warnings.filterwarnings("ignore")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. LOAD YOUR TRAINED MODEL ---
# Update this filename if yours is different!
MODEL_FILE = 'vlc_gesture_model_v2.pkl' 
try:
    with open(MODEL_FILE, 'rb') as f:
        model = pickle.load(f)
    print(f"✅ AI Model loaded: {MODEL_FILE}")
except Exception as e:
    print(f"❌ ERROR: Could not load model {MODEL_FILE}. Please check the path.")
    model = None

# --- 2. COMMAND COOLDOWN DICTIONARY ---
COMMAND_MAP = {
    '0': ('STANDBY', 0),    '1': ('PLAY/PAUSE', 1.5),
    '2': ('VOL UP', 0.1),   '3': ('VOL DOWN', 0.1),
    '4': ('FORWARD 10s', 0.5), '5': ('REWIND 10s', 0.5),
    '6': ('NEXT TRACK', 2.0),  '7': ('PREV TRACK', 2.0),
    '8': ('SUBTITLES', 1.0),   '9': ('SPEED UP', 0.5),
    'a': ('ASPECT RATIO', 1.0),'b': ('AUDIO TRACK', 1.0),
    'd': ('SPEED DOWN', 0.5),  'f': ('FULLSCREEN', 1.5),
    'm': ('MUTE', 1.5),        's': ('SNAPSHOT', 2.0)
}

# --- 3. MEDIAPIPE SETUP ---
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)

# --- 4. WEBSOCKET ENGINE ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🌐 React UI Connected!")
    
    cap = None
    app_state = {"is_armed": False}
    is_ai_running = False

    try:
        while True:
            # A. Check for messages from the React UI (Non-blocking)
            try:
                # Wait for just 0.01 seconds to see if the user clicked a button
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                message = json.loads(data)
                
                if message.get("type") == "TOGGLE_AI":
                    is_ai_running = message.get("value")
                    if is_ai_running:
                        print("🎥 Camera Starting...")
                        if cap is None or not cap.isOpened():
                            cap = cv2.VideoCapture(0) # Open Webcam
                    else:
                        print("🛑 Camera Stopping...")
                        if cap is not None:
                            cap.release()
                            cap = None
                        app_state["is_armed"] = False
                        
                elif message.get("type") == "RESET_STATE":
                    # React tells us the rewind finished, ready for next command
                    app_state["is_armed"] = False
                    
            except asyncio.TimeoutError:
                pass # No button clicked, continue to camera processing

            # B. Process Webcam Frames if AI is Active
            if is_ai_running and cap is not None and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # Convert for MediaPipe
                img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(img_rgb)
                
                if results.multi_hand_landmarks:
                    # Get Handedness (Left/Right)
                    hand_label = results.multi_handedness[0].classification[0].label
                    side = 0 if hand_label == 'Left' else 1
                    
                    for hand_landmarks in results.multi_hand_landmarks:
                        # Wrist Normalization
                        wrist_x = hand_landmarks.landmark[0].x
                        wrist_y = hand_landmarks.landmark[0].y
                        
                        # Extract exactly 43 features [side, x0, y0... x20, y20]
                        row = [side]
                        for landmark in hand_landmarks.landmark:
                            row.extend([landmark.x - wrist_x, landmark.y - wrist_y])
                        
                        # Make Prediction
                        if model:
                            prediction = model.predict([row])[0]
                            
                            # --- CORE STATE MACHINE LOGIC ---
                            if not app_state["is_armed"]:
                                # Waiting for Fist to open menu
                                if prediction == '0':
                                    app_state["is_armed"] = True
                                    await websocket.send_text(json.dumps({"status": "ARMED"}))
                                    print("✊ FIST DETECTED: Menu Opened!")
                                    await asyncio.sleep(1.5) # Arming cooldown
                            else:
                                # System is Armed, waiting for a command
                                if prediction == '0':
                                    # Show fist again to manually cancel
                                    app_state["is_armed"] = False
                                    await websocket.send_text(json.dumps({"status": "DISARMED"}))
                                    print("✊ FIST DETECTED: Menu Closed manually.")
                                    await asyncio.sleep(1.0)
                                    
                                elif prediction in COMMAND_MAP:
                                    cmd_name, cooldown = COMMAND_MAP[prediction]
                                    
                                    # Send command to React!
                                    await websocket.send_text(json.dumps({
                                        "status": "TRIGGERED", 
                                        "command": prediction,
                                        "command_name": cmd_name
                                    }))
                                    print(f"⚡ EXECUTED: {cmd_name}")
                                    
                                    # Auto-disarm so React can rewind and play
                                    app_state["is_armed"] = False
                                    
                                    # Dynamic Cooldown
                                    await asyncio.sleep(cooldown)
                
                # Prevent the while loop from blocking other async tasks
                await asyncio.sleep(0.01)

    except WebSocketDisconnect:
        print("❌ React UI Disconnected")
    finally:
        # Failsafe: Turn off camera if browser is closed
        if cap is not None:
            cap.release()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Velloc WebSocket Server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
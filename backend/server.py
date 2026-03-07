import cv2
import mediapipe as mp
import pickle
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# --- 1. Load the AI Model ---
print("Loading AI Model...")
with open('vlc_gesture_model_v2.pkl', 'rb') as f:
    model = pickle.load(f)

COMMAND_MAP = {
    '0': ('STANDBY', 0),
    '1': ('PLAY/PAUSE', 1.5),
    '2': ('VOL UP', 0.1),
    '3': ('VOL DOWN', 0.1),
    '4': ('FORWARD 10s', 0.5),
    '5': ('REWIND 10s', 0.5),
    '6': ('NEXT TRACK', 2.0),
    '7': ('PREV TRACK', 2.0),
    '8': ('SUBTITLES', 1.0),
    '9': ('SPEED UP', 0.5),
    'a': ('ASPECT RATIO', 1.0),
    'b': ('AUDIO TRACK', 1.0),
    'd': ('SPEED DOWN', 0.5),
    'f': ('FULLSCREEN', 1.5),
    'm': ('MUTE', 1.5),
    's': ('SNAPSHOT', 2.0)
}

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.8)

# --- 2. The State Machine ---
app_state = {
    "is_active": False,  # Toggled by the React UI button
    "is_armed": False    # Triggered by the Fist gesture ('0')
}

# --- 3. The WebSocket Bridge ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("React UI Connected!")
    cap = cv2.VideoCapture(0)
    
    try:
        while True:
            # 1. Listen for messages from React (non-blocking)
            try:
                # Wait 10ms for a message. If none, move on to the camera.
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                message = json.loads(data)
                
                if message.get("type") == "TOGGLE_AI":
                    app_state["is_active"] = message.get("value")
                    app_state["is_armed"] = False # Always reset when toggled
                    print(f"AI Active: {app_state['is_active']}")
                    
                elif message.get("type") == "RESET_STATE":
                    app_state["is_armed"] = False
                    print("System Disarmed. Listening for Fist...")
                    
            except asyncio.TimeoutError:
                pass # No message received, perfectly normal

            # 2. Camera & AI Logic
            if app_state["is_active"]:
                success, img = cap.read()
                if success:
                    img = cv2.flip(img, 1)
                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    results = hands.process(rgb)

                    if results.multi_hand_landmarks:
                        hand_landmarks = results.multi_hand_landmarks[0]
                        hand_label = results.multi_handedness[0].classification[0].label
                        side = 0 if hand_label == 'Left' else 1
                        
                        wrist_x = hand_landmarks.landmark[0].x
                        wrist_y = hand_landmarks.landmark[0].y
                        
                        features = [side]
                        for lm in hand_landmarks.landmark:
                            features.extend([lm.x - wrist_x, lm.y - wrist_y])
                        
                        prediction = model.predict([features])[0]

                        # --- YOUR CUSTOM WORKFLOW LOGIC ---
                        
                        if not app_state["is_armed"]:
                            # System is OFF. Wait for Fist (0) to turn ON.
                            if prediction == '0':
                                app_state["is_armed"] = True
                                await websocket.send_text(json.dumps({"status": "ARMED"}))
                                print("FIST DETECTED: Menu Opened!")
                                await asyncio.sleep(1.5) # Global arming cooldown
                        else:
                            # System is ON.
                            if prediction == '0':
                                app_state["is_armed"] = False
                                await websocket.send_text(json.dumps({"status": "DISARMED"}))
                                print("FIST DETECTED: Menu Closed. Resuming...")
                                await asyncio.sleep(1.5)
                            elif prediction in COMMAND_MAP:
                                cmd_name, cooldown = COMMAND_MAP[prediction]
                                
                                # Send both the class ('2') and the name ('VOL UP') to React
                                await websocket.send_text(json.dumps({
                                    "status": "TRIGGERED", 
                                    "command": prediction,
                                    "command_name": cmd_name
                                }))
                                print(f"EXECUTED: {cmd_name} (Cooldown: {cooldown}s)")
                                
                                # Use YOUR custom cooldown for this specific gesture!
                                await asyncio.sleep(cooldown) # Give the user time to put their hand down
            else:
                # If the UI toggle is OFF, sleep the loop so we don't fry your CPU
                await asyncio.sleep(0.5) 

    except WebSocketDisconnect:
        print("React UI Disconnected.")
    finally:
        cap.release()

if __name__ == "__main__":
    import uvicorn
    # This keeps the server awake and listening on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
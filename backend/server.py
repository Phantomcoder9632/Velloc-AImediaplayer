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
MODEL_FILE = 'vlc_gesture_model_v2.pkl' 
try:
    with open(MODEL_FILE, 'rb') as f:
        model = pickle.load(f)
    print(f"✅ AI Model loaded: {MODEL_FILE}")
except Exception as e:
    print(f"❌ ERROR: Could not load model {MODEL_FILE}. Error: {e}")
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

# --- 3. STATE TRACKER ---
# Using a dictionary to track state per connection
client_states = {}

@app.get("/")
async def root():
    return {"status": "Velloc API is running", "model_loaded": model is not None}

# --- 4. WEBSOCKET ENGINE ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = id(websocket)
    client_states[client_id] = {"is_armed": False, "last_command_time": 0}
    print(f"🌐 Client Connected: {client_id}")
    
    try:
        while True:
            # Receive landmarks from the Frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # A. Handle Landmark Processing
            if message.get("type") == "LANDMARKS":
                row = message.get("landmarks") # [side, x0, y0... x20, y20]
                
                if model and row:
                    prediction = model.predict([row])[0]
                    state = client_states[client_id]
                    
                    # Logic: 0 (Fist) arms/disarms the system
                    if not state["is_armed"]:
                        if prediction == '0':
                            state["is_armed"] = True
                            await websocket.send_text(json.dumps({"status": "ARMED"}))
                            print(f"✊ [{client_id}] ARMED")
                            await asyncio.sleep(1.0) # Debounce
                    else:
                        if prediction == '0':
                            state["is_armed"] = False
                            await websocket.send_text(json.dumps({"status": "DISARMED"}))
                            print(f"✊ [{client_id}] DISARMED")
                            await asyncio.sleep(1.0)
                            
                        elif prediction in COMMAND_MAP:
                            cmd_name, cooldown = COMMAND_MAP[prediction]
                            
                            # Check cooldown
                            now = asyncio.get_event_loop().time()
                            if now - state["last_command_time"] > cooldown:
                                await websocket.send_text(json.dumps({
                                    "status": "TRIGGERED", 
                                    "command": prediction,
                                    "command_name": cmd_name
                                }))
                                print(f"⚡ [{client_id}] EXECUTED: {cmd_name}")
                                state["is_armed"] = False
                                state["last_command_time"] = now
            
            # B. Handle Manual State Resets
            elif message.get("type") == "RESET_STATE":
                client_states[client_id]["is_armed"] = False

    except WebSocketDisconnect:
        print(f"❌ Client Disconnected: {client_id}")
        if client_id in client_states:
            del client_states[client_id]

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting Velloc WebSocket Server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
import cv2
import mediapipe as mp
import numpy as np
import pickle
import pyautogui
import os
import time

# --- 1. Load the Trained Model ---
MODEL_PATH = 'vlc_gesture_model_v2.pkl'
with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)

# --- 2. ADB Helper for Android ---
def send_adb(keycode):
    """Sends a keyevent to an Android device via ADB."""
    try:
        # Standard media keycodes: 85=Play/Pause, 24=Vol+, 25=Vol-, 87=Next, 88=Prev, 164=Mute
        os.system(f"adb shell input keyevent {keycode}")
    except:
        pass # Ignore if phone isn't connected

# --- 3. Configuration & Cooldowns ---
# Dictionary to map labels to text and cooldown times
# (0-9, a, b, d, f, m, s)
COMMANDS = {
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

last_cmd_time = 0

# --- 4. Initialize MediaPipe ---
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.8)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, img = cap.read()
    if not success: break

    img = cv2.flip(img, 1)
    h, w, c = img.shape
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        hand_label = results.multi_handedness[0].classification[0].label
        side = 0 if hand_label == 'Left' else 1 # Matches training data
        
        mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        # Normalization (Wrist-based)
        # $X_{norm} = X - X_{wrist}$
        # $Y_{norm} = Y - Y_{wrist}$
        wrist_x = hand_landmarks.landmark[0].x
        wrist_y = hand_landmarks.landmark[0].y
        
        features = [side]
        for lm in hand_landmarks.landmark:
            features.extend([lm.x - wrist_x, lm.y - wrist_y])

        # --- 5. Prediction ---
        prediction = model.predict([features])[0]
        cmd_name, cooldown = COMMANDS.get(prediction, ("UNKNOWN", 0))

        # --- 6. Execution Logic ---
        current_time = time.time()
        
        if current_time - last_cmd_time > cooldown:
            if prediction == '1': # Play/Pause
                pyautogui.press('space')
                send_adb(85)
            elif prediction == '2': # Vol Up
                pyautogui.press('up')
                send_adb(24)
            elif prediction == '3': # Vol Down
                pyautogui.press('down')
                send_adb(25)
            elif prediction == '4': # Forward
                pyautogui.hotkey('alt', 'right')
                send_adb(90)
            elif prediction == '5': # Rewind
                pyautogui.hotkey('alt', 'left')
                send_adb(89)
            elif prediction == '6': # Next Track (Left hand L)
                pyautogui.press('n')
                send_adb(87)
            elif prediction == '7': # Prev Track (Right hand L)
                pyautogui.press('p')
                send_adb(88)
            elif prediction == '8': # Subtitles
                pyautogui.press('v')
            elif prediction == '9': # Speed Up
                pyautogui.press(']')
            elif prediction == 'a': # Aspect Ratio
                pyautogui.press('a')
            elif prediction == 'b': # Audio Track
                pyautogui.press('b')
            elif prediction == 'd': # Speed Down
                pyautogui.press('[')
            elif prediction == 'f': # Fullscreen
                pyautogui.press('f')
            elif prediction == 'm': # Mute
                pyautogui.press('m')
                send_adb(164)
            elif prediction == 's': # Snapshot (Pinch)
                pyautogui.hotkey('shift', 's')

            if prediction != '0': # Don't update cooldown for standby
                last_cmd_time = current_time

        # UI Feedback
        color = (0, 255, 0) if prediction != '0' else (0, 0, 255)
        cv2.putText(img, f"CMD: {cmd_name}", (20, 60), cv2.FONT_HERSHEY_DUPLEX, 1.5, color, 2)
        cv2.putText(img, f"HAND: {hand_label}", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)

    cv2.imshow("VLC AI Controller", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
import cv2
import mediapipe as mp
import csv
import os

# --- Configuration ---
CSV_FILE = 'vlc_gesture_dataset_v1.csv'

# All 15 Features + Standby
CLASSES = {
    '0': 'Standby (Fist)',
    '1': 'Play/Pause (Open Palm)',
    '2': 'Vol Up (Thumbs Up)',
    '3': 'Vol Down (Thumbs Down)',
    '4': 'Forward (Point Right)',
    '5': 'Rewind (Point Left)',
    '6': 'Next Track (L-Shape Left)',
    '7': 'Prev Track (L-Shape Right)',
    '8': 'Subtitles (Peace Sign)',
    '9': 'Speed Up (Rock On)',
    'a': 'Aspect Ratio (4 Fingers)',
    'b': 'Audio Track (3 Fingers)',
    'f': 'Fullscreen (OK Sign)',
    'm': 'Mute (Pinky Up)',
    's': 'Snapshot (Pinch)',
    'd': 'Speed Down (Shaka)'
}

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.8, min_tracking_confidence=0.8)
mp_draw = mp.solutions.drawing_utils

# Create CSV and write headers if it doesn't exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='') as f:
        writer = csv.writer(f)
        headers = ['label', 'side']
        for i in range(21):
            headers.extend([f'x{i}', f'y{i}'])
        writer.writerow(headers)

cap = cv2.VideoCapture(0)
counters = {key: 0 for key in CLASSES.keys()}

print("\n--- VLC Pro Recording Mode ---")
print("Hold the gesture and press the corresponding key to save frames.")

while True:
    success, img = cap.read()
    if not success: break
    
    img = cv2.flip(img, 1)
    h, w, c = img.shape
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks:
        # We only process one hand at a time for the dataset
        hand_landmarks = results.multi_hand_landmarks[0]
        hand_label = results.multi_handedness[0].classification[0].label
        
        # 0 for Left, 1 for Right
        side = 0 if hand_label == 'Left' else 1
        
        mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        # Normalization
        wrist_x = hand_landmarks.landmark[0].x
        wrist_y = hand_landmarks.landmark[0].y
        
        normalized_row = []
        for lm in hand_landmarks.landmark:
            normalized_row.extend([lm.x - wrist_x, lm.y - wrist_y])

        # Capture Keypress
        key = cv2.waitKey(1) & 0xFF
        char_key = chr(key)
        
        if char_key in CLASSES:
            # Logic check for the "L" shape hands
            if char_key == '6' and hand_label != 'Left':
                print("Error: Use LEFT hand for Next Track L-shape")
            elif char_key == '7' and hand_label != 'Right':
                print("Error: Use RIGHT hand for Prev Track L-shape")
            else:
                with open(CSV_FILE, mode='a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([char_key, side] + normalized_row)
                
                counters[char_key] += 1
                cv2.circle(img, (w-50, 50), 20, (0, 255, 0), cv2.FILLED)

    # UI Overlay
    y_pos = 30
    cv2.putText(img, "REC MODE", (10, y_pos), cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 255), 2)
    
    # Split display into two columns if the list gets too long
    for i, (k, v) in enumerate(counters.items()):
        col = 10 if i < 8 else 220
        row = 60 + (i % 8) * 30
        cv2.putText(img, f"{k}: {v}", (col, row), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    cv2.imshow("VLC Data Collection", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
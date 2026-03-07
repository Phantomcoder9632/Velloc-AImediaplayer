import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle

# 1. Load the dataset
CSV_FILE = 'vlc_gesture_dataset_v1.csv'
data = pd.read_csv(CSV_FILE)

# 2. Split Features (X) and Labels (y)
# X contains the 'side' and all 42 normalized landmark coordinates
X = data.drop('label', axis=1)
y = data['label']

# 3. Split into Training and Testing sets (70% Train, 30% Test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

print(f"Training on {len(X_train)} samples...")

# 4. Initialize and Train the Random Forest
# We use 100 trees (n_estimators) for a good balance of speed and accuracy
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate the Model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n--- Model Evaluation ---")
print(f"Accuracy Score: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 6. Save the trained model to a file
MODEL_NAME = 'vlc_gesture_model_v2.pkl'
with open(MODEL_NAME, 'wb') as f:
    pickle.dump(model, f)

print(f"\nSuccess! Model saved as {MODEL_NAME}")
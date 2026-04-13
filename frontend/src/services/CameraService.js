/**
 * CameraService.js
 * Manages the webcam and MediaPipe Hands processing in the browser.
 * Extracts 43 normalized landmark features and calls onLandmarks.
 * Uses CDN-loaded MediaPipe (loaded via index.html scripts).
 */

export class CameraService {
  constructor(videoElement, onLandmarks) {
    this.videoElement = videoElement;
    this.onLandmarks = onLandmarks;
    this.hands = null;
    this.camera = null;
    this.isRunning = false;
  }

  async init() {
    // Requires @mediapipe/hands loaded via CDN in index.html
    const { Hands } = window;
    const { Camera } = window;

    this.hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results) => this._processResults(results));

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.isRunning && this.hands) {
          await this.hands.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480,
    });
  }

  _processResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0];

    // Side: 0 = Left, 1 = Right (matches Python training data)
    const side = handedness.label === "Left" ? 0 : 1;

    // Wrist = landmark[0], normalize all coords relative to it
    const wristX = landmarks[0].x;
    const wristY = landmarks[0].y;

    // Build 43-feature array: [side, x0, y0, x1, y1 ... x20, y20]
    const row = [side];
    for (const lm of landmarks) {
      row.push(lm.x - wristX);
      row.push(lm.y - wristY);
    }

    this.onLandmarks(row);
  }

  async start() {
    if (!this.hands) await this.init();
    this.isRunning = true;
    await this.camera.start();
  }

  async stop() {
    this.isRunning = false;
    if (this.camera) await this.camera.stop();
  }
}

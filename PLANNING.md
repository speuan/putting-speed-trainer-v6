# PLANNING.md

## Project Name
Golf Putting Speed Trainer (PWA)

## Goal
Create a browser-based (PWA) tool that allows users to analyze the speed of golf putts using their mobile camera. The app will record, process, and track a golf ball to compute speed and motion metrics.

---

## Scope

### Core Features
- Static camera setup assumed (no large camera motion).
- Golf ball and coin detection via computer vision.
- Use HTML5 video and canvas for frame capture.
- Record putt then calculate speed after.
- Calibrate pixel-to-real-world distance ratio using coins or markers laid out in known geometry.
- PWA capabilities: offline support, mobile-friendly.

### Future Extensions
- TBD

---

## Architecture

### Frontend (PWA)
- **HTML/CSS/JS** frontend using Web APIs (`getUserMedia`, `Canvas`)
- UI for camera controls, recording, and playback
- Optional TensorFlow.js for object detection

### Computer Vision Component
- **Feature Detection** use FAST or some other efficient algorithm to determine marker positions and use some sort of homography to determine golf ball location relative to the markers.
- Speed estimation using frame displacement and known dimensions (calibration)




### Storage
- In-memory array for recorded frames.
- Optional: use IndexedDB for persistence.

---

## Technology Stack

| Component | Tech |
| --------- | ---- |
| Frontend  | Vanilla JS, HTML5, CSS |
| Detection | TensorFlow.js (custom-trained model) |
| UI        | Responsive, mobile-first layout |
| Hosting   | GitHub Pages, Netlify, or Firebase Hosting |
| PWA       | Service Workers, Web App Manifest (later) |

---

## Key Design Considerations
- Model size must be small for fast browser performance.
- Must work offline once loaded (PWA requirement).
- Frame rate and resolution affect detection accuracy vs performance.

## Naming Conventions

### Files and Folders
- Use **lowercase** letters with **hyphens** (`-`) to separate words.
  - Example: `camera-controller.js`, `speed-calculation.js`

### Variables and Functions
- Use **camelCase** for variables and function names.
  - Example: `captureFrame()`, `calculateBallSpeed()`

### Classes
- Use **PascalCase** for class names.
  - Example: `BallTracker`, `SpeedEstimator`

### Constants
- Use **UPPER_SNAKE_CASE** for constants.
  - Example: `PIXEL_TO_CM_RATIO`, `FRAME_CAPTURE_INTERVAL`

### Model and AI Files
- Model files should be prefixed with `model-` and use hyphens.
  - Example: `model-golf-ball-detection.json`

---

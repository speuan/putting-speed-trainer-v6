# Putting Speed Trainer v6

Static browser prototype for measuring putting speed from a phone camera.

## Run locally

Serve the folder over HTTP. Camera access and service workers do not behave reliably from `file://`.

```sh
npm run serve
```

Then open `http://localhost:8080`.

On Windows PowerShell, use `npm.cmd run serve` if script execution policy blocks `npm`.

## Publish to GitHub Pages

This repo can be served directly from GitHub Pages because `index.html` is in the repository root.

1. Push these files to `main`.
2. In GitHub, open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and folder to `/ (root)`.
5. Save and wait for GitHub to publish the site.

The expected URL is:

```text
https://speuan.github.io/putting-speed-trainer-v6/
```

## Test on iPhone

Open the GitHub Pages URL in Safari. Camera access requires HTTPS, which GitHub Pages provides.

Tap **Start Camera**, allow camera permission, then use **Setup Markers**. If you want the standalone app experience, use Safari's share button and choose **Add to Home Screen**.

Place four distinct high-contrast physical markers on the floor or mat and tap their centers during setup. After setup, the start and finish lines stay fixed at the tapped marker positions.

Version `v13 next putt` keeps the fixed start/finish gate flow from `v12 sampled ball gate`, and adds a `Next Putt` action after each result so you can re-arm for another putt without redoing marker and ball setup. Set the real distance between the two gates, tap two start-gate markers, two finish-gate markers, then tap the ball so the app can sample its size, colour, and brightness. After a result, tap `Next Putt`, reset the ball, and hit the next putt through the same gates. This test build unregisters the old service worker to avoid stale JavaScript on iPhone Safari.

## Check syntax

```sh
npm run check
```

## Current architecture

- `src/js/camera/CameraController.js` starts and switches the camera.
- `src/js/tracking/MarkerTracker.js` handles marker setup, ball template capture, ROI comparison, and ball tracking.
- `src/js/recording/RecordingController.js` records the camera stream using the best supported browser codec.
- `src/js/analysis/AnalysisController.js` replays a recorded putt frame by frame and finds start/end crossings.
- `service-worker.js` caches the static app shell for PWA use.

## Known limits

- Speed depends on the user-provided calibration distance between the first marker pair.
- Template matching runs on the main thread and should move to a worker if performance becomes choppy.
- The app has syntax checks only; geometry and speed calculation should get unit tests next.

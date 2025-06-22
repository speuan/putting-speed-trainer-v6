import { CameraController } from './camera/CameraController.js';
import { UIController } from './ui/UIController.js';
import { MarkerTracker } from './tracking/MarkerTracker.js';
import { lineIntersect } from './utils/geometry.js';

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const startCameraBtn = document.getElementById('start-camera-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const setupMarkersBtn = document.getElementById('setup-markers-btn');
    const instructionsEl = document.getElementById('instructions');
    const statusIndicatorEl = document.getElementById('status-indicator');
    const resultsContainerEl = document.getElementById('results-container');
    const speedDisplayEl = document.getElementById('speed-display');

    const camera = new CameraController(videoElement);
    const ui = new UIController({
        startCameraBtn,
        switchCameraBtn,
        setupMarkersBtn,
        instructionsEl,
        statusIndicatorEl,
        resultsContainerEl,
        speedDisplayEl,
        canvas: canvasElement
    });
    const tracker = new MarkerTracker(videoElement, canvasElement, ui);

    // --- Main Animation Loop ---
    let isMarkerSetupActive = false;
    let hasCrossedStart = false;
    let hasCrossedEnd = false;
    let startTime = 0;

    function animationLoop() {
        const state = tracker.getState();

        if (state.state === 'ARMED') {
            tracker.trackBall(videoElement);

            // Get the updated state after tracking
            const { ball, ballPrevious, markers } = tracker.getState();

            // Check for line crossings if the ball has moved
            if (ball && ballPrevious && !hasCrossedEnd) {
                const ballPath = { p1: ballPrevious, p2: ball };
                
                // Check start line
                if (!hasCrossedStart) {
                    const startLine = { p1: markers[0], p2: markers[1] };
                    if (lineIntersect(ballPath.p1, ballPath.p2, startLine.p1, startLine.p2)) {
                        hasCrossedStart = true;
                        startTime = performance.now(); // Record start time
                        ui.updateStatus('Start line crossed!');
                        console.log('Start line crossed');
                    }
                }

                // Check end line (only if start has been crossed)
                if (hasCrossedStart) {
                    const endLine = { p1: markers[2], p2: markers[3] };
                    if (lineIntersect(ballPath.p1, ballPath.p2, endLine.p1, endLine.p2)) {
                        hasCrossedEnd = true;
                        const endTime = performance.now(); // Record end time
                        
                        const timeInSeconds = (endTime - startTime) / 1000;
                        
                        // Calculate distance
                        const startLineMid = { x: (markers[0].x + markers[1].x) / 2, y: (markers[0].y + markers[1].y) / 2 };
                        const endLineMid = { x: (markers[2].x + markers[3].x) / 2, y: (markers[2].y + markers[3].y) / 2 };
                        const pixelDistance = Math.sqrt(Math.pow(endLineMid.x - startLineMid.x, 2) + Math.pow(endLineMid.y - startLineMid.y, 2));

                        // This is a placeholder until calibration is implemented
                        const PIXELS_PER_METER = 500; 
                        const distanceInMeters = pixelDistance / PIXELS_PER_METER;
                        
                        const speedMps = distanceInMeters / timeInSeconds;
                        const speedMph = speedMps * 2.23694;

                        ui.showResults({ speedMph, speedMps });
                        ui.updateStatus('Finished!');
                        console.log(`Finished! Time: ${timeInSeconds.toFixed(2)}s, Speed: ${speedMph.toFixed(2)} mph (${speedMps.toFixed(2)} m/s)`);
                    }
                }
            }
        }

        if (isMarkerSetupActive || state.state === 'ARMED') {
            const updatedState = tracker.getState();
            updatedState.videoElement = videoElement;
            ui.render(updatedState);
        }
        requestAnimationFrame(animationLoop);
    }
    // --- End of Animation Loop ---

    startCameraBtn.addEventListener('click', async () => {
        try {
            await camera.start();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            // --- Aspect Ratio Correction ---
            const videoContainer = document.querySelector('.video-container');
            const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            videoContainer.style.height = `${videoContainer.clientWidth / aspectRatio}px`;
            // --- End of Correction ---

            ui.onCameraStarted();
            requestAnimationFrame(animationLoop); // Start the animation loop
        } catch (error) {
            console.error('Failed to start camera:', error);
            instructionsEl.textContent = 'Could not start camera. Please check permissions.';
        }
    });

    switchCameraBtn.addEventListener('click', async () => {
        try {
            await camera.switchCamera();
        } catch (error) {
            console.error('Failed to switch camera:', error);
            instructionsEl.textContent = 'Could not switch camera.';
        }
    });

    setupMarkersBtn.addEventListener('click', async () => {
        isMarkerSetupActive = true;
        hasCrossedStart = false;
        hasCrossedEnd = false;
        ui.startMarkerSetup();
        ui.promptForMarker(0);

        const progressCallback = (tracker) => {
            const state = tracker.getState();

            if (state.state === 'AWAITING_MARKERS') {
                const markerCount = state.markers.length;
                if (markerCount < 4) {
                    ui.promptForMarker(markerCount);
                }
            } else if (state.state === 'AWAITING_BALL') {
                ui.onSetupComplete();
                ui.promptForBall();
            } else if (state.state === 'ARMED') {
                ui.onArmingComplete();
                isMarkerSetupActive = false;
            }
        };
        
        tracker.startSetup(progressCallback);
    });
}); 
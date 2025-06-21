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

    function animationLoop() {
        const state = tracker.getState();

        if (state.state === 'ARMED') {
            tracker.trackBall(videoElement);

            const { ball, ballPrevious, markers } = tracker.getState();

            // Check for line crossings if the ball has moved
            if (ballPrevious && !hasCrossedEnd) {
                const ballPath = { p1: ballPrevious, p2: ball };
                
                // Check start line
                if (!hasCrossedStart) {
                    const startLine = { p1: markers[0], p2: markers[1] };
                    if (lineIntersect(ballPath.p1, ballPath.p2, startLine.p1, startLine.p2)) {
                        hasCrossedStart = true;
                        ui.updateStatus('Start line crossed!');
                        console.log('Start line crossed');
                    }
                }

                // Check end line (only if start has been crossed)
                if (hasCrossedStart) {
                    const endLine = { p1: markers[2], p2: markers[3] };
                    if (lineIntersect(ballPath.p1, ballPath.p2, endLine.p1, endLine.p2)) {
                        hasCrossedEnd = true;
                        ui.updateStatus('Finished!');
                        console.log('End line crossed');
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
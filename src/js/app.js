import { CameraController } from './camera/CameraController.js';
import { UIController } from './ui/UIController.js';
import { MarkerTracker } from './tracking/MarkerTracker.js';

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
    function animationLoop() {
        if (isMarkerSetupActive) {
            const state = tracker.getState();
            state.videoElement = videoElement; // Add video element to state for rendering
            ui.render(state);
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
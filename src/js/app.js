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

    const camera = new CameraController(videoElement);
    const ui = new UIController({
        startCameraBtn,
        switchCameraBtn,
        setupMarkersBtn,
        instructionsEl,
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

        const progressCallback = (markers) => {
            if (markers.length < 4) {
                ui.promptForMarker(markers.length);
            } else {
                ui.onSetupComplete();
                isMarkerSetupActive = false;
            }
        };
        
        tracker.startSetup(progressCallback);
    });
}); 
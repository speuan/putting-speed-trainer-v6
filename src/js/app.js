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
    const tracker = new MarkerTracker(videoElement, canvasElement);

    startCameraBtn.addEventListener('click', async () => {
        try {
            await camera.start();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            ui.onCameraStarted();
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
        ui.startMarkerSetup();
        ui.clearCanvas();
        ui.promptForMarker(0); // Prompt for the first marker

        const progressCallback = (markers) => {
            // Draw the most recently added marker
            ui.drawMarker(markers[markers.length - 1]);
            // If not yet 4, prompt for the next one
            if (markers.length < 4) {
                ui.promptForMarker(markers.length);
            }
        };

        tracker.startSetup(progressCallback).then(markers => {
             console.log('Markers set at:', markers);
             ui.onSetupComplete();
        });
    });
}); 
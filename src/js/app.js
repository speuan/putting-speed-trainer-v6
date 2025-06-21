import { CameraController } from './camera/CameraController.js';
import { UIController } from './ui/UIController.js';
import { MarkerTracker } from './tracking/MarkerTracker.js';

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const startCameraBtn = document.getElementById('start-camera-btn');
    const setupMarkersBtn = document.getElementById('setup-markers-btn');
    const instructionsEl = document.getElementById('instructions');

    const camera = new CameraController(videoElement);
    const ui = new UIController({
        startCameraBtn,
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

    setupMarkersBtn.addEventListener('click', async () => {
        ui.startMarkerSetup();
        ui.clearCanvas();
        
        for (let i = 0; i < 4; i++) {
            ui.promptForMarker(i);
            // This is a simplified way to wait for a click.
            // A more robust solution would use a custom event or promise wrapper.
            await new Promise(resolve => {
                const listener = (event) => {
                    const rect = canvasElement.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    ui.drawMarker({x, y});
                    canvasElement.removeEventListener('click', listener);
                    resolve();
                };
                canvasElement.addEventListener('click', listener);
            });
        }
        
        tracker.startSetup().then(markers => {
             console.log('Markers set at:', markers);
             ui.onSetupComplete();
        });
    });
}); 
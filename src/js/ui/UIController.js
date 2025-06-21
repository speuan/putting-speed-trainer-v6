export class UIController {
    constructor(options) {
        this.startCameraBtn = options.startCameraBtn;
        this.switchCameraBtn = options.switchCameraBtn;
        this.setupMarkersBtn = options.setupMarkersBtn;
        this.instructionsEl = options.instructionsEl;
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    onCameraStarted() {
        this.startCameraBtn.disabled = true;
        this.switchCameraBtn.disabled = false;
        this.setupMarkersBtn.disabled = false;
        this.instructionsEl.textContent = 'Camera started. Click "Setup Markers" to begin.';
    }

    startMarkerSetup() {
        this.setupMarkersBtn.disabled = true;
        this.instructionsEl.textContent = 'Click on the four corners of the putting area.';
        this.canvas.style.pointerEvents = 'auto'; 
    }

    promptForMarker(markerIndex) {
        this.instructionsEl.textContent = `Click to set marker #${markerIndex + 1}`;
    }

    drawMarker(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'red';
        this.ctx.fill();
    }

    onSetupComplete() {
        this.instructionsEl.textContent = 'Marker setup complete. Monitoring for drift.';
        this.canvas.style.pointerEvents = 'none';
    }

    drawTrackedMarkers(markers) {
        this.clearCanvas();
        this.ctx.fillStyle = 'green';
        markers.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI); // Slightly larger for visibility
            this.ctx.fill();
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
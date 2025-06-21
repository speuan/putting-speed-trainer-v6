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

    drawLoupe(x, y, videoElement, existingMarkers = [], magnification = 3) {
        const loupeSize = 150; // The size of the loupe display on canvas
        const sourceSize = loupeSize / magnification; // The size of the region to copy from the video

        this.clearCanvas();
        
        // Redraw existing markers first so they are under the loupe
        existingMarkers.forEach(marker => this.drawMarker(marker));

        // --- Loupe Drawing Logic ---
        const yOffset = -100; // Draw the loupe 100px above the touch point
        const loupeCenterX = x;
        const loupeCenterY = y + yOffset;

        this.ctx.save();
        
        // Draw a "tail" connecting the touch point to the loupe
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(loupeCenterX, loupeCenterY);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Create a circular clipping path for the loupe
        this.ctx.beginPath();
        this.ctx.arc(loupeCenterX, loupeCenterY, loupeSize / 2, 0, Math.PI * 2);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
        this.ctx.clip();

        // Draw the magnified video content (source is original touch, destination is the loupe)
        this.ctx.drawImage(
            videoElement,
            x - (sourceSize / 2), // source x
            y - (sourceSize / 2), // source y
            sourceSize,           // source width
            sourceSize,           // source height
            loupeCenterX - (loupeSize / 2),  // destination x
            loupeCenterY - (loupeSize / 2),  // destination y
            loupeSize,            // destination width
            loupeSize             // destination height
        );

        this.ctx.restore();

        // Draw crosshairs in the center of the loupe
        this.ctx.beginPath();
        this.ctx.moveTo(loupeCenterX - 10, loupeCenterY);
        this.ctx.lineTo(loupeCenterX + 10, loupeCenterY);
        this.ctx.moveTo(loupeCenterX, loupeCenterY - 10);
        this.ctx.lineTo(loupeCenterX, loupeCenterY + 10);
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    hideLoupe(existingMarkers = []) {
        this.clearCanvas();
        existingMarkers.forEach(marker => this.drawMarker(marker));
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
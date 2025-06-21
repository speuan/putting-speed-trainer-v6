export class MarkerTracker {
    constructor(videoElement, canvas) {
        this.videoElement = videoElement;
        this.canvas = canvas;
        this.markers = [];
        this.markerRegions = [];
        this.isSetup = false;
        this.driftCheckInterval = null;
    }

    startSetup(progressCallback) {
        this.markers = [];
        this.markerRegions = [];
        this.isSetup = false;
        if (this.driftCheckInterval) {
            clearInterval(this.driftCheckInterval);
            this.driftCheckInterval = null;
        }
        return new Promise((resolve) => {
            const clickHandler = (event) => {
                const rect = this.canvas.getBoundingClientRect();

                // Calculate the scale between the canvas's display size and its drawing buffer size
                const scaleX = this.canvas.width / this.canvas.clientWidth;
                const scaleY = this.canvas.height / this.canvas.clientHeight;

                // Adjust the click coordinates by the scaling factors
                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;

                const point = { x, y };
                this.markers.push(point);
                
                if (progressCallback) {
                    progressCallback(this.markers);
                }
                
                if (this.markers.length === 4) {
                    this.canvas.removeEventListener('click', clickHandler);
                    this.captureMarkerRegions();
                    this.isSetup = true;
                    this.startDriftDetection();
                    resolve(this.markers);
                }
            };
            this.canvas.addEventListener('click', clickHandler);
        });
    }

    captureMarkerRegions() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.videoElement.videoWidth;
        tempCanvas.height = this.videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

        const regionSize = 30; 
        this.markers.forEach(marker => {
            const imageData = tempCtx.getImageData(marker.x - regionSize / 2, marker.y - regionSize / 2, regionSize, regionSize);
            this.markerRegions.push(imageData);
        });
        console.log('Marker regions captured.');
    }

    startDriftDetection() {
        this.driftCheckInterval = setInterval(() => {
            this.checkForDrift();
        }, 5000);
    }

    checkForDrift() {
        if (!this.isSetup) return;

        console.log('Checking for marker drift...');
        // In a real implementation, we would compare the current video frame
        // with the stored markerRegions.
        // For now, this is a placeholder.
    }
} 
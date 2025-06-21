export class MarkerTracker {
    constructor(videoElement, canvas, uiController) {
        this.videoElement = videoElement;
        this.canvas = canvas;
        this.uiController = uiController;
        this.markers = [];
        this.markerRegions = [];
        this.isSetup = false;
        this.driftCheckInterval = null;
        this.currentTouch = null;
    }

    getState() {
        return {
            markers: this.markers,
            loupe: this.currentTouch,
        };
    }

    startSetup(progressCallback) {
        this.markers = [];
        this.markerRegions = [];
        this.isSetup = false;
        if (this.driftCheckInterval) {
            clearInterval(this.driftCheckInterval);
            this.driftCheckInterval = null;
        }

        const getTouchCoords = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0] || event.changedTouches[0];
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        };
        
        const handleTouchStart = (event) => {
            event.preventDefault();
            this.currentTouch = getTouchCoords(event);
        };

        const handleTouchMove = (event) => {
            event.preventDefault();
            this.currentTouch = getTouchCoords(event);
        };

        const handleTouchEnd = (event) => {
            event.preventDefault();
            const finalPosition = getTouchCoords(event);
            this.markers.push(finalPosition);
            this.currentTouch = null;

            if (progressCallback) {
                progressCallback(this.markers);
            }
            
            if (this.markers.length === 4) {
                this.canvas.removeEventListener('touchstart', handleTouchStart);
                this.canvas.removeEventListener('touchmove', handleTouchMove);
                this.canvas.removeEventListener('touchend', handleTouchEnd);
                this.captureMarkerRegions();
                this.isSetup = true;
                this.startDriftDetection();
            }
        };

        this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
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

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.videoElement.videoWidth;
        tempCanvas.height = this.videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
        const currentFrameData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        const newMarkers = [];
        this.markers.forEach((marker, index) => {
            const markerRegion = this.markerRegions[index];
            const bestMatch = this._findBestMatch(currentFrameData, markerRegion, marker);
            newMarkers.push(bestMatch);
        });

        this.markers = newMarkers;
        this.uiController.drawTrackedMarkers(this.markers);
        console.log('Finished drift check. Markers updated.');
    }

    _findBestMatch(frameData, templateData, lastPosition) {
        const searchRadius = 10; // Search in a 20x20 pixel area around the last position
        let bestMatch = { x: 0, y: 0, score: Infinity };

        // Calculate the expected top-left corner from the last known center position
        const expectedX = lastPosition.x - templateData.width / 2;
        const expectedY = lastPosition.y - templateData.height / 2;

        // Define the search area for the top-left corner
        const startX = Math.round(expectedX - searchRadius);
        const startY = Math.round(expectedY - searchRadius);
        const endX = Math.round(expectedX + searchRadius);
        const endY = Math.round(expectedY + searchRadius);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                let ssd = 0; // Sum of Squared Differences
                
                // Compare the template against the current position in the frame
                for (let ty = 0; ty < templateData.height; ty++) {
                    for (let tx = 0; tx < templateData.width; tx++) {
                        const frameIndex = ((y + ty) * frameData.width + (x + tx)) * 4;
                        const templateIndex = (ty * templateData.width + tx) * 4;

                        // Simple grayscale comparison for performance
                        const framePixel = frameData.data[frameIndex];
                        const templatePixel = templateData.data[templateIndex];
                        const diff = framePixel - templatePixel;
                        ssd += diff * diff;
                    }
                }
                
                if (ssd < bestMatch.score) {
                    bestMatch.score = ssd;
                    bestMatch.x = x;
                    bestMatch.y = y;
                }
            }
        }
        // Return the center of the best-matched region
        return { 
            x: bestMatch.x + templateData.width / 2, 
            y: bestMatch.y + templateData.height / 2 
        };
    }
} 
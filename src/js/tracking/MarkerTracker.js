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
        this.ball = null;
        this.ballPrevious = null;
        this.ballRegion = null;
        this.state = 'IDLE'; // IDLE, AWAITING_MARKERS, AWAITING_BALL, ARMED
    }

    getState() {
        return {
            markers: this.markers,
            ball: this.ball,
            ballPrevious: this.ballPrevious,
            loupe: this.currentTouch,
            state: this.state,
        };
    }

    startSetup(progressCallback) {
        this.markers = [];
        this.ball = null;
        this.state = 'AWAITING_MARKERS';
        this.isSetup = false;
        if (this.driftCheckInterval) {
            clearInterval(this.driftCheckInterval);
            this.driftCheckInterval = null;
        }

        const getTouchCoords = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0] || event.changedTouches[0];

            // Get touch position in CSS pixels relative to the canvas
            const cssX = touch.clientX - rect.left;
            const cssY = touch.clientY - rect.top;
            
            // Convert from CSS pixels to canvas drawing buffer pixels
            const canvasX = cssX * (this.canvas.width / this.canvas.clientWidth);
            const canvasY = cssY * (this.canvas.height / this.canvas.clientHeight);

            return { x: canvasX, y: canvasY };
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
            this.currentTouch = null;

            if (this.state === 'AWAITING_MARKERS') {
                this.markers.push(finalPosition);
                progressCallback(this); // Pass the whole tracker object

                if (this.markers.length === 4) {
                    this.state = 'AWAITING_BALL';
                    this.captureMarkerRegions();
                    progressCallback(this);
                }
            } else if (this.state === 'AWAITING_BALL') {
                this.ball = finalPosition;
                this.ballPrevious = finalPosition; // Initialize previous position
                this.captureBallRegion();
                // Render the bounding box at the marked position before arming
                this.uiController.render({
                    markers: this.markers,
                    ball: this.ball,
                    ballPrevious: this.ballPrevious,
                    loupe: null,
                    state: 'AWAITING_BALL',
                });
                // Delay arming to allow user to see the feedback
                setTimeout(() => {
                    this.isSetup = true;
                    this.state = 'ARMED';
                    progressCallback(this);
                }, 200);

                // Since setup is totally complete, we can remove listeners
                this.canvas.removeEventListener('touchstart', handleTouchStart);
                this.canvas.removeEventListener('touchmove', handleTouchMove);
                this.canvas.removeEventListener('touchend', handleTouchEnd);
                // this.startDriftDetection(); // We will use a different tracking loop later
            }
        };

        this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    captureBallRegion() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.videoElement.videoWidth;
        tempCanvas.height = this.videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

        const regionSize = 30; // Same size as markers for now
        const region = tempCtx.getImageData(this.ball.x - regionSize / 2, this.ball.y - regionSize / 2, regionSize, regionSize);
        this.ballRegion = region;
        console.log('Ball template captured.');
    }

    trackBall(videoElement, roi = null) {
        if (!this.isSetup || !this.ballRegion) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
        const currentFrameData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        // Calculate velocity and set a dynamic search radius
        const velocityX = this.ball.x - this.ballPrevious.x;
        const velocityY = this.ball.y - this.ballPrevious.y;
        const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

        // Predict the next position based on the current velocity
        const predictedPosition = {
            x: this.ball.x + velocityX,
            y: this.ball.y + velocityY,
        };

        // Base search radius + a factor of the velocity
        const searchRadius = 10 + Math.ceil(velocity);

        const bestMatch = this._findBestMatch(currentFrameData, this.ballRegion, predictedPosition, searchRadius, roi);
        this.ballPrevious = { ...this.ball };
        this.ball = bestMatch;
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

    _findBestMatch(frameData, templateData, searchCenter, searchRadius = 10, roi = null) {
        let bestMatch = { x: 0, y: 0, score: Infinity };

        // Calculate the expected top-left corner from the search center position
        const expectedX = searchCenter.x - templateData.width / 2;
        const expectedY = searchCenter.y - templateData.height / 2;

        // Define the search area for the top-left corner
        let startX = Math.round(expectedX - searchRadius);
        let startY = Math.round(expectedY - searchRadius);
        let endX = Math.round(expectedX + searchRadius);
        let endY = Math.round(expectedY + searchRadius);

        // If ROI is provided, clamp the search area to the ROI
        if (roi) {
            startX = Math.max(startX, Math.floor(roi.minX));
            endX = Math.min(endX, Math.ceil(roi.maxX - templateData.width));
            startY = Math.max(startY, Math.floor(roi.minY));
            endY = Math.min(endY, Math.ceil(roi.maxY - templateData.height));
        }

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                let ssd = 0; // Sum of Squared Differences
                for (let ty = 0; ty < templateData.height; ty++) {
                    for (let tx = 0; tx < templateData.width; tx++) {
                        const frameIndex = ((y + ty) * frameData.width + (x + tx)) * 4;
                        const templateIndex = (ty * templateData.width + tx) * 4;
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
        return {
            x: bestMatch.x + templateData.width / 2,
            y: bestMatch.y + templateData.height / 2
        };
    }

    // Utility to get a rectangular ROI around a line
    getLineROI(line, margin = 30) {
        // line: {p1: {x, y}, p2: {x, y}}
        // margin: pixels to expand around the line
        const minX = Math.min(line.p1.x, line.p2.x) - margin;
        const maxX = Math.max(line.p1.x, line.p2.x) + margin;
        const minY = Math.min(line.p1.y, line.p2.y) - margin;
        const maxY = Math.max(line.p1.y, line.p2.y) + margin;
        return { minX, maxX, minY, maxY };
    }
} 
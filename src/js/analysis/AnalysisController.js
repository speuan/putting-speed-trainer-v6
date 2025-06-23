import { lineIntersect } from '../utils/geometry.js';

export default class AnalysisController {
    constructor(videoElement, canvasElement, uiController, markerTracker) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.uiController = uiController;
        this.markerTracker = markerTracker;
        
        this.context = this.canvasElement.getContext('2d');
        this.startTime = null;
        this.endTime = null;
        this.resolveAnalysis = null;
    }

    analyzeVideo(videoBlob) {
        return new Promise((resolve) => {
            this.resolveAnalysis = resolve;
            const videoUrl = URL.createObjectURL(videoBlob);
            this.videoElement.src = videoUrl;

            this.videoElement.addEventListener('loadedmetadata', () => {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
                this.videoElement.play();
                this.videoElement.requestVideoFrameCallback(this._processFrame.bind(this));
            }, { once: true });

            this.videoElement.addEventListener('ended', () => {
                this.uiController.log('Analysis complete.');
                this.uiController.log(`Start Time: ${this.startTime ? this.startTime.toFixed(3) + 's' : 'Not found'}`);
                this.uiController.log(`End Time: ${this.endTime ? this.endTime.toFixed(3) + 's' : 'Not found'}`);

                // Clean up the object URL
                URL.revokeObjectURL(videoUrl);

                if (this.resolveAnalysis) {
                    this.resolveAnalysis({
                        startTime: this.startTime,
                        endTime: this.endTime,
                    });
                }
            }, { once: true });
        });
    }

    _processFrame(now, metadata) {
        if (this.videoElement.ended) {
            return;
        }

        // Use the marker tracker's method to find the ball
        this.markerTracker.trackBall(this.videoElement);
        const { ball, ballPrevious, markers } = this.markerTracker.getState();

        if (!ball || !ballPrevious || markers.length < 4) {
            // Keep requesting frames until we have what we need
            this.videoElement.requestVideoFrameCallback(this._processFrame.bind(this));
            return;
        }

        // Define start and end lines from markers
        const startLine = { p1: markers[0], p2: markers[1] };
        const endLine = { p1: markers[2], p2: markers[3] };
        const ballPath = { p1: ballPrevious, p2: ball };

        // Check for crossing the start line
        if (this.startTime === null && lineIntersect(ballPath.p1, ballPath.p2, startLine.p1, startLine.p2)) {
            this.startTime = metadata.mediaTime;
            this.uiController.log(`Start line crossed at: ${this.startTime.toFixed(3)}s`);
        }

        // Check for crossing the end line
        if (this.endTime === null && lineIntersect(ballPath.p1, ballPath.p2, endLine.p1, endLine.p2)) {
            this.endTime = metadata.mediaTime;
            this.uiController.log(`End line crossed at: ${this.endTime.toFixed(3)}s`);
        }

        // Stop analysis if both timestamps are found
        if (this.startTime !== null && this.endTime !== null) {
            this.videoElement.pause();
            // Manually trigger the 'ended' event logic
            this.videoElement.dispatchEvent(new Event('ended'));
            return;
        }

        // Request the next frame
        this.videoElement.requestVideoFrameCallback(this._processFrame.bind(this));
    }
}

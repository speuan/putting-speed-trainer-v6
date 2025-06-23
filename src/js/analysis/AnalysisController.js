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

        // Assume a common framerate; we can adjust this if needed.
        this.FRAME_RATE = 30;
        this.FRAME_STEP = 1 / this.FRAME_RATE;

        // Bind the 'seeked' event handler once to ensure it can be removed later.
        this._boundOnSeeked = this._onSeeked.bind(this);
    }

    analyzeVideo(videoBlob) {
        this.uiController.log('Analysis: Starting analysis...');
        return new Promise((resolve) => {
            this.resolveAnalysis = resolve;
            this.startTime = null;
            this.endTime = null;

            const videoUrl = URL.createObjectURL(videoBlob);
            this.videoElement.src = videoUrl;

            // Use 'canplaythrough' which is a stronger signal that the video is ready.
            this.videoElement.addEventListener('canplaythrough', () => {
                this.uiController.log('Analysis: Video is ready to play through.');
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
                
                this.uiController.log('Analysis: Beginning frame-by-frame seeking.');
                this.videoElement.addEventListener('seeked', this._boundOnSeeked);
                
                // Add a small delay to ensure readiness before the first seek.
                setTimeout(() => {
                    this.uiController.log('Analysis: Setting currentTime to 0 to trigger first seek.');
                    this.videoElement.currentTime = 0;
                }, 100); // 100ms delay

            }, { once: true });

            this.videoElement.addEventListener('error', (e) => {
                const error = e.target.error;
                this.uiController.log(`Analysis Error: ${error.message} (Code: ${error.code})`);
           });
        });
    }

    _onSeeked() {
        this.uiController.log(`Analysis: Processing frame at ${this.videoElement.currentTime.toFixed(3)}s`);
        this._processFrame();

        const isDone = (this.startTime !== null && this.endTime !== null);
        const isEndOfVideo = this.videoElement.currentTime + this.FRAME_STEP > this.videoElement.duration;

        if (isDone || isEndOfVideo) {
            // --- Analysis is complete ---
            this.uiController.log('Analysis: Finished processing.');
            this.uiController.log(`Final Start Time: ${this.startTime ? this.startTime.toFixed(3) + 's' : 'Not found'}`);
            this.uiController.log(`Final End Time: ${this.endTime ? this.endTime.toFixed(3) + 's' : 'Not found'}`);
            
            // Cleanup
            this.videoElement.removeEventListener('seeked', this._boundOnSeeked);
            URL.revokeObjectURL(this.videoElement.src);
            this.videoElement.src = ''; // Clear source

            if (this.resolveAnalysis) {
                this.resolveAnalysis({ startTime: this.startTime, endTime: this.endTime });
            }
        } else {
            // --- Seek to the next frame ---
            this.videoElement.currentTime += this.FRAME_STEP;
        }
    }

    _processFrame() {
        this.markerTracker.trackBall(this.videoElement);
        const { ball, ballPrevious, markers } = this.markerTracker.getState();

        if (!ball || !ballPrevious || markers.length < 4) {
            return;
        }

        const currentTime = this.videoElement.currentTime;
        const startLine = { p1: markers[0], p2: markers[1] };
        const endLine = { p1: markers[2], p2: markers[3] };
        const ballPath = { p1: ballPrevious, p2: ball };

        if (this.startTime === null && lineIntersect(ballPath.p1, ballPath.p2, startLine.p1, startLine.p2)) {
            this.startTime = currentTime;
            this.uiController.log(`Event: Start line crossed at ${this.startTime.toFixed(3)}s`);
        }

        if (this.endTime === null && lineIntersect(ballPath.p1, ballPath.p2, endLine.p1, endLine.p2)) {
            this.endTime = currentTime;
            this.uiController.log(`Event: End line crossed at ${this.endTime.toFixed(3)}s`);
        }
    }
}

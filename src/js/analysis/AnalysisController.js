import { lineIntersect } from '../utils/geometry.js';

export default class AnalysisController {
    constructor(videoElement, uiController, markerTracker) {
        this.videoElement = videoElement;
        this.uiController = uiController;
        this.markerTracker = markerTracker;
        
        // This canvas is just for internal use by the tracker and is never displayed.
        this.canvasElement = document.createElement('canvas');
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
            this.videoElement.addEventListener('canplaythrough', async () => {
                this.uiController.log('Analysis: Video is ready to play through.');
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
                
                // On mobile, we often need to kickstart the video with play() before we can seek.
                try {
                    await this.videoElement.play();
                    this.videoElement.pause();
                    this.uiController.log('Analysis: Video playback engine started.');
                } catch (err) {
                    this.uiController.log(`Analysis Error: play() failed: ${err.message}`);
                    return; // Can't proceed
                }
                
                this.uiController.log('Analysis: Beginning frame-by-frame seeking.');
                this.videoElement.addEventListener('seeked', this._boundOnSeeked);
                
                // Use requestAnimationFrame for a more reliable seek on the next paint cycle.
                requestAnimationFrame(() => {
                    this.uiController.log('Analysis: Setting currentTime to 0 to trigger first seek.');
                    this.videoElement.currentTime = 0;
                });

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
        // Use ROI for start/finish line
        const { ball, ballPrevious, markers } = this.markerTracker.getState();
        let roi = null;
        if (markers && markers.length === 4) {
            if (this.startTime === null) {
                const startLine = { p1: markers[0], p2: markers[1] };
                roi = this.markerTracker.getLineROI(startLine, 40);
            } else if (this.endTime === null) {
                const endLine = { p1: markers[2], p2: markers[3] };
                roi = this.markerTracker.getLineROI(endLine, 40);
            }
        }
        this.markerTracker.trackBall(this.videoElement, roi);
        const { ball: newBall, ballPrevious: newBallPrevious, markers: newMarkers } = this.markerTracker.getState();
        if (!newBall || !newBallPrevious || newMarkers.length < 4) {
            return;
        }
        const currentTime = this.videoElement.currentTime;
        const startLine = { p1: newMarkers[0], p2: newMarkers[1] };
        const endLine = { p1: newMarkers[2], p2: newMarkers[3] };
        const ballPath = { p1: newBallPrevious, p2: newBall };
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

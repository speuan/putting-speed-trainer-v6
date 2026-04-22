export class RecordingController {
    constructor(stream, onRecordingComplete) {
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder is not available in this browser.');
        }

        this.stream = stream;
        this.onRecordingComplete = onRecordingComplete;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.mimeType = this.getSupportedMimeType();
    }

    getSupportedMimeType() {
        const candidates = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4;codecs=h264',
            'video/mp4'
        ];

        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }

    startRecording() {
        if (!this.stream) {
            console.error("No stream available to record.");
            return;
        }

        this.recordedChunks = [];
        const options = this.mimeType ? { mimeType: this.mimeType } : undefined;
        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || this.mimeType || 'video/webm' });
            this.onRecordingComplete(blob);
        };

        this.mediaRecorder.start();
        console.log(`Recording started with ${this.mediaRecorder.mimeType || 'browser default mime type'}.`);
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            console.log("Recording stopped.");
        }
    }
} 

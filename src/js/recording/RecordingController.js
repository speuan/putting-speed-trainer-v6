export class RecordingController {
    constructor(stream, onRecordingComplete) {
        if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            console.error("VP9 codec is not supported");
            return;
        }
        
        this.stream = stream;
        this.onRecordingComplete = onRecordingComplete;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    startRecording() {
        if (!this.stream) {
            console.error("No stream available to record.");
            return;
        }

        this.recordedChunks = [];
        const options = { mimeType: 'video/webm;codecs=vp9' };
        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.onRecordingComplete(url);
        };

        this.mediaRecorder.start();
        console.log("Recording started.");
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            console.log("Recording stopped.");
        }
    }
} 
export class CameraController {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.stream = null;
        this.currentFacingMode = 'environment'; // Start with the back camera
    }

    async start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not available in this browser.');
        }

        // Stop any existing stream before starting a new one
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: this.currentFacingMode
            }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
        
        return new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                resolve();
            };
        });
    }

    async switchCamera() {
        this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        console.log(`Switching camera to: ${this.currentFacingMode}`);
        await this.start(); // Restart the stream with the new facing mode
    }
} 
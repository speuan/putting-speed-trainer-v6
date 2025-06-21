export class CameraController {
    constructor(videoElement) {
        this.videoElement = videoElement;
    }

    async start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not available in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }
        });

        this.videoElement.srcObject = stream;
        this.videoElement.play();
        
        return new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                resolve();
            };
        });
    }
} 
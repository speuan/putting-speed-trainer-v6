import { CameraController } from './camera/CameraController.js';
import { UIController } from './ui/UIController.js';
import { MarkerTracker } from './tracking/MarkerTracker.js';

document.addEventListener('DOMContentLoaded', () => {
    // Video and Canvas elements
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');

    // UI elements
    const startCameraBtn = document.getElementById('start-camera-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const setupMarkersBtn = document.getElementById('setup-markers-btn');
    const instructionsEl = document.getElementById('instructions');
    const statusIndicatorEl = document.getElementById('status-indicator');
    const resultsContainerEl = document.getElementById('results-container');
    const speedDisplayEl = document.getElementById('speed-display');
    const gateDistanceInputEl = document.getElementById('gate-distance-ft');
    const recordingControlsEl = document.getElementById('recording-controls');
    const replayContainerEl = document.getElementById('replay-container');
    const replayVideoEl = document.getElementById('replay-video');
    const closeReplayBtn = document.getElementById('close-replay-btn');

    // Controllers
    const camera = new CameraController(videoElement);
    const ui = new UIController({
        startCameraBtn,
        switchCameraBtn,
        setupMarkersBtn,
        instructionsEl,
        statusIndicatorEl,
        resultsContainerEl,
        speedDisplayEl,
        canvas: canvasElement,
        recordingControlsEl,
        replayContainerEl,
        replayVideoEl,
        closeReplayBtn
    });
    const tracker = new MarkerTracker(videoElement, canvasElement, ui);

    // State
    let isMarkerSetupActive = false;
    let hasCrossedStart = false;
    let hasCrossedEnd = false;
    let startTimeMs = null;
    let finishTimeMs = null;
    let animationLoopStarted = false;

    function getGateDistanceFt() {
        const distance = Number.parseFloat(gateDistanceInputEl.value);
        return Number.isFinite(distance) && distance > 0 ? distance : 3;
    }

    function getCurrentFrameROI(roi) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
        return tempCtx.getImageData(roi.minX, roi.minY, roi.maxX - roi.minX, roi.maxY - roi.minY);
    }

    function animationLoop() {
        let state = tracker.getState();

        let roi = null;
        let diffMask = null;
        let liveScore = null;
        let diffDetected = false;
        if (state.state === 'ARMED') {
            const { markers, referenceStartROI, referenceEndROI } = tracker;
            if (markers.length === 4) {
                const startLine = { p1: markers[0], p2: markers[1] };
                const endLine = { p1: markers[2], p2: markers[3] };

                let referenceROI = null;
                if (!hasCrossedStart) {
                    // Start ROI
                    roi = tracker.getLineROI(startLine);
                    referenceROI = referenceStartROI;
                } else if (!hasCrossedEnd) {
                    // End ROI
                    roi = tracker.getLineROI(endLine);
                    referenceROI = referenceEndROI;
                }
                if (roi && referenceROI) {
                    const currentROI = getCurrentFrameROI(roi);
                    diffMask = tracker.constructor.differenceMask(currentROI, referenceROI, 25, roi, tracker.ballProfile);
                    const changeStats = tracker.constructor.roiChangeStats(currentROI, referenceROI, 25, roi, tracker.ballProfile);
                    liveScore = changeStats.brightRatio * 100;
                    diffDetected = changeStats.brightRatio > 0.006 &&
                        changeStats.brightRatio < 0.35 &&
                        changeStats.brightAvgDelta > 22;

                    if (!hasCrossedStart && diffDetected) {
                        hasCrossedStart = true;
                        startTimeMs = performance.now();
                        ui.updateStatus('Start detected. Watching finish gate...');
                        console.log('Start gate triggered.');
                    } else if (!hasCrossedEnd && hasCrossedStart && diffDetected) {
                        hasCrossedEnd = true;
                        finishTimeMs = performance.now();
                        const elapsedSeconds = (finishTimeMs - startTimeMs) / 1000;
                        const speedFps = getGateDistanceFt() / elapsedSeconds;
                        const speedMph = speedFps * 0.681818;

                        ui.showResults(speedMph);
                        ui.updateStatus('Complete');
                        console.log(`Finish gate triggered. Speed: ${speedMph.toFixed(2)} mph`);
                    } else if (changeStats.brightRatio < 0.002) {
                        tracker.updateReferenceROI(hasCrossedStart ? 'end' : 'start', currentROI);
                    }
                }
            }
        }

        if (isMarkerSetupActive || state.state === 'ARMED') {
            const updatedState = tracker.getState();
            updatedState.videoElement = videoElement;
            if (roi) updatedState.roi = roi;
            if (diffMask) updatedState.diffMask = diffMask;
            if (liveScore !== null) updatedState.liveScore = liveScore;
            updatedState.templateDetected = false;
            updatedState.diffDetected = diffDetected;
            ui.render(updatedState);
        }
        requestAnimationFrame(animationLoop);
    }

    startCameraBtn.addEventListener('click', async () => {
        try {
            await camera.start();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            const videoContainer = document.querySelector('.video-container');
            const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            videoContainer.style.height = `${videoContainer.clientWidth / aspectRatio}px`;
            
            ui.log('v8 gate timing: recording and ball tracking disabled.');

            ui.onCameraStarted();
            if (!animationLoopStarted) {
                animationLoopStarted = true;
                requestAnimationFrame(animationLoop);
            }
        } catch (error) {
            console.error('Failed to start camera:', error);
            instructionsEl.textContent = 'Could not start camera. Please check permissions.';
        }
    });

    switchCameraBtn.addEventListener('click', async () => {
        try {
            await camera.switchCamera();
        } catch (error) {
            console.error('Failed to switch camera:', error);
            instructionsEl.textContent = 'Could not switch camera.';
        }
    });

    setupMarkersBtn.addEventListener('click', async () => {
        isMarkerSetupActive = true;
        hasCrossedStart = false;
        hasCrossedEnd = false;
        startTimeMs = null;
        finishTimeMs = null;
        resultsContainerEl.style.display = 'none'; // Hide old results
        recordingControlsEl.innerHTML = ''; // Clear old controls
        ui.clearLogs();

        ui.startMarkerSetup();
        ui.promptForMarker(0);

        const progressCallback = (tracker) => {
            const state = tracker.getState();

            if (state.state === 'AWAITING_MARKERS') {
                const markerCount = state.markers.length;
                if (markerCount < 4) {
                    ui.promptForMarker(markerCount);
                }
            } else if (state.state === 'AWAITING_BALL') {
                ui.promptForBall();
            } else if (state.state === 'ARMED') {
                ui.onArmingComplete();
                isMarkerSetupActive = false;
            }
        };
        
        tracker.startSetup(progressCallback);
    });
}); 

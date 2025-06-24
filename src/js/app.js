import { CameraController } from './camera/CameraController.js';
import { UIController } from './ui/UIController.js';
import { MarkerTracker } from './tracking/MarkerTracker.js';
import { lineIntersect, getDistance } from './utils/geometry.js';
import { RecordingController } from './recording/RecordingController.js';
import AnalysisController from './analysis/AnalysisController.js';

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
    const analysisController = new AnalysisController(replayVideoEl, ui, tracker);
    let recordingController;

    // State
    let isMarkerSetupActive = false;
    let hasCrossedStart = false;
    let hasCrossedEnd = false;

    function animationLoop() {
        const state = tracker.getState();

        let roi = null;
        let ballDetected = false;
        let liveBallBox = null;
        let diffMask = null;
        let liveScore = null;
        if (state.state === 'ARMED') {
            const { markers, ballRegion, referenceStartROI, referenceEndROI } = tracker;
            if (markers.length === 4 && ballRegion) {
                let referenceROI = null;
                if (!hasCrossedStart) {
                    // Start ROI
                    const startLine = { p1: markers[0], p2: markers[1] };
                    roi = tracker.getLineROI(startLine, 10, 40);
                    referenceROI = referenceStartROI;
                } else if (!hasCrossedEnd) {
                    // End ROI
                    const endLine = { p1: markers[2], p2: markers[3] };
                    roi = tracker.getLineROI(endLine, 10, 40);
                    referenceROI = referenceEndROI;
                }
                if (roi && referenceROI) {
                    // Extract current ROI image
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = videoElement.videoWidth;
                    tempCanvas.height = videoElement.videoHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
                    const currentROI = tempCtx.getImageData(roi.minX, roi.minY, roi.maxX - roi.minX, roi.maxY - roi.minY);
                    // Live bounding box and score
                    const bestMatch = tracker.constructor.bestTemplateMatchPosition(currentROI, ballRegion);
                    if (bestMatch) {
                        liveBallBox = {
                            x: roi.minX + bestMatch.x + ballRegion.width / 2,
                            y: roi.minY + bestMatch.y + ballRegion.height / 2,
                            w: ballRegion.width,
                            h: ballRegion.height,
                            score: bestMatch.score
                        };
                        liveScore = bestMatch.score;
                        console.log('Live confidence score:', bestMatch.score);
                    }
                    // Difference mask
                    diffMask = tracker.constructor.differenceMask(currentROI, referenceROI);
                    // Detection logic: require both a good template match and significant difference
                    const templateDetected = tracker.constructor.roiTemplateMatch(currentROI, ballRegion);
                    const diffDetected = tracker.constructor.roiDifference(currentROI, referenceROI);
                    console.log('Live confidence score:', bestMatch ? bestMatch.score : null, 'templateDetected:', templateDetected, 'diffDetected:', diffDetected);
                    ballDetected = templateDetected && diffDetected;
                    if (!hasCrossedStart && ballDetected) {
                        hasCrossedStart = true;
                        ui.updateStatus('Recording...');
                        console.log('Start line crossed, recording started.');
                        if (recordingController) {
                            recordingController.startRecording();
                        }
                    } else if (!hasCrossedEnd && hasCrossedStart && ballDetected) {
                        hasCrossedEnd = true;
                        ui.updateStatus('Finished!');
                        console.log('End line crossed, stopping recording.');
                        if (recordingController) {
                            recordingController.stopRecording();
                        }
                    }
                }
            }
        }

        if (isMarkerSetupActive || state.state === 'ARMED') {
            const updatedState = tracker.getState();
            updatedState.videoElement = videoElement;
            if (roi) updatedState.roi = roi;
            if (liveBallBox) updatedState.liveBallBox = liveBallBox;
            if (diffMask) updatedState.diffMask = diffMask;
            if (liveScore !== null) updatedState.liveScore = liveScore;
            if (state.state === 'ARMED') {
                // Calculate and pass debug info for the score box
                updatedState.templateThreshold = 300000;
                updatedState.templateScore = bestMatch ? bestMatch.score : null;
                updatedState.diffThreshold = 20;
                // Calculate avgDiff for the current ROI
                let avgDiff = 0;
                if (currentROI && referenceROI) {
                    let diffSum = 0;
                    for (let i = 0; i < currentROI.data.length; i += 4) {
                        const curGray = 0.299 * currentROI.data[i] + 0.587 * currentROI.data[i+1] + 0.114 * currentROI.data[i+2];
                        const refGray = 0.299 * referenceROI.data[i] + 0.587 * referenceROI.data[i+1] + 0.114 * referenceROI.data[i+2];
                        diffSum += Math.abs(curGray - refGray);
                    }
                    avgDiff = diffSum / (currentROI.data.length / 4);
                }
                updatedState.diffScore = avgDiff;
                updatedState.templateDetected = templateDetected;
                updatedState.diffDetected = diffDetected;
            }
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
            
            const handleAnalysis = async (blob) => {
                ui.updateStatus('Analyzing...');
                ui.prepareForAnalysis();
                
                try {
                    const results = await analysisController.analyzeVideo(blob);
                    if (results.startTime && results.endTime) {
                        const elapsedTime = results.endTime - results.startTime;
                        
                        // --- Speed Calculation ---
                        const REAL_WORLD_DISTANCE_FT = 1; 
                        const { markers } = tracker.getState();
                        const pixelDistanceOfKnownWidth = getDistance(markers[0], markers[1]);
                        const pixelsPerFoot = pixelDistanceOfKnownWidth / REAL_WORLD_DISTANCE_FT;
                        
                        const startLineCenter = { x: (markers[0].x + markers[1].x) / 2, y: (markers[0].y + markers[1].y) / 2 };
                        const endLineCenter = { x: (markers[2].x + markers[3].x) / 2, y: (markers[2].y + markers[3].y) / 2 };
                        const puttPixelDistance = getDistance(startLineCenter, endLineCenter);
                        const puttDistanceFt = puttPixelDistance / pixelsPerFoot;
                        
                        const speedFps = puttDistanceFt / elapsedTime;
                        const speedMph = speedFps * 0.681818;

                        ui.showResults(speedMph);
                        ui.updateStatus('Complete');
                    } else {
                        ui.updateStatus('Analysis failed. Try again.');
                        ui.log('Analysis failed: Could not find start or end time.');
                    }
                } catch (error) {
                    ui.updateStatus('Error during analysis.');
                    ui.log(`Error: ${error.message}`);
                    console.error('An error occurred during video analysis:', error);
                } finally {
                    ui.finishAnalysis();
                    hasCrossedStart = false;
                    hasCrossedEnd = false;
                }
            };

            recordingController = new RecordingController(camera.stream, (blob) => {
                ui.showPendingAnalysis();
                // Now, instead of analyzing directly, we provide the UI with the blob
                // and the function to call when the user clicks "Analyze"
                ui.displayRecordingControls(blob, handleAnalysis);
            });

            ui.onCameraStarted();
            requestAnimationFrame(animationLoop);
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
                ui.onSetupComplete();
                ui.promptForBall();
            } else if (state.state === 'ARMED') {
                ui.onArmingComplete();
                isMarkerSetupActive = false;
            }
        };
        
        tracker.startSetup(progressCallback);
    });
}); 
export class UIController {
    constructor(options) {
        this.startCameraBtn = options.startCameraBtn;
        this.switchCameraBtn = options.switchCameraBtn;
        this.setupMarkersBtn = options.setupMarkersBtn;
        this.instructionsEl = options.instructionsEl;
        this.statusIndicatorEl = options.statusIndicatorEl;
        this.resultsContainerEl = options.resultsContainerEl;
        this.speedDisplayEl = options.speedDisplayEl;
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.logContainerEl = document.getElementById('log-container');
        
        // New elements for replay
        this.recordingControlsEl = options.recordingControlsEl;
        this.replayContainerEl = options.replayContainerEl;
        this.replayVideoEl = options.replayVideoEl;
        this.closeReplayBtn = options.closeReplayBtn;

        this.closeReplayBtn.addEventListener('click', () => this.hideReplay());
    }

    onCameraStarted() {
        this.startCameraBtn.disabled = true;
        this.switchCameraBtn.disabled = false;
        this.setupMarkersBtn.disabled = false;
        this.instructionsEl.textContent = 'Camera started. Click "Setup Markers" to begin.';
        this.updateStatus('Ready');
    }

    startMarkerSetup() {
        this.setupMarkersBtn.disabled = true;
        this.instructionsEl.textContent = 'Click on the four corners of the putting area.';
        this.canvas.style.pointerEvents = 'auto'; 
        this.updateStatus('Setting Markers');
    }

    promptForMarker(markerIndex) {
        this.instructionsEl.textContent = `Click to set marker #${markerIndex + 1}`;
    }

    drawMarker(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'red';
        this.ctx.fill();
    }

    onSetupComplete() {
        this.instructionsEl.textContent = 'Marker setup complete.';
        this.canvas.style.pointerEvents = 'none';
        this.updateStatus('Setup Complete');
    }

    promptForBall() {
        this.instructionsEl.textContent = 'Tap the ball to arm the system.';
        this.canvas.style.pointerEvents = 'auto';
        this.updateStatus('Awaiting Ball');
    }

    onArmingComplete() {
        this.instructionsEl.textContent = 'System Armed. Ready for putt.';
        this.canvas.style.pointerEvents = 'none';
        this.updateStatus('Armed');
    }

    drawTrackedMarkers(markers) {
        this.clearCanvas();
        this.ctx.fillStyle = 'green';
        markers.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI); // Slightly larger for visibility
            this.ctx.fill();
        });
    }

    render(state) {
        this.clearCanvas();

        // Draw ROI for debugging if present
        if (state.roi) {
            this.drawROI(state.roi);
        }

        // Draw difference mask if present
        if (state.diffMask && state.roi) {
            this.drawDiffMask(state.diffMask, state.roi);
        }

        // Draw live bounding box if present
        if (state.liveBallBox) {
            this.drawLiveBallBox(state.liveBallBox);
        }

        // Draw live confidence score if present
        if (typeof state.liveScore === 'number') {
            this.drawLiveScore(state.liveScore);
        }

        // Draw existing markers
        if (state.markers) {
            state.markers.forEach(marker => this.drawMarker(marker));
        }

        // Draw the start and end lines if all markers are set
        if (state.markers && state.markers.length === 4) {
            this.drawLines(state.markers);
        }

        // Draw the loupe if it's active
        if (state.loupe) {
            this.drawLoupe(state.loupe.x, state.loupe.y, state.videoElement);
        }

        // Draw the tracked ball if the system is armed or tracking
        if (state.ball && (state.state === 'ARMED' || state.state === 'TRACKING')) {
            this.drawTrackedBall(state.ball);
        }
        // Draw the marked ball in a different color if in AWAITING_BALL
        else if (state.ball && state.state === 'AWAITING_BALL') {
            this.drawTrackedBall(state.ball, 'orange');
        }
    }

    drawTrackedBall(point, color = 'lime') {
        const size = 30; // The size of the tracking box
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
    }

    drawLines(markers) {
        this.ctx.lineWidth = 3;
        
        // Draw start line in green
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(markers[0].x, markers[0].y);
        this.ctx.lineTo(markers[1].x, markers[1].y);
        this.ctx.stroke();

        // Draw end line in red
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(markers[2].x, markers[2].y);
        this.ctx.lineTo(markers[3].x, markers[3].y);
        this.ctx.stroke();
    }

    drawLoupe(x, y, videoElement, magnification = 3) {
        const loupeSize = 150;
        const sourceSize = loupeSize / magnification;
        const yOffset = -100;
        const loupeCenterX = x;
        const loupeCenterY = y + yOffset;

        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(loupeCenterX, loupeCenterY);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(loupeCenterX, loupeCenterY, loupeSize / 2, 0, Math.PI * 2);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
        this.ctx.clip();

        this.ctx.drawImage(
            videoElement,
            x - (sourceSize / 2), y - (sourceSize / 2), sourceSize, sourceSize,
            loupeCenterX - (loupeSize / 2), loupeCenterY - (loupeSize / 2), loupeSize, loupeSize
        );

        this.ctx.restore();

        this.ctx.beginPath();
        this.ctx.moveTo(loupeCenterX - 10, loupeCenterY);
        this.ctx.lineTo(loupeCenterX + 10, loupeCenterY);
        this.ctx.moveTo(loupeCenterX, loupeCenterY - 10);
        this.ctx.lineTo(loupeCenterX, loupeCenterY + 10);
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawROI(roi) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.15)';
        const width = roi.maxX - roi.minX;
        const height = roi.maxY - roi.minY;
        this.ctx.fillRect(roi.minX, roi.minY, width, height);
        this.ctx.strokeRect(roi.minX, roi.minY, width, height);
        this.ctx.restore();
    }

    drawLiveBallBox(box) {
        this.ctx.save();
        this.ctx.strokeStyle = 'limegreen';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
        this.ctx.restore();
    }

    drawDiffMask(mask, roi) {
        const width = roi.maxX - roi.minX;
        const height = roi.maxY - roi.minY;
        const imageData = this.ctx.createImageData(width, height);
        for (let i = 0; i < mask.length; i++) {
            if (mask[i]) {
                imageData.data[i * 4 + 0] = 255; // Red
                imageData.data[i * 4 + 1] = 0;
                imageData.data[i * 4 + 2] = 0;
                imageData.data[i * 4 + 3] = 120; // Alpha
            } else {
                imageData.data[i * 4 + 3] = 0;
            }
        }
        this.ctx.putImageData(imageData, roi.minX, roi.minY);
    }

    drawLiveScore(score) {
        this.ctx.save();
        const padding = 10;
        const boxWidth = 140;
        const boxHeight = 32;
        const x = this.canvas.width - boxWidth - padding;
        const y = this.canvas.height - boxHeight - padding;
        // Draw a yellow rectangle background for visibility
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.85)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`Score: ${score.toFixed(0)}`, x + 10, y + 25);
        this.ctx.restore();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateStatus(text) {
        this.statusIndicatorEl.textContent = text;
    }

    showPendingAnalysis() {
        this.speedDisplayEl.textContent = '--'; // Placeholder for speed
        this.resultsContainerEl.style.display = 'block';
        this.hideReplay();
    }

    showResults(speed) {
        this.speedDisplayEl.textContent = speed.toFixed(2);
        this.resultsContainerEl.style.display = 'block';
        this.hideReplay(); // Hide replay if a new result is shown
    }

    displayRecordingControls(blob, onAnalyze) {
        this.recordingControlsEl.innerHTML = ''; // Clear previous controls

        const url = URL.createObjectURL(blob);

        const analyzeBtn = document.createElement('button');
        analyzeBtn.textContent = 'Analyze Putt';
        analyzeBtn.className = 'button';
        analyzeBtn.addEventListener('click', () => onAnalyze(blob));

        const replayBtn = document.createElement('button');
        replayBtn.textContent = 'Replay';
        replayBtn.className = 'button';
        replayBtn.addEventListener('click', () => this.playReplay(url));

        const link = document.createElement('a');
        link.href = url;
        link.download = `putt-recording-${new Date().toISOString()}.webm`;
        link.textContent = 'Download Recording';
        link.className = 'button';

        this.recordingControlsEl.appendChild(analyzeBtn);
        this.recordingControlsEl.appendChild(replayBtn);
        this.recordingControlsEl.appendChild(link);
    }

    playReplay(url) {
        this.replayVideoEl.src = url;
        this.replayContainerEl.style.display = 'block';
        this.replayVideoEl.play();
    }

    hideReplay() {
        this.replayContainerEl.style.display = 'none';
        this.replayVideoEl.pause();
        this.replayVideoEl.src = '';
    }

    prepareForAnalysis() {
        this.log('UI: Preparing analysis view.');
        this.replayContainerEl.style.display = 'block';
        this.replayContainerEl.style.position = 'absolute';
        this.replayContainerEl.style.opacity = '0';
        this.replayContainerEl.style.width = '1px';
        this.replayContainerEl.style.height = '1px';
        this.replayContainerEl.style.pointerEvents = 'none';
    }

    finishAnalysis() {
        this.log('UI: Hiding analysis view.');
        this.hideReplay();
        this.replayContainerEl.style.position = 'static';
        this.replayContainerEl.style.opacity = '1';
        this.replayContainerEl.style.width = 'auto';
        this.replayContainerEl.style.height = 'auto';
        this.replayContainerEl.style.pointerEvents = 'auto';
    }

    log(message) {
        const p = document.createElement('p');
        p.textContent = `> ${message}`;
        this.logContainerEl.appendChild(p);
        // Auto-scroll to the bottom
        this.logContainerEl.scrollTop = this.logContainerEl.scrollHeight;
    }

    clearLogs() {
        this.logContainerEl.innerHTML = '';
    }
} 
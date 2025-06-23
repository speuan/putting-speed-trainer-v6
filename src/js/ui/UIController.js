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

        // Draw the tracked ball if the system is armed
        if (state.ball && (state.state === 'ARMED' || state.state === 'TRACKING')) {
            this.drawTrackedBall(state.ball);
        }
    }

    drawTrackedBall(point) {
        const size = 30; // The size of the tracking box
        this.ctx.strokeStyle = 'lime';
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

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateStatus(text) {
        this.statusIndicatorEl.textContent = text;
    }

    showResults(speed) {
        this.speedDisplayEl.textContent = speed.toFixed(2);
        this.resultsContainerEl.style.display = 'block';
        this.hideReplay(); // Hide replay if a new result is shown
    }

    displayRecordingControls(url) {
        this.recordingControlsEl.innerHTML = ''; // Clear previous controls

        const link = document.createElement('a');
        link.href = url;
        link.download = `putt-recording-${new Date().toISOString()}.webm`;
        link.textContent = 'Download Recording';
        link.className = 'button';
        
        const replayBtn = document.createElement('button');
        replayBtn.textContent = 'Replay';
        replayBtn.className = 'button';
        replayBtn.addEventListener('click', () => this.playReplay(url));

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
document.addEventListener('DOMContentLoaded', () => {
    const videoTitle = document.getElementById('videoTitle');
    const playerContainer = document.getElementById('karaokePlayer');

    const webcamContainer = document.getElementById('webcamContainer');
    const webcamPreview = document.getElementById('webcamPreview');
    const vocalRemoverToggle = document.getElementById('vocalRemoverToggle');
    const duetToggleBtn = document.getElementById('duetToggleBtn');
    const recordBtn = document.getElementById('recordBtn');
    const recordingCanvas = document.getElementById('recordingCanvas');

    let karaokeVideoElement = null;
    let audioContext = null;
    let audioSource = null;
    let channelSplitter = null;
    let channelMerger = null;
    let mixedOutput = null;
    let recordingDestination = null;

    let webcamStream = null;
    let micStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;

    async function initKaraoke() {
        if (!videoId) return;

        try {
            // 1. Fetch Video Info & Stream
            const response = await fetch(`/api/stream?id=${videoId}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            videoTitle.textContent = data.title;

            const videoStatus = document.getElementById('videoStatus');
            videoStatus.textContent = "Menghubungkan ke stream...";

            // 2. Setup Video Element
            karaokeVideoElement = document.createElement('video');
            karaokeVideoElement.crossOrigin = 'anonymous';
            karaokeVideoElement.src = `/api/proxy?url=${encodeURIComponent(data.url)}`;
            karaokeVideoElement.controls = true;
            karaokeVideoElement.autoplay = true;
            karaokeVideoElement.preload = 'auto';
            karaokeVideoElement.setAttribute('playsinline', '');
            
            karaokeVideoElement.onplay = () => {
                videoStatus.style.display = 'none';
                console.log("Video started playing");
            };

            karaokeVideoElement.onerror = (e) => {
                console.error("Video Error:", e);
                videoStatus.textContent = "Kesalahan Video: Silakan muat ulang halaman.";
            };
            
            playerContainer.innerHTML = '';
            playerContainer.appendChild(karaokeVideoElement);

            try {
                // Some browsers require a user interaction to start play with sound
                // We show controls so they can click play if needed
                await karaokeVideoElement.play();
            } catch (pErr) {
                console.warn("Autoplay blocked:", pErr);
                videoStatus.innerHTML = 'Klik tombol <span style="color:#ff00cc; font-weight:bold;">PLAY</span> pada video di bawah.';
            }

            // 3. Setup Audio
            setupAudioProcessing(karaokeVideoElement);



        } catch (err) {
            console.error(err);
        }
    }

    function setupAudioProcessing(videoEl) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioSource = audioContext.createMediaElementSource(videoEl);
            
            channelSplitter = audioContext.createChannelSplitter(2);
            channelMerger = audioContext.createChannelMerger(2);
            
            mixedOutput = audioContext.createGain();
            mixedOutput.connect(audioContext.destination);

            recordingDestination = audioContext.createMediaStreamDestination();
            mixedOutput.connect(recordingDestination);
            
            audioSource.connect(mixedOutput);
            
            vocalRemoverToggle.onchange = () => {
                audioSource.disconnect();
                if (vocalRemoverToggle.checked) {
                    audioSource.connect(channelSplitter);
                    const inverter = audioContext.createGain();
                    inverter.gain.value = -1;
                    channelSplitter.connect(channelMerger, 0, 0); 
                    channelSplitter.connect(channelMerger, 0, 1); 
                    channelSplitter.connect(inverter, 1);
                    inverter.connect(channelMerger, 0, 0);
                    inverter.connect(channelMerger, 0, 1);
                    channelMerger.connect(mixedOutput);
                } else {
                    audioSource.connect(mixedOutput);
                }
            };
        } catch (e) {
            console.warn("Web Audio API error:", e);
        }
    }

    // Lyrics functions removed - lyrics column has been removed from UI

    duetToggleBtn.addEventListener('click', async () => {
        const webcamPlaceholder = document.getElementById('webcamPlaceholder');
        
        if (webcamStream) {
            stopWebcam();
            duetToggleBtn.textContent = '📷 Aktifkan Kamera';
            duetToggleBtn.style.background = '#d63384';
            webcamPreview.style.display = 'none';
            if (webcamPlaceholder) webcamPlaceholder.style.display = 'block';
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                webcamStream = stream;
                webcamPreview.srcObject = stream;
                webcamPreview.style.display = 'block';
                if (webcamPlaceholder) webcamPlaceholder.style.display = 'none';
                duetToggleBtn.textContent = '⏹ Matikan Kamera';
                duetToggleBtn.style.background = '#ff0000';
            } catch (err) {
                alert("Gagal aktifkan kamera.");
            }
        }
    });

    function stopWebcam() {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            webcamPreview.srcObject = null;
        }
    }

    recordBtn.addEventListener('click', () => {
        if (isRecording) stopRecording();
        else startRecording();
    });

    async function startRecording() {
        if (!karaokeVideoElement) return;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micSource = audioContext.createMediaStreamSource(micStream);
            micSource.connect(mixedOutput);

            const ctx = recordingCanvas.getContext('2d');
            isRecording = true;
            recordBtn.textContent = '⏹ Berhenti Rekam';
            recordBtn.style.background = '#000';

            const drawLoop = () => {
                if (!isRecording) return;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
                if (karaokeVideoElement.readyState >= 2) {
                    ctx.drawImage(karaokeVideoElement, 0, 0, recordingCanvas.width, recordingCanvas.height);
                }
                if (webcamStream && webcamPreview.readyState >= 2) {
                    const w = 320, h = 240;
                    ctx.save();
                    ctx.translate(recordingCanvas.width - 20, 20);
                    ctx.scale(-1, 1);
                    ctx.drawImage(webcamPreview, 0, 0, w, h);
                    ctx.restore();
                }
                requestAnimationFrame(drawLoop);
            };
            drawLoop();

            const canvasStream = recordingCanvas.captureStream(30);
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...recordingDestination.stream.getAudioTracks()
            ]);

            mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
            recordedChunks = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Karaoke_${new Date().getTime()}.webm`;
                a.click();
            };
            mediaRecorder.start();
        } catch (err) {
            alert("Gagal rekaman: " + err.message);
        }
    }

    function stopRecording() {
        isRecording = false;
        if (mediaRecorder) mediaRecorder.stop();
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }
        recordBtn.textContent = '🔴 Mulai Rekam';
        recordBtn.style.background = '#ff5252';
    }

    initKaraoke();
});

document.addEventListener('DOMContentLoaded', () => {
    const videoTitle = document.getElementById('videoTitle');
    const playerContainer = document.getElementById('karaokePlayer');

    const webcamContainer = document.getElementById('webcamContainer');
    const webcamPreview = document.getElementById('webcamPreview');
    const vocalRemoverToggle = document.getElementById('vocalRemoverToggle');
    const duetToggleBtn = document.getElementById('duetToggleBtn');
    const recordBtn = document.getElementById('recordBtn');
    const recordingCanvas = document.getElementById('recordingCanvas');
    const themeToggle = document.getElementById('themeToggle');

    // Theme Management
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
        });
    }

    let karaokeVideoElement = null;
    let audioContext = null;
    let audioSource = null;
    let channelSplitter = null;
    let channelMerger = null;
    let mixedOutput = null;
    let recordingDestination = null;
    let musicGainNode = null;
    let micGainNode = null;
    let currentMovieCategory = 'All';
    let selfieSegmentation = null;
    let currentBgMode = 'none'; // none, blur, url
    let bgImage = new Image();
    const segmentationCanvas = document.getElementById('segmentationCanvas');
    const segmentationCtx = segmentationCanvas.getContext('2d');
    let recordedChunks = [];
    let isRecording = false;

    let micSource = null;
    let webcamStream = null;
    let micStream = null;
    let mediaRecorder = null;

    async function initKaraoke() {
        if (!videoId) return;

        try {
            // 1. Fetch Video Info & Stream
            const response = await fetch(`/api/stream?id=${videoId}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            videoTitle.textContent = data.title;
            document.title = `Nonton: ${data.title} - InerTube`;

            const videoStatus = document.getElementById('videoStatus');
            videoStatus.textContent = "Menghubungkan ke stream...";

            // 2. Setup Video Element
            karaokeVideoElement = document.createElement('video');
            karaokeVideoElement.crossOrigin = 'anonymous'; // Important for Web Audio processing
            karaokeVideoElement.src = data.url;
            karaokeVideoElement.controls = true;
            karaokeVideoElement.autoplay = true;
            karaokeVideoElement.preload = 'auto';
            karaokeVideoElement.setAttribute('playsinline', '');

            karaokeVideoElement.onplay = () => {
                videoStatus.style.display = 'none';
            };

            karaokeVideoElement.onerror = (e) => {
                videoStatus.textContent = "Kesalahan Video: Silakan muat ulang halaman.";
            };

            playerContainer.innerHTML = '';
            playerContainer.appendChild(karaokeVideoElement);

            // Handle Resuming from History
            karaokeVideoElement.onloadedmetadata = () => {
                fetch('/api/history')
                    .then(r => r.json())
                    .then(history => {
                        const savedVideo = history.find(v => v.id === videoId);
                        if (savedVideo && savedVideo.lastPosition) {
                            karaokeVideoElement.currentTime = savedVideo.lastPosition;
                            console.log("Resuming from last position:", savedVideo.lastPosition);
                        }
                    });
            };

            // Save Progress periodically
            setInterval(() => {
                if (karaokeVideoElement && !karaokeVideoElement.paused) {
                    fetch('/api/history/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: videoId, progress: karaokeVideoElement.currentTime })
                    });
                }
            }, 5000);

            try {
                await karaokeVideoElement.play();
            } catch (pErr) {
                videoStatus.innerHTML = 'Klik tombol <span style="color:#ff00cc; font-weight:bold;">PLAY</span> pada video di bawah.';
            }

            // 3. Setup Audio (Disabled until mode karaoke is active to avoid audio loss)
            // setupAudioProcessing(karaokeVideoElement);

            // 4. Fetch Related Videos
            fetchRelatedVideos(data.title);

        } catch (err) {
            console.error(err);
        }
    }

    async function fetchRelatedVideos(title) {
        const listContainer = document.getElementById('relatedVideosList');
        // Simple related: search for same title but remove some words
        const query = title.split(' ').slice(0, 3).join(' ');

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const videos = await response.json();

            listContainer.innerHTML = '';
            if (videos.length === 0) {
                listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Tidak ada video terkait.</div>';
                return;
            }

            videos.forEach(video => {
                // Skip current video
                if (video.id === videoId) return;

                const item = document.createElement('div');
                item.className = 'related-video-item';
                item.onclick = () => {
                    window.location.href = `/karaoke/${video.id}`;
                };

                let thumbUrl = Array.isArray(video.thumbnails) ? video.thumbnails[0] : video.thumbnails;

                item.innerHTML = `
                    <img src="${thumbUrl}" class="related-thumb" alt="${video.title}">
                    <div class="related-info">
                        <h4>${video.title}</h4>
                        <div class="channel">${video.channel || 'Unknown'}</div>
                        <div class="channel" style="font-size: 0.7rem; margin-top: 2px;">${video.views || ''} • ${video.duration || ''}</div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        } catch (err) {
            console.error("Error fetching related:", err);
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Gagal memuat video terkait.</div>';
        }
    }

    // Cinema Mode Logic
    const cinemaModeBtn = document.getElementById('cinemaModeBtn');
    const videoColumn = document.querySelector('.video-column');
    const sidebarColumn = document.querySelector('.sidebar-column');

    cinemaModeBtn.addEventListener('click', () => {
        videoColumn.classList.toggle('cinema');
        sidebarColumn.classList.toggle('hidden');

        if (videoColumn.classList.contains('cinema')) {
            cinemaModeBtn.textContent = '📺 Normal Mode';
            cinemaModeBtn.style.background = '#444';
        } else {
            cinemaModeBtn.textContent = '🎬 Cinema Mode';
            cinemaModeBtn.style.background = '#2a2a2a';
        }
    });

    // Toggle Karaoke Tools
    const toggleKaraokeTools = document.getElementById('toggleKaraokeTools');
    const karaokeSidebar = document.getElementById('karaokeSidebar');

    toggleKaraokeTools.addEventListener('click', () => {
        karaokeSidebar.classList.toggle('hidden');
        if (!karaokeSidebar.classList.contains('hidden')) {
            toggleKaraokeTools.textContent = '❌ Tutup Karaoke';
            toggleKaraokeTools.style.background = '#333';
            // Enable Web Audio only when needed
            if (karaokeVideoElement) {
                if (!audioContext) {
                    setupAudioProcessing(karaokeVideoElement);
                }
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
        } else {
            toggleKaraokeTools.textContent = '🎤 Mode Karaoke';
            toggleKaraokeTools.style.background = 'linear-gradient(45deg, #ff00cc, #333399)';
            stopWebcam();
        }
    });

    // Other Buttons Stubs
    document.getElementById('likeBtn').addEventListener('click', () => alert('Disukai!'));
    document.getElementById('shareBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Tautan disalin ke papan klip!');
    });
    // Popup Player (Native PiP)
    document.getElementById('popupPlayerBtn').addEventListener('click', async () => {
        if (!karaokeVideoElement) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await karaokeVideoElement.requestPictureInPicture();
            }
        } catch (err) {
            console.error("PiP Error:", err);
            alert("Picture-in-Picture tidak didukung atau gagal.");
        }
    });

    // Separate Downloads
    document.getElementById('downloadMp4Btn').addEventListener('click', () => {
        window.open(`/api/download?id=${videoId}&format=mp4`, '_blank');
        alert('Permintaan unduhan MP4 dikirim.');
    });

    document.getElementById('downloadMp3Btn').addEventListener('click', () => {
        window.open(`/api/download?id=${videoId}&format=mp3`, '_blank');
        alert('Permintaan unduhan MP3 dikirim.');
    });

    function setupAudioProcessing(videoEl) {
        if (audioContext) return; // Already setup
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioSource = audioContext.createMediaElementSource(videoEl);

            channelSplitter = audioContext.createChannelSplitter(2);
            channelMerger = audioContext.createChannelMerger(2);

            mixedOutput = audioContext.createGain();
            mixedOutput.connect(audioContext.destination);

            musicGainNode = audioContext.createGain();
            musicGainNode.gain.value = document.getElementById('musicVolume').value;
            musicGainNode.connect(mixedOutput);

            recordingDestination = audioContext.createMediaStreamDestination();
            mixedOutput.connect(recordingDestination);

            // Important: Route audio depending on toggle state
            updateAudioRouting();

            vocalRemoverToggle.onchange = updateAudioRouting;

            // Volume Event Listeners
            document.getElementById('musicVolume').oninput = (e) => {
                if (musicGainNode) musicGainNode.gain.value = e.target.value;
            };
            document.getElementById('micVolume').oninput = (e) => {
                if (micGainNode) micGainNode.gain.value = e.target.value;
            };

        } catch (e) {
            console.warn("Web Audio API error:", e);
        }
    }

    function updateAudioRouting() {
        if (!audioSource || !mixedOutput) return;

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
            channelMerger.connect(musicGainNode);
        } else {
            audioSource.connect(musicGainNode);
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

                // Initialize Selfie Segmentation if not done
                if (!selfieSegmentation && typeof SelfieSegmentation !== 'undefined') {
                    initSelfieSegmentation();
                }

                webcamPreview.style.display = 'block';
                if (webcamPlaceholder) webcamPlaceholder.style.display = 'none';
                duetToggleBtn.textContent = '⏹ Matikan Kamera';
                duetToggleBtn.style.background = '#ff0000';
            } catch (err) {
                alert("Gagal aktifkan kamera.");
            }
        }
    });

    function initSelfieSegmentation() {
        selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });

        selfieSegmentation.setOptions({
            modelSelection: 1, // 0 for general, 1 for landscape/faster
        });

        selfieSegmentation.onResults(onSegmentationResults);

        // Start processing loop
        const processWebcam = async () => {
            if (webcamStream && selfieSegmentation && currentBgMode !== 'none') {
                if (webcamPreview.readyState >= 2) {
                    await selfieSegmentation.send({ image: webcamPreview });
                }
            }
            if (webcamStream) requestAnimationFrame(processWebcam);
        };
        processWebcam();
    }

    function onSegmentationResults(results) {
        segmentationCtx.save();
        segmentationCtx.clearRect(0, 0, segmentationCanvas.width, segmentationCanvas.height);

        // 1. Draw Background
        if (currentBgMode === 'blur') {
            segmentationCtx.filter = 'blur(10px)';
            segmentationCtx.drawImage(results.image, 0, 0, segmentationCanvas.width, segmentationCanvas.height);
            segmentationCtx.filter = 'none';
        } else if (currentBgMode !== 'none' && bgImage.complete) {
            segmentationCtx.drawImage(bgImage, 0, 0, segmentationCanvas.width, segmentationCanvas.height);
        }

        // 2. Masking
        segmentationCtx.globalCompositeOperation = 'destination-atop';
        segmentationCtx.drawImage(results.segmentationMask, 0, 0, segmentationCanvas.width, segmentationCanvas.height);

        // 3. Draw Foreground (User)
        segmentationCtx.globalCompositeOperation = 'source-over';
        segmentationCtx.drawImage(results.image, 0, 0, segmentationCanvas.width, segmentationCanvas.height);

        segmentationCtx.restore();
    }

    // BG Selector events
    document.querySelectorAll('.bg-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBgMode = btn.dataset.bg;
            if (currentBgMode.startsWith('http')) {
                bgImage.src = currentBgMode;
            }
        });
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
            micSource = audioContext.createMediaStreamSource(micStream);

            micGainNode = audioContext.createGain();
            micGainNode.gain.value = document.getElementById('micVolume').value;

            micSource.connect(micGainNode);
            micGainNode.connect(mixedOutput);

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
                if (webcamStream) {
                    const w = 320, h = 240;
                    ctx.save();
                    ctx.translate(recordingCanvas.width - 20, 20);
                    ctx.scale(-1, 1);

                    if (currentBgMode !== 'none' && selfieSegmentation) {
                        ctx.drawImage(segmentationCanvas, 0, 0, w, h);
                    } else if (webcamPreview.readyState >= 2) {
                        ctx.drawImage(webcamPreview, 0, 0, w, h);
                    }

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

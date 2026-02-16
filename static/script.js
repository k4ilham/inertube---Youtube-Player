document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsGrid = document.getElementById('resultsGrid');
    const modal = document.getElementById('videoModal');
    const closeModal = document.querySelector('.close-modal');
    const videoPlayer = document.getElementById('videoPlayer');
    const modalTitle = document.getElementById('modalTitle');
    const downloadMp4Btn = document.getElementById('downloadMp4Btn');
    const downloadMp3Btn = document.getElementById('downloadMp3Btn');
    const downloadStatus = document.getElementById('downloadStatus');
    const homeBtn = document.getElementById('homeBtn');
    const historyBtn = document.getElementById('historyBtn');
    const downloadsBtn = document.getElementById('downloadsBtn');
    const playlistsBtn = document.getElementById('playlistsBtn');
    const karaokeNavBtn = document.getElementById('karaokeNavBtn');
    const moviesBtn = document.getElementById('moviesBtn');
    const kidsBtn = document.getElementById('kidsBtn');
    const musicBtn = document.getElementById('musicBtn');
    const kailhamBtn = document.getElementById('kailhamBtn');
    
    // Karaoke Mode Elements
    const karaokeModal = document.getElementById('karaokeModal');
    const closeKaraokeBtn = document.getElementById('closeKaraokeBtn');
    const duetToggleBtn = document.getElementById('duetToggleBtn');
    const vocalRemoverToggle = document.getElementById('vocalRemoverToggle');
    const webcamContainer = document.getElementById('webcamContainer');
    const webcamPreview = document.getElementById('webcamPreview');
    const lyricsDiv = document.getElementById('lyrics');
    const recordBtn = document.getElementById('recordBtn');
    const recordingCanvas = document.getElementById('recordingCanvas');
    
    let currentVideoId = null;
    let currentVideoObj = null;
    let webcamStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    let recordingStream = null;
    let micStream = null;
    let recordingInterval = null;


    let currentQuery = '';
    let isLoading = false;
    let isKaraokeSearch = false; 
    let isMovieSearch = false;
    let isKidsSearch = false;
    let isMusicSearch = false; // Music Mode State
    let currentMovieCategory = 'All';

    // Navigation
    function setActiveNav(btn) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');
        
        // Sidebars
        const sidebarHome = document.getElementById('sidebar-home');
        const sidebarKaraoke = document.getElementById('sidebar-karaoke');
        const sidebarMovies = document.getElementById('sidebar-movies');
        const sidebarKids = document.getElementById('sidebar-kids');
        const sidebarMusic = document.getElementById('sidebar-music');
        const sidebarKailham = document.getElementById('sidebar-kailham');
        
        // Hide all
        sidebarHome.classList.add('hidden');
        sidebarKaraoke.classList.add('hidden');
        sidebarMovies.classList.add('hidden');
        sidebarKids.classList.add('hidden');
        sidebarMusic.classList.add('hidden');
        if(sidebarKailham) sidebarKailham.classList.add('hidden');

        if (btn === homeBtn) {
            sidebarHome.classList.remove('hidden');
        } else if (btn === karaokeNavBtn) {
            sidebarKaraoke.classList.remove('hidden');
        } else if (btn === moviesBtn) {
            sidebarMovies.classList.remove('hidden');
        } else if (btn === kidsBtn) {
            sidebarKids.classList.remove('hidden');
        } else if (btn === musicBtn) {
            sidebarMusic.classList.remove('hidden');
        } else if (btn === kailhamBtn) {
            sidebarKailham.classList.remove('hidden');
        }
    }

    function showLoading() {
        resultsGrid.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
            </div>
        `;
    }

    homeBtn.addEventListener('click', () => {
        setActiveNav(homeBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        searchInput.value = '';
        currentQuery = '';
        loadRecommendations();
    });

    karaokeNavBtn.addEventListener('click', () => {
        setActiveNav(karaokeNavBtn);
        isKaraokeSearch = true;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        searchInput.value = '';
        showLoading();
        
        // Reset and set active
        document.querySelectorAll('.category-karaoke-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-karaoke-btn[data-query="Lagu Karaoke Populer"]').classList.add('active');
        
        performSearch('Lagu Karaoke Populer Indonesia');
    });

    moviesBtn.addEventListener('click', () => {
        setActiveNav(moviesBtn);
        isKaraokeSearch = false;
        isMovieSearch = true;
        isKidsSearch = false;
        isMusicSearch = false;
        currentMovieCategory = 'All';
        searchInput.value = '';
        showLoading();
        // Reset category active state
        document.querySelectorAll('.category-movie-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-movie-btn[data-genre="All"]').classList.add('active');
        
        performSearch('Film Indonesia Full Movie');
    });

    kidsBtn.addEventListener('click', () => {
        setActiveNav(kidsBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = true;
        isMusicSearch = false;
        searchInput.value = '';
        showLoading();
        
        // Reset kids category
        document.querySelectorAll('.category-kids-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-kids-btn[data-query="Kartun Anak"]').classList.add('active');

        performSearch('Kartun Anak Bahasa Indonesia');
    });

    musicBtn.addEventListener('click', () => {
        setActiveNav(musicBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = true;
        searchInput.value = '';
        showLoading();
        
        // Reset music category
        document.querySelectorAll('.category-music-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-music-btn[data-query="Lagu Indonesia Terbaru"]').classList.add('active');

        performSearch('Lagu Indonesia Terbaru');
    });

    kailhamBtn.addEventListener('click', () => {
        setActiveNav(kailhamBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        searchInput.value = '';
        showLoading();
        
         // Reset category
        document.querySelectorAll('.category-kailham-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-kailham-btn[data-query="Kailham Maulana"]').classList.add('active');

        performSearch('Kailham Maulana');
    });

    historyBtn.addEventListener('click', () => {
        setActiveNav(historyBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        loadHistory();
    });

    downloadsBtn.addEventListener('click', () => {
        setActiveNav(downloadsBtn);
        loadDownloads();
    });
    
    playlistsBtn.addEventListener('click', () => {
        setActiveNav(playlistsBtn);
        loadPlaylists();
    });

    // === SIDEBAR LISTENERS ===

    // Home Sidebar
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch(btn.dataset.query);
        });
    });

    // Karaoke Sidebar
    document.querySelectorAll('.category-karaoke-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-karaoke-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch(btn.dataset.query);
        });
    });

    // Movies Sidebar
    document.querySelectorAll('.category-movie-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-movie-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMovieCategory = btn.dataset.genre;
            
            let queryGenre = currentMovieCategory;
            if (currentMovieCategory === 'All') queryGenre = '';
            
            const query = `Film ${queryGenre} Full Movie Bahasa Indonesia Sub Indo`;
            performSearch(query);
        });
    });

    // Kids Sidebar
    document.querySelectorAll('.category-kids-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-kids-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const query = `${btn.dataset.query} Bahasa Indonesia`;
            performSearch(query);
        });
    });

    // Music Sidebar
    document.querySelectorAll('.category-music-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-music-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch(btn.dataset.query);
        });
    });

    // Kailham Sidebar
    document.querySelectorAll('.category-kailham-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-kailham-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch(btn.dataset.query);
        });
    });


    // Search
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) performSearch(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) performSearch(query);
        }
    });

    function renderVideos(videos, append = false) {
        if (!append) {
            resultsGrid.innerHTML = '';
        }

        if (videos.length === 0 && !append) {
            resultsGrid.innerHTML = '<div class="placeholder-message">Tidak ada video ditemukan.</div>';
            return;
        }

        videos.forEach(video => {
            // MOVIE FILTER: Skip if < 60 mins (only if isMovieSearch is true)
            if (isMovieSearch) {
                const duration = video.duration || '';
                const parts = duration.split(':');
                
                if (parts.length === 3) {
                    // H:M:S -> OK
                } else if (parts.length === 2) {
                    // MM:SS -> Skip
                    return; 
                } else {
                    return;
                }
            }

            const card = document.createElement('div');
            card.className = 'video-card';
            card.onclick = () => openVideo(video); 
            
            let thumbnailUrl = '';
            if (Array.isArray(video.thumbnails) && video.thumbnails.length > 0) {
                thumbnailUrl = video.thumbnails[0];
            } else if (typeof video.thumbnails === 'string') {
                thumbnailUrl = video.thumbnails;
            }

            const channelName = video.channel || 'Unknown Channel';

            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${thumbnailUrl}" alt="${video.title}">
                    <span class="duration">${video.duration || ''}</span>
                </div>
                <div class="info">
                    <h3 class="title">${video.title}</h3>
                    <div class="channel">${channelName}</div>
                    <div class="views">${video.views || ''}</div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }

    function performSearch(queryOverride = null) {
        let query;
        if (typeof queryOverride === 'string') {
            query = queryOverride;
        } else {
             query = searchInput.value.trim();
        }

        if (!query) return;

        currentQuery = query;

        // If Karaoke tab is active, append "lyrics" if not present
        if (isKaraokeSearch) {
             const lower = query.toLowerCase();
             if (!lower.includes('lyrics') && !lower.includes('karaoke')) {
                 currentQuery += ' lyrics';
             }
        }
        
        isLoading = true;
        
        // Disable lazy loading call until new search is done
        window.removeEventListener('scroll', handleScroll);
        
        if (!queryOverride) { 
             resultsGrid.innerHTML = '<div class="placeholder-message">Sedang mencari...</div>';
        }
        // If queryOverride (like category click), we handle loading msg in click handler or stick with prev
        // Actually best to show loading
        // But performSearch is generally cleared.
        
        if (isMovieSearch && queryOverride && !queryOverride.includes('Movie')) {
            // manual search in movies tab? allow
        }

        fetch(`/api/search?q=${encodeURIComponent(currentQuery)}`)
            .then(response => response.json())
            .then(data => {
                renderVideos(data);
                isLoading = false;
                window.addEventListener('scroll', handleScroll);
            })
            .catch(err => {
                console.error('Error:', err);
                resultsGrid.innerHTML = '<div class="placeholder-message">Gagal memuat hasil.</div>';
                isLoading = false;
            });
    }
    
    function loadMore() {
        if (isLoading || !currentQuery) return;
        isLoading = true;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-container';
        loadingDiv.innerHTML = '<div class="spinner"></div>'; // Use spinner for load more too
        resultsGrid.appendChild(loadingDiv);

        fetch(`/api/search?q=${encodeURIComponent(currentQuery)}&next=true`)
            .then(response => response.json())
            .then(data => {
                if (resultsGrid.contains(loadingDiv)) resultsGrid.removeChild(loadingDiv);
                if (data.length > 0) {
                    renderVideos(data, true);
                }
                isLoading = false;
            })
            .catch(err => {
                console.error('Error loading more:', err);
                if (resultsGrid.contains(loadingDiv)) resultsGrid.removeChild(loadingDiv);
                isLoading = false;
            });
    }

    function handleScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
             loadMore();
        }
    }

    function loadRecommendations() {
        resultsGrid.innerHTML = '<div class="placeholder-message">Loading recommendations...</div>';
        
        fetch('/api/history')
            .then(response => response.json())
            .then(history => {
                if (history.length > 0) {
                    const lastVideo = history[0];
                    // Search for the title of the last watched video to get recommendations/related
                    performSearch(lastVideo.title);
                } else {
                    resultsGrid.innerHTML = '<div class="placeholder-message">Search for something to start watching.</div>';
                }
            })
            .catch(err => {
                console.error('Error loading history for recommendations:', err);
                resultsGrid.innerHTML = '<div class="placeholder-message">Search for something to start watching.</div>';
            });
    }

    function loadDownloads() {
        resultsGrid.innerHTML = '<div class="placeholder-message">Loading downloads...</div>';
        
        fetch('/api/downloads')
            .then(response => response.json())
            .then(data => {
                resultsGrid.innerHTML = '';
                if (data.length === 0) {
                    resultsGrid.innerHTML = '<div class="placeholder-message">No downloads found yet.</div>';
                    return;
                }

                data.forEach(file => {
                    const card = document.createElement('div');
                    card.className = 'video-card download-card';
                    // Open file location on click? Or maybe nothing for now.
                    // Let's just create a simple card.
                    
                    const isVideo = file.name.endsWith('.mp4');
                    const icon = isVideo ? '🎥' : '🎵';

                    card.innerHTML = `
                        <div class="thumbnail-container" style="display: flex; align-items: center; justify-content: center; background: #333; color: #666; font-size: 3rem;">
                            ${icon}
                        </div>
                        <div class="info">
                            <h3 class="title" style="word-break: break-all;">${file.name}</h3>
                            <div class="channel">${file.size}</div>
                            <div class="views">Downloaded</div>
                        </div>
                    `;
                    resultsGrid.appendChild(card);
                });
            })
            .catch(err => {
                console.error('Error loading downloads:', err);
                resultsGrid.innerHTML = '<div class="placeholder-message">Error loading downloads.</div>';
            });
    }

    function loadHistory() {
        resultsGrid.innerHTML = '<div class="placeholder-message">Loading history...</div>';
        
        fetch('/api/history')
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    resultsGrid.innerHTML = '<div class="placeholder-message">No watch history yet.</div>';
                    return;
                }
                renderVideos(data);
            })
            .catch(err => {
                console.error('Error loading history:', err);
                resultsGrid.innerHTML = '<div class="placeholder-message">Error loading history.</div>';
            });
    }

    function addToHistory(video) {
        // Prepare video object for history (simplify if needed)
        // Ensure thumbnails is a string if it's an array
        let thumbUrl = '';
        if (Array.isArray(video.thumbnails) && video.thumbnails.length > 0) {
             thumbUrl = video.thumbnails[0];
        } else if (typeof video.thumbnails === 'string') {
             thumbUrl = video.thumbnails;
        }

        const historyItem = {
            id: video.id,
            title: video.title,
            thumbnails: thumbUrl, // Save as single string URL
            channel: video.channel || 'Unknown',
            duration: video.duration,
            views: video.views
        };

        fetch('/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        }).catch(err => console.error('Error saving history:', err));
    }

    function openVideo(video) {
        currentVideoId = video.id; // video is now the full object
        currentVideoObj = video; // Save for adding to playlist
        
        // Save to history
        addToHistory(video);
        
        // If in Karaoke Mode (Tab), open native player directly!
        if (isKaraokeSearch) {
            startKaraokeMode();
            return;
        }
        
        // Close native PiP video if active
        // But pipVideoElement is in other scope...
        // Let's rely on PiP closing being manual or browser behavior (user can keep it open!)
        // Or we can try to find it.

        modal.style.display = 'block';
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');
        
        // Use youtube-nocookie.com which sometimes bypasses strict embed restrictions
        videoPlayer.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`;
        modalTitle.textContent = video.title;
        downloadStatus.textContent = ''; // Reset status
    }

    function initiateDownload(format) {
        if (!currentVideoId) return;
        
        const btn = format === 'mp4' ? downloadMp4Btn : downloadMp3Btn;
        const originalText = btn.textContent;
        
        btn.disabled = true;
        btn.textContent = 'Starting...';
        downloadStatus.textContent = `Downloading ${format.toUpperCase()}... please wait.`;

        fetch(`/api/download?id=${currentVideoId}&format=${format}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    downloadStatus.textContent = `Success! Saved to downloads folder.`;
                    downloadStatus.style.color = '#4caf50';
                } else {
                    downloadStatus.textContent = `Error: ${data.error}`;
                    downloadStatus.style.color = '#ff5252';
                }
            })
            .catch(err => {
                console.error('Download error:', err);
                downloadStatus.textContent = 'Network error occurred.';
                downloadStatus.style.color = '#ff5252';
            })
            .finally(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            });
    }

    function closeVideoModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            videoPlayer.src = ''; // Stop playback
            currentVideoId = null;
        }, 300);
    }

    // Event Listeners
    searchBtn.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    closeModal.addEventListener('click', closeVideoModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });

    // Download buttons
    downloadMp4Btn.addEventListener('click', () => initiateDownload('mp4'));
    downloadMp3Btn.addEventListener('click', () => initiateDownload('mp3'));

    // Navigation
    homeBtn.addEventListener('click', () => {
        resultsGrid.innerHTML = '<div class="placeholder-message">Loading recommendations...</div>';
        searchInput.value = '';
        loadRecommendations();
    });
    
    historyBtn.addEventListener('click', loadHistory);
    document.getElementById('downloadsBtn').addEventListener('click', loadDownloads);
    // Playlist Logic
    // const playlistsBtn = document.getElementById('playlistsBtn'); // Duplicate declaration
    const addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
    const createPlaylistModal = document.getElementById('createPlaylistModal');
    const addToPlaylistModal = document.getElementById('addToPlaylistModal');
    const closeCreatePlaylist = document.querySelector('.close-create-playlist');
    const closeAddPlaylist = document.querySelector('.close-add-playlist');
    const confirmCreatePlaylistBtn = document.getElementById('confirmCreatePlaylistBtn');
    const newPlaylistName = document.getElementById('newPlaylistName');
    const openCreatePlaylistBtn = document.getElementById('openCreatePlaylistBtn');
    const playlistList = document.getElementById('playlistList');

    function loadPlaylists(forSelection = false) {
        resultsGrid.innerHTML = '<div class="placeholder-message">Loading playlists...</div>';
        
        fetch('/api/playlists')
            .then(response => response.json())
            .then(data => {
                const names = Object.keys(data);
                
                if (forSelection) {
                    playlistList.innerHTML = '';
                    if (names.length === 0) {
                        playlistList.innerHTML = '<div style="color: #666; text-align: center; padding: 10px;">No playlists found.</div>';
                        return;
                    }
                    names.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'playlist-item';
                        item.innerHTML = `<span>${name}</span> <span>${data[name].length} videos</span>`;
                        item.onclick = () => addVideoToPlaylist(name);
                        playlistList.appendChild(item);
                    });
                } else {
                    resultsGrid.innerHTML = '';
                    if (names.length === 0) {
                        resultsGrid.innerHTML = `
                            <div class="placeholder-message">
                                No playlists yet. 
                                <br><br>
                                <button onclick="document.getElementById('createPlaylistModal').style.display='block'; document.getElementById('createPlaylistModal').classList.add('active');" class="download-btn">Create Playlist</button>
                            </div>`;
                        return;
                    }

                    names.forEach(name => {
                        const card = document.createElement('div');
                        card.className = 'video-card download-card';
                        
                        // Get thumbnail from first video if available
                        let thumbHTML = '<div class="thumbnail-container" style="display: flex; align-items: center; justify-content: center; background: #333; color: #666; font-size: 3rem;">📑</div>';
                        if (data[name].length > 0) {
                             const firstVal = data[name][0];
                             // Reuse existing thumbnail logic if possible or simplify
                             let tUrl = '';
                             if (Array.isArray(firstVal.thumbnails) && firstVal.thumbnails.length > 0) tUrl = firstVal.thumbnails[0];
                             else if (typeof firstVal.thumbnails === 'string') tUrl = firstVal.thumbnails;
                             
                             if (tUrl) {
                                 thumbHTML = `<div class="thumbnail-container"><img src="${tUrl}" alt="${name}"></div>`;
                             }
                        }

                        card.innerHTML = `
                            ${thumbHTML}
                            <div class="info">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h3 class="title" style="margin-bottom:0;">${name}</h3>
                                    <button class="delete-playlist-btn" onclick="event.stopPropagation(); deletePlaylist('${name}')">🗑️</button>
                                </div>
                                <div class="views">${data[name].length} videos</div>
                            </div>
                        `;
                        card.onclick = () => showPlaylistVideos(name, data[name]);
                        resultsGrid.appendChild(card);
                    });
                }
            });
    }

    window.deletePlaylist = function(name) {
        if (!confirm(`Delete playlist "${name}"?`)) return;
        
        fetch(`/api/playlists/${name}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    loadPlaylists();
                }
            });
    };

    function showPlaylistVideos(name, videos) {
        resultsGrid.innerHTML = '';
        if (videos.length === 0) {
            resultsGrid.innerHTML = `<div class="placeholder-message">Playlist "${name}" is empty.</div>`;
            return;
        }
        
        // Add header
        const header = document.createElement('div');
        header.style.gridColumn = '1 / -1';
        header.style.padding = '20px 0';
        header.innerHTML = `<h2>Playlist: ${name}</h2>`;
        resultsGrid.appendChild(header);

        renderVideos(videos, true); // Use append=true to not clear header, BUT renderVideos clears if append is false. 
        // Let's modify renderVideos to handle this or just iterate again.
        // Simplest: just use renderVideos logic here or modify renderVideos.
        // Let's re-use renderVideos by clearing first then appending header? No.
        // Let's iterate manually to avoid modifying renderVideos again.
        
        // Actually, renderVideos(videos, false) clears grid.
        // Let's call renderVideos(videos, false) then PREPEND header?
        renderVideos(videos, false);
        resultsGrid.insertBefore(header, resultsGrid.firstChild);
    }

    function createPlaylist() {
        const name = newPlaylistName.value.trim();
        if (!name) return;
        
        fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                createPlaylistModal.classList.remove('active');
                setTimeout(() => createPlaylistModal.style.display = 'none', 300);
                newPlaylistName.value = '';
                
                // If we were in "Add to Playlist" mode, refresh that list
                if (addToPlaylistModal.style.display === 'block') {
                    loadPlaylists(true);
                } else {
                    loadPlaylists();
                }
            } else {
                alert(data.error);
            }
        });
    }

    function addVideoToPlaylist(name) {
        if (!currentVideoObj) return;
        
        fetch(`/api/playlists/${name}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentVideoObj)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                addToPlaylistModal.classList.remove('active');
                setTimeout(() => addToPlaylistModal.style.display = 'none', 300);
                if (data.message) {
                    alert(data.message); // "Already in playlist"
                } else {
                    alert(`Added to playlist "${name}"`);
                }
            } else {
                alert(data.error);
            }
        });
    }
    
    // We need to update openVideo to save the full video object globally
    // let currentVideoObj = null; // Duplicate declaration 

    // Event Listeners for Playlist
    playlistsBtn.addEventListener('click', () => loadPlaylists(false));
    
    addToPlaylistBtn.addEventListener('click', () => {
        addToPlaylistModal.style.display = 'block';
        addToPlaylistModal.classList.add('active');
        loadPlaylists(true);
    });

    closeCreatePlaylist.addEventListener('click', () => {
        createPlaylistModal.classList.remove('active');
        setTimeout(() => createPlaylistModal.style.display = 'none', 300);
    });
    
    closeAddPlaylist.addEventListener('click', () => {
        addToPlaylistModal.classList.remove('active');
        setTimeout(() => addToPlaylistModal.style.display = 'none', 300);
    });

    confirmCreatePlaylistBtn.addEventListener('click', createPlaylist);
    
    openCreatePlaylistBtn.addEventListener('click', () => {
        // addToPlaylistModal.classList.remove('active');
        // addToPlaylistModal.style.display = 'none';
        // Keep add open? No, switch.
        
        createPlaylistModal.style.display = 'block';
        createPlaylistModal.classList.add('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === createPlaylistModal) {
            createPlaylistModal.classList.remove('active');
            setTimeout(() => createPlaylistModal.style.display = 'none', 300);
        }
        if (e.target === addToPlaylistModal) {
            addToPlaylistModal.classList.remove('active');
            setTimeout(() => addToPlaylistModal.style.display = 'none', 300);
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.style.display === 'block') closeVideoModal();
            if (createPlaylistModal.style.display === 'block') {
                 createPlaylistModal.classList.remove('active');
                 setTimeout(() => createPlaylistModal.style.display = 'none', 300);
            }
            if (addToPlaylistModal.style.display === 'block') {
                 addToPlaylistModal.classList.remove('active');
                 setTimeout(() => addToPlaylistModal.style.display = 'none', 300);
            }
        }
    });
    
    // Load recommendations on startup
    loadRecommendations();
    // Native PiP Logic
    const popupPlayerBtn = document.getElementById('popupPlayerBtn');
    let pipVideoElement = null;

    popupPlayerBtn.addEventListener('click', async () => {
        if (!currentVideoId) return;
        
        const originalText = popupPlayerBtn.textContent;
        popupPlayerBtn.disabled = true;
        popupPlayerBtn.textContent = 'Loading...';

        try {
            // Fetch direct stream URL
            const response = await fetch(`/api/stream?id=${currentVideoId}`);
            const data = await response.json();
            
            if (data.error) {
                alert('Error loading stream: ' + data.error);
                return;
            }

            // Create or reuse hidden video element
            if (!pipVideoElement) {
                pipVideoElement = document.createElement('video');
                pipVideoElement.style.display = 'none'; // Keep hidden
                document.body.appendChild(pipVideoElement);
                
                // Handle PiP exit
                pipVideoElement.addEventListener('leavepictureinpicture', () => {
                    pipVideoElement.pause();
                    pipVideoElement.src = '';
                    // Optionally restore modal?
                    // For now, just stop.
                });
            }

            pipVideoElement.src = data.url;
            // pipVideoElement.crossOrigin = 'anonymous'; // Removed to avoid strict CORS check issues with YouTube streams
            
            // We must play() before requestPictureInPicture()
            try {
                await pipVideoElement.play();
                await pipVideoElement.requestPictureInPicture();
                // Hide main modal since PiP is active
                modal.classList.remove('active');
                setTimeout(() => modal.style.display = 'none', 300);
                videoPlayer.src = ''; // Stop main player
            } catch (playErr) {
                console.error("Play/PiP error:", playErr);
                alert("Could not start video playback. Browser policies might block this stream.");
            }

        } catch (err) {
            console.error('PiP Error:', err);
            alert('Failed to start Picture-in-Picture: ' + err.message);
        } finally {
            popupPlayerBtn.disabled = false;
            popupPlayerBtn.textContent = originalText;
        }
    });

    // Remove old floating player logic entirely if replacing?
    // User asked "why not frontmost", giving Native PiP is the answer.
    // So we can comment out or remove the old "floatingPlayer" HTML references if we want, 
    // but the task is to FIX the behavior.
    // I will disable the old floating player button handler (which I just replaced above by reusing the ID).
    // The previous event listener was attached to 'popupPlayerBtn' as well.
    // Since I'm re-declaring `const popupPlayerBtn`, let's make sure we don't have double listeners
    // actually, `const` redeclaration in the same scope would error if I pasted this into the same block.
    // But I am REPLACING the file content of the old listener block.

    // Old Floating player cleanup (remove drag logic if no longer used, or just leave it unused)
    // To be clean, I should remove the old drag logic to avoid confusion, but simpler to just overwrite the button handler.
    // Wait, I am appending this code or replacing? 
    // I am replacing the "Floating Player Logic" block.

    // Karaoke Mode Logic
    const karaokeBtn = document.getElementById('karaokeBtn');
    let karaokeVideoElement = null;
    let audioContext = null;
    let audioSource = null;
    let channelSplitter = null;
    let channelMerger = null;
    let lyricsData = [];

    // Helper to start Karaoke
    async function startKaraokeMode() {
        if (!currentVideoId) return;
        
        karaokeModal.style.display = 'block';
        karaokeModal.classList.add('active');
        
        lyricsDiv.innerHTML = '<div class="placeholder-message">Loading...</div>';
        
        // Stop main player iframe if any
        videoPlayer.src = '';
        
        try {
            // 1. Fetch Stream
            const response = await fetch(`/api/stream?id=${currentVideoId}`);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            // 2. Setup Native Video
            karaokeVideoElement = document.createElement('video');
            karaokeVideoElement.src = data.url;
            karaokeVideoElement.style.width = '100%';
            karaokeVideoElement.controls = true;
            karaokeVideoElement.style.display = 'block';
            karaokeVideoElement.crossOrigin = 'anonymous'; 

            // Insert video into karaokePlayer div
            const playerContainer = document.getElementById('karaokePlayer');
            playerContainer.innerHTML = '';
            playerContainer.appendChild(karaokeVideoElement);
            
            await karaokeVideoElement.play();
            
            // 3. Setup Audio Logic
            setupAudioProcessing(karaokeVideoElement);
            vocalRemoverToggle.checked = false; 
            
            // 4. Fetch Lyrics
            fetchLyrics(currentVideoId);
            
            // 5. Sync Loop
            karaokeVideoElement.addEventListener('timeupdate', syncLyrics);

        } catch (err) {
            console.error(err);
            lyricsDiv.innerHTML = `<div class="placeholder-message">Error: ${err.message}. <br> Try reloading or use Popup Player.</div>`;
        }
    }

    if(karaokeBtn) karaokeBtn.addEventListener('click', startKaraokeMode);

    let recordingDestination = null;
    let mixedOutput = null;

    function setupAudioProcessing(videoEl) {
        try {
            if (audioContext) audioContext.close();
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            try {
                audioSource = audioContext.createMediaElementSource(videoEl);
            } catch (mediaElemErr) {
                console.warn("Karaoke Web Audio error: " + mediaElemErr);
                vocalRemoverToggle.disabled = true;
                return;
            }
            
            channelSplitter = audioContext.createChannelSplitter(2);
            channelMerger = audioContext.createChannelMerger(2);
            
            // Mixed Output Gain
            mixedOutput = audioContext.createGain();
            mixedOutput.connect(audioContext.destination);

            recordingDestination = audioContext.createMediaStreamDestination();
            mixedOutput.connect(recordingDestination);
            
            audioSource.connect(mixedOutput);
            
            vocalRemoverToggle.disabled = false;
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
            console.warn("Web Audio API initialization error:", e);
        }
    }

    async function fetchLyrics(id) {
        lyricsDiv.innerHTML = '<div class="placeholder-message">Loading lyrics...</div>';
        try {
            const res = await fetch(`/api/lyrics?id=${id}`);
            const data = await res.json();
            
            if (data.error) {
                lyricsDiv.innerHTML = '<div class="placeholder-message">No lyrics found for this video.</div>';
                return;
            }
            renderLyrics(data);
        } catch (e) {
            lyricsDiv.innerHTML = '<div class="placeholder-message">Failed to load lyrics.</div>';
        }
    }

    function renderLyrics(data) {
        lyricsData = data; 
        lyricsDiv.innerHTML = '';
        data.forEach((line, index) => {
            const el = document.createElement('div');
            el.className = 'lyric-line';
            el.dataset.index = index;
            el.dataset.start = line.start;
            el.textContent = line.text;
            
            el.onclick = () => {
                if (karaokeVideoElement) karaokeVideoElement.currentTime = line.start;
            };
            lyricsDiv.appendChild(el);
        });
    }

    function syncLyrics() {
        if (!karaokeVideoElement || !lyricsData.length) return;
        const time = karaokeVideoElement.currentTime;
        const activeIdx = lyricsData.findIndex((line, i) => {
            const next = lyricsData[i+1];
            if (next) return time >= line.start && time < next.start;
            return time >= line.start;
        });
        
        if (activeIdx !== -1) {
            const currentActive = lyricsDiv.querySelector('.active');
            if (currentActive) currentActive.classList.remove('active');
            const newActive = lyricsDiv.children[activeIdx];
            if (newActive) {
                newActive.classList.add('active');
                newActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // Modal Close logic for Karaoke
    if(closeKaraokeBtn) {
        closeKaraokeBtn.addEventListener('click', () => {
            stopKaraoke();
        });
    }

    function stopKaraoke() {
        if (isRecording) stopRecording();
        karaokeModal.style.display = 'none';
        karaokeModal.classList.remove('active');
        if (karaokeVideoElement) {
            karaokeVideoElement.pause();
            karaokeVideoElement.src = '';
            karaokeVideoElement = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        stopWebcam();
        if(duetToggleBtn) {
            duetToggleBtn.textContent = '📷 Mode Duet';
            duetToggleBtn.style.background = '#d63384';
        }
    }

    // Duet / Webcam Logic
    if(duetToggleBtn) {
        duetToggleBtn.addEventListener('click', async () => {
            if (webcamStream) {
                stopWebcam();
                duetToggleBtn.textContent = '📷 Mode Duet';
                duetToggleBtn.style.background = '#d63384';
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    webcamStream = stream;
                    webcamPreview.srcObject = stream;
                    webcamContainer.classList.remove('hidden');
                    duetToggleBtn.textContent = '⏹ Stop Kamera';
                    duetToggleBtn.style.background = '#ff0000';
                } catch (err) {
                    console.error("Webcam error:", err);
                    alert("Gagal aktifkan kamera.");
                }
            }
        });
    }

    function stopWebcam() {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            webcamPreview.srcObject = null;
            if(webcamContainer) webcamContainer.classList.add('hidden');
        }
    }

    // --- Recording Logic ---
    if(recordBtn) {
        recordBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }

    async function startRecording() {
        if (!karaokeVideoElement) return;
        
        try {
            // 1. Get Mic Access
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micSource = audioContext.createMediaStreamSource(micStream);
            micSource.connect(mixedOutput); // Mic to mixed output (which goes to speakers and recording destination)

            // 2. Setup Canvas Stream
            const ctx = recordingCanvas.getContext('2d');
            isRecording = true;
            recordBtn.textContent = '⏹ Stop Rekam';
            recordBtn.style.background = '#000';

            const drawLoop = () => {
                if (!isRecording) return;
                
                // Draw Karaoke Video
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
                
                // Draw Karaoke content (video)
                if (karaokeVideoElement.readyState >= 2) {
                    ctx.drawImage(karaokeVideoElement, 0, 0, recordingCanvas.width, recordingCanvas.height);
                }

                // Draw Webcam overlay (if active)
                if (webcamStream && webcamPreview.readyState >= 2) {
                    const w = 320;
                    const h = 240;
                    const x = recordingCanvas.width - w - 20;
                    const y = recordingCanvas.height - h - 20;
                    
                    ctx.save();
                    ctx.translate(x + w, y);
                    ctx.scale(-1, 1); // Mirror webcam
                    ctx.drawImage(webcamPreview, 0, 0, w, h);
                    ctx.restore();
                    
                    // Add border
                    ctx.strokeStyle = '#d63384';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, w, h);
                }

                requestAnimationFrame(drawLoop);
            };
            drawLoop();

            // 3. Combine Streams
            const canvasStream = recordingCanvas.captureStream(30);
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...recordingDestination.stream.getAudioTracks()
            ]);

            mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8,opus' });
            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `Karaoke_${new Date().getTime()}.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            };

            mediaRecorder.start();
            console.log("Recording started...");

        } catch (err) {
            console.error("Recording error:", err);
            alert("Gagal memulai rekaman. Pastikan izin mikrofon diberikan.");
        }
    }

    function stopRecording() {
        isRecording = false;
        if (mediaRecorder) mediaRecorder.stop();
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        recordBtn.textContent = '🔴 Rekam';
        recordBtn.style.background = '#ff5252';
        console.log("Recording stopped.");
    }


    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('SW Registered', reg))
                .catch(err => console.log('SW Error', err));
        });
    }

});

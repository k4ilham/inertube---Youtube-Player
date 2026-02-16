document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsGrid = document.getElementById('resultsGrid');
    const downloadStatus = document.getElementById('downloadStatus');
    const homeBtn = document.getElementById('homeBtn');
    const historyBtn = document.getElementById('historyBtn');
    const downloadsBtn = document.getElementById('downloadsBtn');
    const playlistsBtn = document.getElementById('playlistsBtn');
    const karaokeNavBtn = document.getElementById('karaokeNavBtn');
    const moviesBtn = document.getElementById('moviesBtn');
    const kidsBtn = document.getElementById('kidsBtn');
    const musicBtn = document.getElementById('musicBtn');
    const seriesBtn = document.getElementById('seriesBtn');
    const gamesBtn = document.getElementById('gamesBtn');
    const gameArea = document.getElementById('gameArea');
    const gameIframe = document.getElementById('gameIframe');
    const mainContent = document.querySelector('main');
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
    let isSeriesSearch = false; // Series Mode State
    let isGamesSearch = false; // Games Mode State
    let currentMovieCategory = 'All';

    // Navigation
    function setActiveNav(btn) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Sidebars
        const sidebarHome = document.getElementById('sidebar-home');
        const sidebarKaraoke = document.getElementById('sidebar-karaoke');
        const sidebarMovies = document.getElementById('sidebar-movies');
        const sidebarKids = document.getElementById('sidebar-kids');
        const sidebarMusic = document.getElementById('sidebar-music');
        const sidebarSeries = document.getElementById('sidebar-series');
        const sidebarGames = document.getElementById('sidebar-games');

        // Hide all
        sidebarHome.classList.add('hidden');
        sidebarKaraoke.classList.add('hidden');
        sidebarMovies.classList.add('hidden');
        sidebarKids.classList.add('hidden');
        sidebarMusic.classList.add('hidden');
        sidebarSeries.classList.add('hidden');
        sidebarGames.classList.add('hidden');

        // Reset display
        resultsGrid.classList.remove('hidden');
        if (gameArea) gameArea.classList.add('hidden');
        if (gameIframe) gameIframe.src = '';
        if (mainContent) mainContent.classList.remove('no-padding');

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
        } else if (btn === seriesBtn) {
            sidebarSeries.classList.remove('hidden');
        } else if (btn === gamesBtn) {
            sidebarGames.classList.remove('hidden');
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
        isSeriesSearch = false;
        isGamesSearch = false;
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
        isSeriesSearch = false;
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
        isSeriesSearch = false;
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
        isSeriesSearch = false;
        searchInput.value = '';
        showLoading();

        // Reset kids category
        document.querySelectorAll('.category-kids-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-kids-btn[data-query="Kartun Anak Dub Indo"]').classList.add('active');

        performSearch('Kartun Anak Dub Indo');
    });

    musicBtn.addEventListener('click', () => {
        setActiveNav(musicBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = true;
        isSeriesSearch = false;
        isGamesSearch = false;
        searchInput.value = '';
        showLoading();

        // Reset music category
        document.querySelectorAll('.category-music-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-music-btn[data-query="Lagu Indonesia Populer 2024"]').classList.add('active');

        performSearch('Lagu Indonesia Populer 2024');
    });

    seriesBtn.addEventListener('click', () => {
        setActiveNav(seriesBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        isSeriesSearch = true;
        isGamesSearch = false;
        searchInput.value = '';
        showLoading();

        // Reset series category
        document.querySelectorAll('.category-series-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-series-btn[data-query="Captain Tsubasa Episode"]').classList.add('active');

        performSearch('Captain Tsubasa Episode');
    });

    gamesBtn.addEventListener('click', () => {
        setActiveNav(gamesBtn);
        isKaraokeSearch = false;
        isMovieSearch = false;
        isKidsSearch = false;
        isMusicSearch = false;
        isSeriesSearch = false;
        isGamesSearch = true;
        searchInput.value = '';
        showLoading();

        // Reset and set active
        document.querySelectorAll('.category-game-btn').forEach(b => b.classList.remove('active'));
        const defaultGame = document.querySelector('.category-game-btn[data-url="/static/games/snake.html"]');
        if (defaultGame) {
            defaultGame.classList.add('active');
            resultsGrid.classList.add('hidden');
            gameArea.classList.remove('hidden');
            gameIframe.src = defaultGame.dataset.url;
            if (mainContent) mainContent.classList.add('no-padding');
        }
    });

    document.querySelectorAll('.category-series-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-series-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch(btn.dataset.query);
        });
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
            let query = '';
            if (currentMovieCategory === 'Dubbing Indonesia') {
                query = `Film Dubbing Indonesia Full Movie`;
            } else if (currentMovieCategory === 'Korea') {
                query = `Film Korea Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Drama China') {
                query = `Drama China Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Film Pendek Cina') {
                query = `Film Pendek Cina Sub Indo`;
            } else if (currentMovieCategory === 'FTV') {
                query = `FTV Indonesia Terbaru Full`;
            } else if (currentMovieCategory === 'Sinetron') {
                query = `Sinetron Indonesia Terbaru Full Episode`;
            } else if (currentMovieCategory === 'Film Bioskop') {
                query = `Film Bioskop Indonesia Terbaru Full Movie`;
            } else if (currentMovieCategory === 'Film Pendek') {
                query = `Film Pendek Indonesia Terbaik`;
            } else if (currentMovieCategory === 'Top 10') {
                query = `Trending Movies 2024 Full Movie`;
            } else if (currentMovieCategory === 'Netflix Originals') {
                query = `Netflix Originals Movies Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Anime') {
                query = `Anime Movie Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Romance') {
                query = `Film Romantis Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Crime Thriller') {
                query = `Crime Thriller Movie Full Movie Sub Indo`;
            } else if (currentMovieCategory === 'Reality Show') {
                query = `Reality Show Populer Sub Indo`;
            } else {
                let queryGenre = currentMovieCategory === 'All' ? '' : currentMovieCategory;
                query = `Film ${queryGenre} Full Movie Bahasa Indonesia Sub Indo`;
            }
            performSearch(query);
        });
    });

    // Kids Sidebar
    document.querySelectorAll('.category-kids-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-kids-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const query = btn.dataset.query;
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


    // Game Sidebar
    document.querySelectorAll('.category-game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-game-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.type === 'local') {
                resultsGrid.classList.add('hidden');
                gameArea.classList.remove('hidden');
                gameIframe.src = btn.dataset.url;
                if (mainContent) mainContent.classList.add('no-padding');
            } else {
                resultsGrid.classList.remove('hidden');
                gameArea.classList.add('hidden');
                gameIframe.src = '';
                if (mainContent) mainContent.classList.remove('no-padding');
                performSearch(btn.dataset.query);
            }
        });
    });

    // Search
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            resultsGrid.classList.remove('hidden');
            if (gameArea) gameArea.classList.add('hidden');
            if (gameIframe) gameIframe.src = '';
            performSearch(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                resultsGrid.classList.remove('hidden');
                if (gameArea) gameArea.classList.add('hidden');
                if (gameIframe) gameIframe.src = '';
                performSearch(query);
            }
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
                    // Fallback to trending if no history
                    performSearch("Trending Indonesia");
                }
            })
            .catch(err => {
                console.error('Error loading history for recommendations:', err);
                performSearch("Trending Indonesia");
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
        if (!video) return;
        currentVideoId = video.id;
        currentVideoObj = video;

        // Save to history
        addToHistory(video);

        // Open native player directly in a new tab for EVERY video!
        window.open(`/karaoke/${video.id}`, '_blank');
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

    // Event Listeners for search

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

    window.deletePlaylist = function (name) {
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
    // PiP and modal logic removed as players now open in new tabs

    // Remove old floating player logic entirely if replacing?
    // User asked "why not frontmost", giving Native PiP is the answer.
    // So we can comment out or remove the old "floatingPlayer" HTML references if we want, 
    // but the task is to FIX the behavior.
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

    // --- Recording Logic ---
    // (Moved to karaoke.js)


    // PWA Service Worker Registration removed
});

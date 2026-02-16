# InerTube - Premium Video & Karaoke Player

A professional, desktop-like YouTube viewer and karaoke session application built with Python (Flask) and a ultra-modern vanilla JavaScript frontend. **InerTube** provides a clean, ad-free interface to search, watch, download, and perform karaoke with recording capabilities.

## 🌟 Key Features

### 📺 Video Experience
- **Search**: Advanced search with infinite scrolling and specialized filters.
- **Playback**: Ad-free video playback in a premium modal interface.
- **Native PiP**: Use **Popup Player** to watch videos in a floating window that stays on top.
- **History & Playlists**: Automatically track your watch history and organize videos into custom collections.

### 🎤 Karaoke & Duet Mode
- **Synced Lyrics**: Sing along with real-time, auto-synced lyrics fetched directly from YouTube.
- **Vocal Remover (Beta)**: Real-time audio processing using Web Audio API to suppress vocals from original tracks.
- **Mode Duet**: Split-screen layout featuring the video on the left and your webcam feed next to the lyrics on the right.

### 🔴 Session Recording
- **Composite Capture**: Record your entire karaoke performance including the music, your microphone, and the combined video+webcam feed.
- **Instant Download**: Automatically save your performance as a `.webm` file once you stop recording.

### ⬇️ Media Downloads
- **MP4/MP3**: Download videos in high quality or extract audio directly to your local `downloads/` folder.

### 📱 PWA Support (Modern App)
- **Installable**: Full Progressive Web App support. Install **InerTube** directly to your desktop or mobile home screen as a standalone application.

---

## 🛠️ Prerequisites

- **Python 3.8+**
- **FFmpeg**: Required for `yt-dlp` to merge audio/video and for MP3 conversion (must be in your system PATH).

## 🚀 Installation

1.  Clone or download this repository.
2.  Open a terminal in the project directory.
3.  Create a virtual environment (recommended):
    ```bash
    python -m venv .venv
    # Windows
    .\.venv\Scripts\activate
    # Linux/Mac
    source .venv/bin/activate
    ```
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## 🎮 Usage

1.  Run the application:
    ```bash
    python app.py
    ```
2.  **Desktop Support**: The app attempts to open in a native `pywebview` window. If unavailable, it will automatically serve at `http://127.0.0.1:5000` in your default browser.
3.  **To Install as App**: Visit the URL in Chrome/Edge and click the "Install InerTube" icon in the address bar.

## 👨‍💻 Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML5, Vanilla CSS (Premium Dark Mode), Vanilla JavaScript
- **Karaoke Engine**: Web Audio API (Spatial/Inverting processing)
- **Lyrics**: `youtube-transcript-api`
- **Search Engine**: `youtube-search-python`
- **Downloader**: `yt-dlp`
- **Desktop Wrapper**: `pywebview`

---

## 👨‍🎨 Created By

**Ilham Maulana**
📧 [k4ilham@gmail.com](mailto:k4ilham@gmail.com)

---

## 🔧 Troubleshooting

- **"Failed to initialize pythonnet"**: Common on Windows without specific .NET runtimes. The app is 100% functional in any modern browser.
- **Microphone/Camera Access**: Ensure you grant permissions when prompted for Karaoke Duet Mode or Recording.
- **No Lyrics Found**: Lyrics depend on YouTube's Closed Captions/Transcript availability.

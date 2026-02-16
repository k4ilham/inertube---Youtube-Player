# YouTube Viewer App

A modern, desktop-like YouTube viewer application built with Python (Flask) and a vanilla JavaScript frontend. This application provides a clean, ad-free interface to search, watch, download, and manage YouTube videos.

## Features

- **Search**: Search for YouTube videos with infinite scrolling support.
- **Playback**: Watch videos in a modal player without ads.
- **Downloads**: Download videos as **MP4** (Video) or **MP3** (Audio) directly to your local machine.
- **History**: Automatically tracks your watch history.
- **Playlists**: Create and manage custom playlists. Add videos to playlists for later viewing.
- **Popup Player**: Use the **Native Picture-in-Picture** mode to watch videos in a floating window that stays on top of other applications.
- **Desktop Application**: Designed to run as a desktop app using `pywebview` (falls back to default browser if desktop environment is unavailable).
- **Responsive Design**: Modern, dark-themed UI that works on various screen sizes.

## Prerequisites

- **Python 3.8+**
- **FFmpeg**: Required for `yt-dlp` to merge audio/video and convert formats (add to your system PATH).

## Installation

1.  Clone or download this repository.
2.  Open a terminal in the project directory.
3.  Create a virtual environment (optional but recommended):
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

## Usage

1.  Run the application:
    ```bash
    python app.py
    ```
2.  The application will attempt to open in a dedicated desktop window. If that fails (due to missing system libraries), it will open in your default web browser at `http://127.0.0.1:5000`.

## Key Features Guide

### Downloading
- Click the "Download MP4" or "Download MP3" buttons below any video.
- Files are saved in the `downloads/` folder within the project directory.

### Playlists
- Click the "Playlists" button in the header to view your collections.
- Create new playlists via the "Create Playlist" modal.
- Add videos to playlists from the video player options.

### Popup Player (Picture-in-Picture)
- Open a video.
- Click the **Popup Player** button.
- The video will detach from the browser window and float on top of your screen. You can resize and move it anywhere.

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Search**: `youtube-search-python`
- **Downloading**: `yt-dlp`
- **Desktop Wrapper**: `pywebview`

## Troubleshooting

- **"Failed to initialize pythonnet"**: If the desktop window doesn't open, the app automatically falls back to your web browser. This is common on some Windows environments without specific .NET runtimes. The app is fully functional in the browser.
- **Download Errors**: Ensure FFmpeg is installed and added to your system PATH if downloads fail or conversion errors occur.

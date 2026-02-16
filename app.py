import webview
from flask import Flask, render_template, request, jsonify
from youtubesearchpython import VideosSearch
import sys
import threading
import os
import json

app = Flask(__name__)

# Global variable to store the current search object for pagination
CURRENT_SEARCH = None
CURRENT_QUERY = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    return app.send_static_file('../manifest.json')

@app.route('/service-worker.js')
def service_worker():
    return app.send_static_file('../service-worker.js')

@app.route('/api/search')
def search():
    global CURRENT_SEARCH, CURRENT_QUERY
    query = request.args.get('q', '')
    next_page = request.args.get('next', 'false') == 'true'
    
    if not query and not next_page:
        return jsonify([])
    
    try:
        if next_page and CURRENT_SEARCH and query == CURRENT_QUERY:
            CURRENT_SEARCH.next()
            raw_results = CURRENT_SEARCH.result()
        else:
            CURRENT_QUERY = query
            CURRENT_SEARCH = VideosSearch(query, limit=20)
            raw_results = CURRENT_SEARCH.result()
        
        # Map results to frontend format
        mapped_results = []
        if 'result' in raw_results:
            for item in raw_results['result']:
                if item['type'] == 'video':
                    mapped_results.append({
                        'id': item['id'],
                        'title': item['title'],
                        'thumbnails': [t['url'] for t in item['thumbnails']] if item.get('thumbnails') else [],
                        'channel': item['channel']['name'] if item.get('channel') else 'Unknown',
                        'duration': item.get('duration'),
                        'views': item.get('viewCount', {}).get('text') if isinstance(item.get('viewCount'), dict) else item.get('viewCount')
                    })
        
        return jsonify(mapped_results)
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify([])

@app.route('/api/download')
def download():
    video_id = request.args.get('id')
    fmt = request.args.get('format', 'mp4')
    
    if not video_id:
        return jsonify({'error': 'No video ID provided'}), 400

    url = f'https://www.youtube.com/watch?v={video_id}'
    download_folder = os.path.join(os.getcwd(), 'downloads')
    os.makedirs(download_folder, exist_ok=True)

    ydl_opts = {
        'outtmpl': os.path.join(download_folder, '%(title)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }

    if fmt == 'mp3':
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:
        # Best video+audio that is compatible or single file
        ydl_opts.update({
            'format': 'best[ext=mp4]', # Sederhana: download best mp4 container available
        })

    try:
        import yt_dlp
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if fmt == 'mp3':
                filename = filename.rsplit('.', 1)[0] + '.mp3'
            
        return jsonify({'status': 'success', 'file': filename, 'message': f'Downloaded to {filename}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream')
def stream():
    video_id = request.args.get('id')
    if not video_id:
        return jsonify({'error': 'No video ID provided'}), 400

    url = f'https://www.youtube.com/watch?v={video_id}'
    
    # We need a format that browsers can play natively (mp4/webm with h264/vp9)
    # Browsers typically support mp4 container with h264 well.
    # We want "best video[height<=720]+bestaudio/best[height<=720]" to avoid massive files, but for streaming direct url:
    # We need a direct URL. `yt-dlp -g` gives that.
    
    try:
        import yt_dlp
        # Prefer 18 (360p) or 22 (720p) which are guaranteed single-file mp4 with audio
        # If not available, fallback to best mp4 under 720p
        ydl_opts = {
            'format': '18/22/best[ext=mp4][height<=720]',
            'quiet': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({'url': info['url'], 'title': info.get('title')})
    except Exception as e:
        print(f"Stream error: {e}")
        return jsonify({'error': str(e)}), 500

HISTORY_FILE = 'history.json'

def load_history_data():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_history_data(data):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/history', methods=['GET', 'POST'])
def history():
    if request.method == 'GET':
        return jsonify(load_history_data())
    
    if request.method == 'POST':
        video = request.json
        if not video:
            return jsonify({'error': 'No data'}), 400
            
        history_data = load_history_data()
        
        # Remove existing entry if present (to bump to top)
        history_data = [v for v in history_data if v['id'] != video['id']]
        
        # Add timestamp
        from datetime import datetime
        video['timestamp'] = datetime.now().isoformat()
        
        # Add to beginning
        history_data.insert(0, video)
        
        # Limit to 50 items
        history_data = history_data[:50]
        
        save_history_data(history_data)
        return jsonify({'status': 'success'})

PLAYLISTS_FILE = 'playlists.json'

def load_playlists_data():
    if not os.path.exists(PLAYLISTS_FILE):
        return {}
    try:
        with open(PLAYLISTS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_playlists_data(data):
    with open(PLAYLISTS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/lyrics')
def lyrics():
    video_id = request.args.get('id')
    if not video_id:
        return jsonify({'error': 'No video ID provided'}), 400
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        # Fetch transcript
        # We try to get 'en' or auto-generated
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find english or manually created first
        try:
            transcript = transcript_list.find_manually_created_transcript(['en', 'id'])
        except:
            try:
                # Fallback to generated
                transcript = transcript_list.find_generated_transcript(['en', 'id'])
            except:
                 # Fallback to ANY
                 transcript = transcript_list[0]
        
        return jsonify(transcript.fetch())
    except Exception as e:
        # print(f"Lyrics error: {e}") # Debug
        try:
             # Last resort: just `get_transcript` which picks first available
             from youtube_transcript_api import YouTubeTranscriptApi
             t = YouTubeTranscriptApi.get_transcript(video_id)
             return jsonify(t)
        except Exception as e2:
             return jsonify({'error': 'No lyrics found.'}), 404

@app.route('/api/playlists', methods=['GET', 'POST'])
def playlists():
    if request.method == 'GET':
        return jsonify(load_playlists_data())
    
    if request.method == 'POST':
        name = request.json.get('name')
        if not name:
            return jsonify({'error': 'No name provided'}), 400
            
        data = load_playlists_data()
        if name in data:
            return jsonify({'error': 'Playlist already exists'}), 400
            
        data[name] = []
        save_playlists_data(data)
        return jsonify({'status': 'success'})

@app.route('/api/playlists/<name>', methods=['GET', 'DELETE'])
def playlist_detail(name):
    data = load_playlists_data()
    if name not in data:
        return jsonify({'error': 'Playlist not found'}), 404
        
    if request.method == 'GET':
        return jsonify(data[name])
        
    if request.method == 'DELETE':
        del data[name]
        save_playlists_data(data)
        return jsonify({'status': 'success'})

@app.route('/api/playlists/<name>/add', methods=['POST'])
def add_to_playlist(name):
    data = load_playlists_data()
    if name not in data:
        return jsonify({'error': 'Playlist not found'}), 404
        
    video = request.json
    if not video:
        return jsonify({'error': 'No video data'}), 400
        
    # Check for duplicates
    for v in data[name]:
        if v['id'] == video['id']:
            return jsonify({'status': 'success', 'message': 'Already in playlist'})
            
    data[name].append(video)
    save_playlists_data(data)
    return jsonify({'status': 'success'})

@app.route('/api/downloads')
def list_downloads():
    download_folder = os.path.join(os.getcwd(), 'downloads')
    if not os.path.exists(download_folder):
        return jsonify([])
    
    files = []
    for f in os.listdir(download_folder):
        file_path = os.path.join(download_folder, f)
        if os.path.isfile(file_path):
            # Get file stats
            stats = os.stat(file_path)
            size_mb = round(stats.st_size / (1024 * 1024), 2)
            
            files.append({
                'name': f,
                'path': file_path,
                'size': f"{size_mb} MB"
            })
    return jsonify(files)

def start_server():
    app.run(port=5000, threaded=True)

if __name__ == '__main__':
    # Start Flask in a separate thread
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()

    try:
        # Try to start the webview
        webview.create_window('YouTube Viewer', 'http://127.0.0.1:5000', width=1200, height=800, background_color='#18181b')
        webview.start()
    except Exception as e:
        print(f"Warning: Could not start desktop window ({e}). Opening in default browser...")
        import webbrowser
        import time
        time.sleep(1) # Wait for server to start
        webbrowser.open('http://127.0.0.1:5000')
        
        # Keep the main thread alive since Flask is in a daemon thread
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            sys.exit(0)

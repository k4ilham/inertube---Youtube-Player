import requests
import json

video_id = "qqGgaSC5sog" # Budi Doremi - Melukis Senja
print(f"Testing stream API for {video_id}...")
r = requests.get(f"http://127.0.0.1:5000/api/stream?id={video_id}")
print(f"Status: {r.status_code}")
try:
    data = r.json()
    print("URL length:", len(data.get('url', '')))
    print("Title:", data.get('title'))
    
    proxy_url = f"http://127.0.0.1:5000/api/proxy?url={data['url']}"
    print(f"Testing proxy for stream...")
    # Just try to get headers
    pr = requests.head(proxy_url)
    print(f"Proxy status: {pr.status_code}")
    print(f"Content-Type: {pr.headers.get('Content-Type')}")
except Exception as e:
    print(f"Error: {e}")

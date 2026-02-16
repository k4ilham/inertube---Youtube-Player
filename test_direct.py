import requests
import json

video_id = "qqGgaSC5sog" 
r = requests.get(f"http://127.0.0.1:5000/api/stream?id={video_id}")
data = r.json()
url = data['url']

print(f"Testing direct URL...")
# Use a browser-like user agent
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
dr = requests.head(url, headers=headers)
print(f"Direct URL status: {dr.status_code}")
print(f"Content-Type: {dr.headers.get('Content-Type')}")

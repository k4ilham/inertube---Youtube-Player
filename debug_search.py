from youtube_search import YoutubeSearch
import json

results = YoutubeSearch('test', max_results=1).to_dict()
print(json.dumps(results, indent=2))

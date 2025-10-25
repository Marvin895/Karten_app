from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Foursquare API Key
FSQ_API_KEY = "fsq3ETr3iUJk01TB/xYrQrNL+y3ZfiTOjd7t8c+sVEAXtEM="

HEADERS = {
    "Accept": "application/json",
    "Authorization": FSQ_API_KEY
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/places')
def get_places():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    radius = request.args.get('radius', 500)
    categories = request.args.get('categories', "13065")  # default z.B. café
    url = f"https://api.foursquare.com/v3/places/search?ll={lat},{lon}&radius={radius}&categories={categories}&limit=50"
    
    try:
        res = requests.get(url, headers=HEADERS)
        data = res.json()
        places = []
        for p in data.get('results', []):
            places.append({
                "name": p.get("name"),
                "lat": p["geocodes"]["main"]["latitude"],
                "lon": p["geocodes"]["main"]["longitude"],
                "type": p.get("categories")[0]["name"] if p.get("categories") else "default"
            })
        return jsonify(places)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)

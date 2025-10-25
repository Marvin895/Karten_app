from flask import Flask, jsonify, request, send_from_directory
import requests
import os

app = Flask(__name__, static_folder="static")

# === Dein Foursquare API Key ===
FOURSQUARE_API_KEY = "fsq3ETr3iUJk01TB/xYrQrNL+y3ZfiTOjd7t8c+sVEAXtEM="

# === Startseite (liefert index.html) ===
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

# === Proxy-Endpunkt zu Foursquare ===
@app.route("/api/places")
def get_places():
    lat = request.args.get("lat")
    lng = request.args.get("lng")
    radius = request.args.get("radius", 1000)
    category = request.args.get("category", "cafe")

    url = f"https://api.foursquare.com/v3/places/search?ll={lat},{lng}&radius={radius}&categories={category}&limit=50"
    headers = {
        "Accept": "application/json",
        "Authorization": FOURSQUARE_API_KEY
    }

    response = requests.get(url, headers=headers)
    return jsonify(response.json())

# === Statische Dateien (JS, CSS, Icons usw.) ===
@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

# === Start im lokalen Testmodus ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

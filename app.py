import os
import sqlite3
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
DB_PATH = "places.db"

# --- Datenbank initialisieren ---
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS places (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                lat REAL,
                lon REAL,
                type TEXT
            )
        ''')
        # Beispiel-Daten
        c.executemany('INSERT INTO places (name, lat, lon, type) VALUES (?, ?, ?, ?)', [
            ("Café Central", 48.2082, 16.3738, "cafe"),
            ("Hauptbahnhof", 48.1857, 16.3771, "station"),
            ("Stadtpark", 48.2065, 16.3790, "park")
        ])
        conn.commit()
        conn.close()


# --- API-Endpunkte ---

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/places')
def api_places():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, lat, lon, type FROM places")
    rows = c.fetchall()
    conn.close()

    data = [
        {"id": r[0], "name": r[1], "lat": r[2], "lon": r[3], "type": r[4]}
        for r in rows
    ]
    return jsonify(data)


@app.route('/api/add_place', methods=['POST'])
def api_add_place():
    data = request.json
    if not data or "name" not in data or "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid input"}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO places (name, lat, lon, type) VALUES (?, ?, ?, ?)",
        (data["name"], data["lat"], data["lon"], data.get("type", "custom"))
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})


@app.route('/api/route')
def api_route():
    """Liefert eine Route zwischen zwei Punkten über OSRM (OpenStreetMap Routing)"""
    start = request.args.get("start")
    end = request.args.get("end")

    if not start or not end:
        return jsonify({"error": "Missing parameters"}), 400

    import requests
    osrm_url = f"https://router.project-osrm.org/route/v1/driving/{start};{end}?overview=full&geometries=geojson"
    r = requests.get(osrm_url)
    return jsonify(r.json())


# --- Startpunkt ---
if __name__ == '__main__':
    init_db()
    app.run(debug=True)

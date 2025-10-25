// --- Karte initialisieren ---
const map = L.map('map').setView([48.2082, 16.3738], 13);

// --- Layer ---
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CARTO'
});

L.control.layers({ 'Standard': osm, 'Dunkel': dark }).addTo(map);

// --- MarkerCluster ---
const markers = L.markerClusterGroup();
map.addLayer(markers);
let routeLayer = null;
let startPoint = null;

// --- POI-Filter ---
const MIN_ZOOM_FOR_POIS = 15;

// --- Icons für POIs ---
function getIconForAmenity(amenity) {
  const icons = {
    cafe: '/static/icons/cafe.png',
    restaurant: '/static/icons/restaurant.png',
    bar: '/static/icons/bar.png',
    fast_food: '/static/icons/fast_food.png',
    fuel: '/static/icons/fuel.png',
    parking: '/static/icons/parking.png',
    parking_entrance: '/static/icons/parking_entrance.png',
    bike_parking: '/static/icons/bike_parking.png',
    atm: '/static/icons/atm.png',
    bank: '/static/icons/bank.png',
    park: '/static/icons/park.png',
    hospital: '/static/icons/hospital.png',
    pharmacy: '/static/icons/pharmacy.png',
    school: '/static/icons/school.png',
    supermarket: '/static/icons/supermarket.png',
    hotel: '/static/icons/hotel.png',
    cinema: '/static/icons/cinema.png',
    museum: '/static/icons/museum.png',
    playground: '/static/icons/playground.png'
  };
  
  const iconUrl = icons[amenity] || '/static/icons/default.png';
  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -25]
  });
}

// --- Foursquare API Key ---
const FOURSQUARE_API_KEY = 'fsq3ETr3iUJk01TB/xYrQrNL+y3ZfiTOjd7t8c+sVEAXtEM=';

// --- POIs laden ---
async function loadPOIs() {
  const zoom = map.getZoom();
  if (zoom < MIN_ZOOM_FOR_POIS) {
    markers.clearLayers();
    return;
  }

  const center = map.getCenter();
  const radius = Math.min(
    map.distance(map.getBounds().getNorthWest(), map.getBounds().getSouthEast()) / 2,
    5000
  ); // max 5 km

  // --- Aktuelle Foursquare Kategorien (Slugs) ---
  const categories = [
    "cafe",
    "restaurant",
    "bar",
    "fast_food",
    "fuel",
    "parking",
    "parking_entrance",
    "bike_parking",
    "atm",
    "bank",
    "hospital",
    "pharmacy",
    "supermarket",
    "hotel",
    "cinema",
    "museum",
    "park",
    "playground"
  ];

  markers.clearLayers();

  for (let category of categories) {
    const url = `https://api.foursquare.com/v3/places/search?ll=${center.lat},${center.lng}&radius=${Math.round(radius)}&categories=${category}&limit=50`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: FOURSQUARE_API_KEY
        }
      });

      const data = await res.json();
      if (data.results) {
        data.results.forEach(p => {
          const lat = p.geocodes.main.latitude;
          const lng = p.geocodes.main.longitude;
          const type = p.categories[0]?.slug || "Unbekannt";
          const icon = getIconForAmenity(type);
          const m = L.marker([lat, lng], { icon });
          m.bindPopup(`<b>${p.name}</b><br/>Typ: ${type}`);
          markers.addLayer(m);
        });
      }
    } catch (err) {
      console.error("Foursquare Fehler:", err);
    }
  }
}

// --- Karte bewegt sich / zoomt ---
map.on('moveend', loadPOIs);
map.on('zoomend', loadPOIs);
loadPOIs();

// --- Suche mit Nominatim ---
async function nominatimSearch(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
  return res.json();
}

document.getElementById('searchBtn').addEventListener('click', async () => {
  const q = document.getElementById('search').value.trim();
  if (!q) return;
  const results = await nominatimSearch(q);
  if (results && results.length > 0) {
    const r = results[0];
    map.setView([r.lat, r.lon], 15);
    L.popup().setLatLng([r.lat, r.lon]).setContent(r.display_name).openOn(map);
  }
});

// --- Standortanzeige ---
document.getElementById('locBtn').addEventListener('click', () => {
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      map.setView([lat, lon], 15);
      L.marker([lat, lon]).addTo(map).bindPopup('📍 Du bist hier').openPopup();
    });
  } else { alert('Geolocation wird nicht unterstützt.'); }
});

// --- Routing per Klick ---
map.on('click', e => {
  if (!startPoint) {
    startPoint = [e.latlng.lat, e.latlng.lng];
    L.marker(startPoint).addTo(map).bindPopup('Startpunkt').openPopup();
  } else {
    const endPoint = [e.latlng.lat, e.latlng.lng];
    getRoute(startPoint, endPoint);
    startPoint = null;
  }
});

// --- Route löschen ---
document.getElementById('clearRouteBtn').addEventListener('click', ()=>{
  if(routeLayer) map.removeLayer(routeLayer);
});

// --- Routing-Funktion (OSRM) ---
async function getRoute(start, end){
  const url = `/api/route?start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if(data.routes && data.routes.length>0){
      const geo = data.routes[0].geometry;
      if(routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.geoJSON(geo, { style: { color:'blue', weight:4, opacity:0.7 } }).addTo(map);
      map.fitBounds(routeLayer.getBounds());
    } else { alert('Keine Route gefunden.'); }
  } catch(err){
    console.error('Routing-Fehler:', err);
  }
}

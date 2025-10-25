// Leaflet Karte initialisieren
const map = L.map('map').setView([48.2082, 16.3738], 13);

// Kartenlayer
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
osm.addTo(map);

// Marker Layer
const markers = L.layerGroup().addTo(map);

// Icons
const icons = {
  cafe: L.icon({ iconUrl: '/static/icons/cafe.png', iconSize: [32, 32] }),
  bank: L.icon({ iconUrl: '/static/icons/bank.png', iconSize: [32, 32] }),
  park: L.icon({ iconUrl: '/static/icons/park.png', iconSize: [32, 32] }),
  playground: L.icon({ iconUrl: '/static/icons/playground.png', iconSize: [32, 32] }),
  pharmacy: L.icon({ iconUrl: '/static/icons/pharmacy.png', iconSize: [32, 32] }),
  hospital: L.icon({ iconUrl: '/static/icons/hospital.png', iconSize: [32, 32] }),
  supermarket: L.icon({ iconUrl: '/static/icons/supermarket.png', iconSize: [32, 32] }),
  hotel: L.icon({ iconUrl: '/static/icons/hotel.png', iconSize: [32, 32] }),
  museum: L.icon({ iconUrl: '/static/icons/museum.png', iconSize: [32, 32] }),
  cinema: L.icon({ iconUrl: '/static/icons/cinema.png', iconSize: [32, 32] }),
  parking_entrance: L.icon({ iconUrl: '/static/icons/parking_entrance.png', iconSize: [32, 32] }),
  bike_parking: L.icon({ iconUrl: '/static/icons/bike_parking.png', iconSize: [32, 32] }),
  default: L.icon({ iconUrl: '/static/icons/default.png', iconSize: [32, 32] })
};

// POIs laden
async function loadPOIs() {
  if (map.getZoom() < 13) {
    markers.clearLayers(); // zu niedrig -> Marker ausblenden
    return;
  }

  const center = map.getCenter();
  const res = await fetch(`/api/places?lat=${center.lat}&lon=${center.lng}`);
  const places = await res.json();

  markers.clearLayers();
  places.forEach(p => {
    const icon = icons[p.type.toLowerCase()] || icons.default;
    const m = L.marker([p.lat, p.lon], { icon }).addTo(markers);
    m.bindPopup(`<b>${p.name}</b><br/>Typ: ${p.type}`);
  });
}

// Marker neu laden bei Zoom/Move
map.on('moveend zoomend', loadPOIs);

// initial laden
loadPOIs();

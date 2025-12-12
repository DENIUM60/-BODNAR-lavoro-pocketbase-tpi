import './style.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

//CONFIGURAZIONE COSTANTI
const URL_MAP = {
  1:  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  7:  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
  30: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'
};

//Confini nazioni
const BORDERS_API_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

const TILES = {
  LIGHT: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  DARK:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';
const REFRESH_RATE = 300000; // ogni 5 minuti

//definisce lo stato iniziale del sito
const state = {
  theme: 'light',
  days: 1,      
  minMag: 0,    
  layers: {
    base: null,
    data: L.layerGroup(),
    borders: null
  }
};

//INIZIALIZZAZIONE MAPPA
const map = L.map('map', { zoomControl: false }).setView([45.605, 10.212], 3);

// 1. Layer Base (caricamento titles)
state.layers.base = L.tileLayer(TILES.LIGHT, { attribution: ATTRIBUTION }).addTo(map);

// 2. Layer Dati (Terremoti)
state.layers.data.addTo(map);

// 3. Tasti zoom
L.control.zoom({ position: 'topright' }).addTo(map);

//Caricamento dei confini
async function loadBorders() {
  try {
    const res = await fetch(BORDERS_API_URL);
    if (!res.ok) throw new Error('Errore durante il caricamento dei confini');
    const data = await res.json();

    // dati --> disegno sulla mappa
    state.layers.borders = L.geoJSON(data, {
      style: {
        color: '#555555', // Colore iniziale (per tema chiaro)
        weight: 1,
        fillOpacity: 0    // Solo contorno, niente riempimento
      }
    }).addTo(map);
    
    // Assicura che i terremoti stiano sopra i confini
    state.layers.borders.bringToBack();
    state.layers.base.bringToBack();

  } catch (err) {
    console.error("Impossibile caricare i confini:", err);
  }
}

//cose visive

// A. Pannello con filtri e tabella
const InfoControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function() {
    const div = L.DomUtil.create('div', 'custom-control');
    L.DomEvent.disableClickPropagation(div);
    div.innerHTML = `
      <h3>🌍 Monitoraggio Sismico</h3>
      <div id="status" style="color:var(--success); margin-bottom:5px;">In attesa...</div>
      
      <label>Periodo:</label>
      <select id="daysInput" class="control-input">
        <option value="1">Ultime 24 ore</option>
        <option value="7">Ultimi 7 giorni</option>
        <option value="30">Ultimi 30 giorni</option>
      </select>

      <label>Magnitudo Minima:</label>
      <input type="number" id="magInput" class="control-input" min="0" max="9" step="0.1" value="0">

      <div style="max-height: 200px; overflow-y: auto;">
        <table class="quake-table">
          <thead><tr><th>Luogo</th><th>Mag</th><th>Ora</th></tr></thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
    `;
    return div;
  }
});

// B. Bottone Tema
const ThemeControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd: function() {
    const div = L.DomUtil.create('div', 'leaflet-bar');
    L.DomEvent.disableClickPropagation(div);
    const btn = L.DomUtil.create('button', 'theme-btn', div);
    btn.id = 'themeBtn';
    btn.innerHTML = 'Dark mode';
    btn.onclick = toggleTheme;
    return div;
  }
});

// C. Legenda
const LegendControl = L.Control.extend({
  options: { position: 'bottomleft' },
  onAdd: function() {
    const div = L.DomUtil.create('div', 'custom-control');
    div.innerHTML = `
      <b>Legenda</b><br>
      <span style="color:#ff3333">●</span> ≥ 6.0 (Critico)<br>
      <span style="color:#ffcc66">●</span> ≥ 4.0 (Forte)<br>
      <span style="color:#ffff99">●</span> ≥ 2.0 (Medio)<br>
      <span style="color:#66b3ff">●</span> < 2.0 (Lievi)
    `;
    return div;
  }
});

map.addControl(new InfoControl());
map.addControl(new ThemeControl());
map.addControl(new LegendControl());

// --- LOGICA FUNZIONALE ---

function toggleTheme() {
  const btn = document.getElementById('themeBtn');
  const body = document.body;

  if (state.theme === 'light') {
    // ATTIVA TEMA SCURO
    state.theme = 'dark';
    body.classList.add('dark-theme');
    btn.innerHTML = 'Chiaro';
    state.layers.base.setUrl(TILES.DARK);
    
    // Cambia colore confini in BIANCO/GRIGIO CHIARO per visibilità
    if(state.layers.borders) {
        state.layers.borders.setStyle({ color: '#cccccc', weight: 1 });
    }

  } else {
    // ATTIVA TEMA CHIARO
    state.theme = 'light';
    body.classList.remove('dark-theme');
    btn.innerHTML = 'Dark mode';
    state.layers.base.setUrl(TILES.LIGHT);

    // Cambia colore confini in GRIGIO SCURO
    if(state.layers.borders) {
        state.layers.borders.setStyle({ color: '#555555', weight: 1 });
    }
  }
}

function getColor(mag) {
  if (mag >= 6) return { c: '#ff0000', f: '#ff3333' };
  if (mag >= 4) return { c: '#ff9900', f: '#ffcc66' };
  if (mag >= 2) return { c: '#ffff00', f: '#ffff99' };
  return { c: '#0073e6', f: '#66b3ff' };
}

function getRadius(mag) {
  return 1000 + 1500 * Math.pow(2, mag);
}

async function fetchData() {
  const status = document.getElementById('status');
  const tbody = document.getElementById('tableBody');
  const daysSelect = document.getElementById('daysInput');
  
  status.innerHTML = '⏳ Caricamento...';
  
  try {
    const url = URL_MAP[state.days];
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network err');
    
    const data = await res.json();
    const features = data.features || [];
    const filtered = features.filter(f => (f.properties.mag || 0) >= state.minMag);

    state.layers.data.clearLayers();
    tbody.innerHTML = '';

    filtered.forEach(f => {
      const p = f.properties;
      const g = f.geometry.coordinates;
      const lat = g[1];
      const lng = g[0];
      const mag = p.mag || 0;
      const time = new Date(p.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      const style = getColor(mag);
      L.circle([lat, lng], {
        color: style.c,
        fillColor: style.f,
        fillOpacity: 0.6,
        radius: getRadius(mag)
      }).bindPopup(`<b>${p.place}</b><br>Mag: ${mag}<br>Ora: ${time}`)
        .addTo(state.layers.data);

      if (tbody.children.length < 50) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.place ? p.place.substring(0, 15) + '...' : '?'}</td><td><b>${mag.toFixed(1)}</b></td><td>${time}</td>`;
        tbody.appendChild(tr);
      }
    });

    const labelPeriodo = daysSelect.options[daysSelect.selectedIndex].text;
    status.innerHTML = `${filtered.length} eventi (${labelPeriodo})`;
    status.style.color = 'var(--success)';

  } catch (err) {
    console.error(err);
    status.innerHTML = 'Errore API';
    status.style.color = 'var(--error)';
  }
}

// --- AVVIO ---
document.getElementById('daysInput').addEventListener('change', (e) => { state.days = parseInt(e.target.value); fetchData(); });
document.getElementById('magInput').addEventListener('input', (e) => { state.minMag = parseFloat(e.target.value) || 0; fetchData(); });

loadBorders(); 
fetchData();
setInterval(fetchData, REFRESH_RATE);
/* ============================================================
   QUETZAL ROUTES — maps.js
   Integración con Leaflet.js (open source, sin costo de API).

   REQUISITO: incluir Leaflet en el HTML antes de importar este módulo:
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
   ============================================================ */


// ── Tile layer por defecto (OpenStreetMap) ────────────────────
const TILE_URL         = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

// Referencia interna al mapa activo (una instancia por página)
let _mapInstance = null;


// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa un mapa Leaflet en el contenedor indicado.
 * Si ya existe una instancia en ese contenedor, la destruye primero.
 *
 * @param {string} containerId  - ID del elemento <div> del mapa
 * @param {number} lat          - latitud del centro inicial
 * @param {number} lng          - longitud del centro inicial
 * @param {number} [zoom=14]    - nivel de zoom (1–19)
 * @returns {Object} instancia del mapa Leaflet (L.map)
 */
export function initMap(containerId, lat, lng, zoom = 14) {
  if (!window.L) {
    console.error('[maps.js] Leaflet no está cargado. Incluye el script en el HTML.');
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[maps.js] No se encontró el contenedor #${containerId}`);
    return null;
  }

  // Si ya hay un mapa en este contenedor, destruirlo antes
  if (_mapInstance) {
    _mapInstance.remove();
    _mapInstance = null;
  }

  // Crear el mapa
  _mapInstance = L.map(containerId, {
    zoomControl:       true,
    scrollWheelZoom:   false,  // evitar zoom accidental al hacer scroll
    attributionControl: true,
  }).setView([lat, lng], zoom);

  // Capa de tiles
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom:     19,
  }).addTo(_mapInstance);

  return _mapInstance;
}

/**
 * Devuelve la instancia activa del mapa (o null si no hay).
 * @returns {Object|null}
 */
export function getMapInstance() {
  return _mapInstance;
}


// ════════════════════════════════════════════════════════════════
// MARCADORES
// ════════════════════════════════════════════════════════════════

/**
 * Agrega un marcador personalizado al mapa con popup.
 *
 * @param {Object} map          - instancia de L.map
 * @param {Object} destination  - objeto destino con { lat, lng, title, address }
 * @param {Object} [options]
 * @param {string} [options.emoji='📍']        - emoji del marcador
 * @param {boolean} [options.openPopup=true]   - si abrir el popup al agregar
 * @returns {Object} instancia del marker Leaflet
 */
export function addMarker(map, destination, options = {}) {
  if (!map || !window.L) return null;

  const { emoji = '📍', openPopup = true } = options;

  const icon = L.divIcon({
    html:      `<div class="map-marker-icon">${emoji}</div>`,
    className: '',
    iconSize:  [36, 36],
    iconAnchor:[18, 36],
    popupAnchor: [0, -38],
  });

  const marker = L.marker([destination.lat, destination.lng], { icon })
    .addTo(map)
    .bindPopup(_buildPopupHTML(destination));

  if (openPopup) marker.openPopup();

  return marker;
}

/**
 * Agrega múltiples marcadores y ajusta el mapa para que todos quepan.
 * Ideal para explore.html con varios destinos.
 *
 * @param {Object} map          - instancia de L.map
 * @param {Array}  destinations - array de destinos con { lat, lng, title, address }
 * @param {Object} [options]
 * @param {boolean} [options.fitBounds=true]   - ajustar zoom automáticamente
 * @param {number}  [options.padding=40]       - padding en px alrededor del grupo
 * @returns {Array} array de markers
 */
export function addMarkers(map, destinations, options = {}) {
  if (!map || !window.L || !destinations?.length) return [];

  const { fitBounds = true, padding = 40 } = options;
  const markers = [];

  destinations.forEach(dest => {
    if (dest.lat && dest.lng) {
      const marker = addMarker(map, dest, { openPopup: false });
      if (marker) markers.push(marker);
    }
  });

  // Ajustar el mapa para que todos los marcadores sean visibles
  if (fitBounds && markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [padding, padding] });
  }

  return markers;
}

/**
 * Elimina todos los marcadores del mapa.
 * @param {Object} map      - instancia de L.map
 * @param {Array}  markers  - array de markers a eliminar
 */
export function clearMarkers(map, markers = []) {
  if (!map) return;
  markers.forEach(m => map.removeLayer(m));
}


// ════════════════════════════════════════════════════════════════
// HELPERS DE NAVEGACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Abre Google Maps con indicaciones hacia el destino.
 * @param {Object} destination - objeto con { lat, lng } o { address }
 */
export function showDirections(destination) {
  let url;

  if (destination.lat && destination.lng) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
  } else if (destination.address) {
    const addr = encodeURIComponent(destination.address);
    url = `https://www.google.com/maps/dir/?api=1&destination=${addr}`;
  } else {
    console.warn('[maps.js] showDirections: se necesita lat/lng o address');
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Abre la ubicación en Google Maps (sin indicaciones).
 * @param {Object} destination - objeto con { lat, lng, title }
 */
export function openInGoogleMaps(destination) {
  const query = destination.title
    ? encodeURIComponent(destination.title)
    : `${destination.lat},${destination.lng}`;

  const url = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${destination.lat},${destination.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Centra el mapa en una coordenada con animación suave.
 * @param {Object} map   - instancia de L.map
 * @param {number} lat
 * @param {number} lng
 * @param {number} [zoom=15]
 */
export function flyTo(map, lat, lng, zoom = 15) {
  if (!map) return;
  map.flyTo([lat, lng], zoom, { duration: 1.2 });
}


// ════════════════════════════════════════════════════════════════
// MAPA DE DESTINO (destination.html)
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa el mapa completo de la página de detalle.
 * Crea el mapa, agrega el marcador y conecta el botón "Cómo llegar".
 *
 * @param {Object} destination - objeto destino con lat, lng, title, address
 * @param {string} [containerId='destMap']
 * @returns {Object} { map, marker }
 */
export function initDestinationMap(destination, containerId = 'destMap') {
  if (!destination?.lat || !destination?.lng) {
    console.warn('[maps.js] initDestinationMap: destino sin coordenadas');
    return null;
  }

  const map    = initMap(containerId, destination.lat, destination.lng, 14);
  if (!map) return null;

  const marker = addMarker(map, destination, { emoji: '📍', openPopup: true });

  // Conectar botón "Cómo llegar" si existe en el DOM
  const directionsBtn = document.getElementById('directionsBtn');
  if (directionsBtn) {
    directionsBtn.addEventListener('click', () => showDirections(destination));
  }

  // Conectar botón "Abrir en Google Maps" si existe
  const gmapsBtn = document.getElementById('openGmapsBtn');
  if (gmapsBtn) {
    gmapsBtn.addEventListener('click', () => openInGoogleMaps(destination));
  }

  return { map, marker };
}


// ════════════════════════════════════════════════════════════════
// MAPA DEL EXPLORADOR (explore.html — opcional)
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa el mapa del explorador con todos los destinos visibles.
 * Cada marcador al hacer clic redirige a su página de detalle.
 *
 * @param {Array}  destinations - array de destinos activos
 * @param {string} [containerId='exploreMap']
 * @returns {Object} { map, markers }
 */
export function initExploreMap(destinations, containerId = 'exploreMap') {
  // Centro de Guatemala
  const GUATEMALA_CENTER = { lat: 15.7835, lng: -90.2308 };

  const map = initMap(containerId, GUATEMALA_CENTER.lat, GUATEMALA_CENTER.lng, 7);
  if (!map) return null;

  const validDests = destinations.filter(d => d.lat && d.lng);
  const markers    = [];

  validDests.forEach(dest => {
    const icon = L.divIcon({
      html:        `<div class="map-marker-icon">📍</div>`,
      className:   '',
      iconSize:    [32, 32],
      iconAnchor:  [16, 32],
      popupAnchor: [0, -34],
    });

    const marker = L.marker([dest.lat, dest.lng], { icon })
      .addTo(map)
      .bindPopup(_buildPopupHTML(dest, true));

    markers.push(marker);
  });

  // Ajustar bounds si hay marcadores
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 10 });
  }

  return { map, markers };
}


// ════════════════════════════════════════════════════════════════
// HELPER INTERNO
// ════════════════════════════════════════════════════════════════

/**
 * Genera el HTML del popup de un marcador.
 * @param {Object}  destination
 * @param {boolean} withLink - si incluir enlace a la página de detalle
 * @returns {string}
 */
function _buildPopupHTML(destination, withLink = false) {
  const price = destination.price_from
    ? `<span class="popup-price">Desde Q${destination.price_from}</span>`
    : '';

  const rating = destination.rating_avg
    ? `<span class="popup-rating">★ ${destination.rating_avg}</span>`
    : '';

  const link = withLink
    ? `<a href="destination.html?id=${destination.id}" class="popup-link">Ver destino →</a>`
    : '';

  return `
    <div class="map-popup">
      <strong class="popup-title">${destination.title}</strong>
      <span class="popup-location">📍 ${destination.address || destination.department || ''}</span>
      <div class="popup-meta">${price}${rating}</div>
      ${link}
    </div>
  `;
}
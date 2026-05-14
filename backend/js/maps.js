// Coordenadas del centro de Guatemala
const GUATEMALA_CENTER = [14.6407, -90.5133];
const DEFAULT_ZOOM = 7;
const DESTINATION_ZOOM = 14;

// Tile layer de OpenStreetMap (sin costo de API)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Colores de marcadores por categoría
const CATEGORY_COLORS = {
  nature:      '#2D6A4F',
  culture:     '#C1121F',
  adventure:   '#FFB703',
  gastronomy:  '#E76F51',
  wellness:    '#52B788',
  default:     '#1A1A2E',
};

// ─── Mapa principal ───────────────────────────────────────────────────────────

/**
 * Inicializa un mapa Leaflet en el contenedor dado.
 * @param {string} containerId  ID del elemento HTML div donde se renderiza
 * @param {number} [lat]        Latitud inicial (default: centro de Guatemala)
 * @param {number} [lng]        Longitud inicial (default: centro de Guatemala)
 * @param {number} [zoom]       Nivel de zoom inicial (default: 7)
 * @returns {L.Map}             Instancia del mapa
 *
 * @example
 * const map = initMap('map-container');
 * const destMap = initMap('dest-map', 14.5594, -90.7341, 14);
 */
export function initMap(containerId, lat, lng, zoom) {
  _checkLeaflet();

  const centerLat = lat ?? GUATEMALA_CENTER[0];
  const centerLng = lng ?? GUATEMALA_CENTER[1];
  const initZoom  = zoom ?? DEFAULT_ZOOM;

  const map = L.map(containerId, {
    center: [centerLat, centerLng],
    zoom: initZoom,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  // Capa de tiles OpenStreetMap
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Destruye un mapa y libera recursos.
 * Útil al navegar entre páginas con JS vanilla.
 * @param {L.Map} map
 */
export function destroyMap(map) {
  if (map) map.remove();
}

// ─── Marcadores ───────────────────────────────────────────────────────────────

/**
 * Agrega un marcador de destino al mapa con popup informativo.
 * @param {L.Map} map
 * @param {object} destination  Objeto de destino con lat, lng, title, category, price_from
 * @param {object} [options]
 * @param {Function} [options.onClick]  Callback al hacer clic en el marcador
 * @returns {L.Marker}
 *
 * @example
 * const marker = addMarker(map, destination, {
 *   onClick: (dest) => window.location.href = `destination.html?id=${dest.id}`,
 * });
 */
export function addMarker(map, destination, options = {}) {
  _checkLeaflet();

  if (!destination.lat || !destination.lng) {
    console.warn(`[Maps] Destino sin coordenadas: ${destination.title}`);
    return null;
  }

  const icon = _createCategoryIcon(destination.category);
  const marker = L.marker([destination.lat, destination.lng], { icon });

  // Popup con info del destino
  const popupContent = _buildPopupHTML(destination);
  marker.bindPopup(popupContent, { maxWidth: 220 });

  // Clic en marcador
  if (options.onClick) {
    marker.on('click', () => options.onClick(destination));
  }

  marker.addTo(map);
  return marker;
}

/**
 * Agrega múltiples marcadores de una vez y ajusta el zoom para mostrarlos todos.
 * @param {L.Map} map
 * @param {object[]} destinations  Array de destinos
 * @param {object} [options]       Mismas opciones que addMarker
 * @returns {L.Marker[]}           Array de marcadores creados
 *
 * @example
 * const markers = addMarkersAndFit(map, destinations, {
 *   onClick: (dest) => openDestinationDetail(dest.id),
 * });
 */
export function addMarkersAndFit(map, destinations, options = {}) {
  const markers = [];

  destinations.forEach((dest) => {
    const marker = addMarker(map, dest, options);
    if (marker) markers.push(marker);
  });

  // Ajustar el zoom para que todos los marcadores sean visibles
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.15));
  }

  return markers;
}

/**
 * Elimina todos los marcadores del mapa.
 * @param {L.Map} map
 * @param {L.Marker[]} markers  Array de marcadores a eliminar
 */
export function clearMarkers(map, markers = []) {
  markers.forEach((m) => {
    if (m && map.hasLayer(m)) map.removeLayer(m);
  });
}

// ─── Navegación y centrado ────────────────────────────────────────────────────

/**
 * Centra el mapa en unas coordenadas con animación suave.
 * @param {L.Map} map
 * @param {number} lat
 * @param {number} lng
 * @param {number} [zoom]  Si no se indica, mantiene el zoom actual
 */
export function centerMap(map, lat, lng, zoom) {
  if (zoom !== undefined) {
    map.flyTo([lat, lng], zoom, { duration: 1 });
  } else {
    map.panTo([lat, lng]);
  }
}

/**
 * Centra el mapa en un destino con zoom de detalle.
 * @param {L.Map} map
 * @param {object} destination
 */
export function focusDestination(map, destination) {
  if (!destination.lat || !destination.lng) return;
  centerMap(map, destination.lat, destination.lng, DESTINATION_ZOOM);
}

/**
 * Vuelve al zoom general de Guatemala.
 * @param {L.Map} map
 */
export function resetMapView(map) {
  map.flyTo(GUATEMALA_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
}

// ─── Instrucciones / Cómo llegar ─────────────────────────────────────────────

/**
 * Abre Google Maps con las indicaciones para llegar al destino.
 * Lo abre en una nueva pestaña.
 * @param {object} destination  Objeto con lat, lng y title
 *
 * @example
 * showDirections(destination); // abre Google Maps en nueva pestaña
 */
export function showDirections(destination) {
  if (!destination.lat || !destination.lng) {
    console.warn('[Maps] No hay coordenadas para mostrar indicaciones.');
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&destination_place_id=${encodeURIComponent(destination.title)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Genera la URL de Google Maps estática de un destino (imagen del mapa).
 * Útil para miniaturas sin cargar Leaflet completo.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [zoom=14]
 * @param {number} [width=400]
 * @param {number} [height=200]
 * @returns {string}  URL de OpenStreetMap para iframe embed
 */
export function getEmbedUrl(lat, lng, zoom = 14, width = 400, height = 200) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
}

// ─── Selector de ubicación (formulario de proveedor) ──────────────────────────

/**
 * Inicializa un mapa interactivo que permite al proveedor elegir
 * la ubicación de su destino haciendo clic en el mapa.
 *
 * @param {string} containerId
 * @param {object} [options]
 * @param {number}   [options.lat]       Coordenada inicial (si ya existe)
 * @param {number}   [options.lng]
 * @param {Function} [options.onChange]  Callback: onChange({ lat, lng })
 * @returns {{ map: L.Map, getCoords: Function }}
 *
 * @example
 * const { map, getCoords } = initLocationPicker('location-picker', {
 *   onChange: ({ lat, lng }) => {
 *     document.getElementById('lat').value = lat;
 *     document.getElementById('lng').value = lng;
 *   }
 * });
 */
export function initLocationPicker(containerId, options = {}) {
  _checkLeaflet();

  const lat = options.lat ?? GUATEMALA_CENTER[0];
  const lng = options.lng ?? GUATEMALA_CENTER[1];
  const zoom = options.lat ? DESTINATION_ZOOM : DEFAULT_ZOOM;

  const map = initMap(containerId, lat, lng, zoom);

  let currentMarker = null;

  // Si ya hay coordenadas, poner marcador inicial
  if (options.lat && options.lng) {
    currentMarker = L.marker([options.lat, options.lng]).addTo(map);
  }

  // Al hacer clic, mover el marcador
  map.on('click', (e) => {
    const { lat: clickLat, lng: clickLng } = e.latlng;

    if (currentMarker) {
      currentMarker.setLatLng([clickLat, clickLng]);
    } else {
      currentMarker = L.marker([clickLat, clickLng]).addTo(map);
    }

    if (options.onChange) {
      options.onChange({
        lat: Math.round(clickLat * 1000000) / 1000000,
        lng: Math.round(clickLng * 1000000) / 1000000,
      });
    }
  });

  return {
    map,
    getCoords: () => currentMarker
      ? {
          lat: currentMarker.getLatLng().lat,
          lng: currentMarker.getLatLng().lng,
        }
      : null,
  };
}

// ─── Privados ─────────────────────────────────────────────────────────────────

/**
 * Verifica que Leaflet esté cargado en la página.
 * Lanza error claro si no se incluyó el CDN.
 */
function _checkLeaflet() {
  if (typeof L === 'undefined') {
    throw new Error(
      '[Maps] Leaflet no está cargado. Asegúrate de incluir el CDN en el HTML antes de usar maps.js.',
    );
  }
}

/**
 * Crea un ícono de marcador con el color de la categoría del destino.
 * @param {string} category
 * @returns {L.DivIcon}
 */
function _createCategoryIcon(category) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;

  return L.divIcon({
    className: 'qr-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

/**
 * Construye el HTML del popup de un marcador.
 * @param {object} destination
 * @returns {string}
 */
function _buildPopupHTML(destination) {
  const price = destination.price_from
    ? `<span style="color:#2D6A4F;font-weight:600">Desde Q${destination.price_from}</span>`
    : '';

  const rating = destination.avg_rating
    ? `<span style="color:#FFB703">★ ${destination.avg_rating}</span>`
    : '';

  return `
    <div style="font-family: 'Open Sans', sans-serif; min-width: 160px;">
      ${
        destination.cover_image
          ? `<img src="${destination.cover_image}" alt="${destination.title}"
               style="width:100%;height:90px;object-fit:cover;border-radius:4px;margin-bottom:8px;">`
          : ''
      }
      <strong style="font-size:14px;color:#1A1A2E;display:block;margin-bottom:4px;">
        ${destination.title}
      </strong>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        ${price}
        ${rating}
      </div>
      <a href="destination.html?id=${destination.id}"
         style="
           display:block;text-align:center;
           background:#2D6A4F;color:#fff;
           padding:6px 12px;border-radius:6px;
           font-size:12px;text-decoration:none;font-weight:600;
         ">
        Ver destino
      </a>
    </div>
  `;
}
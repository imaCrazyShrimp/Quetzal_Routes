/* ============================================================
   QUETZAL ROUTES — ui.js
   Helpers de interfaz reutilizables en todas las páginas.

   Exporta:
   · showToast(msg, type, duration)
   · toggleLoader(containerId, show)
   · createDestinationCard(dest, lang)
   · renderSkeletons(containerId, count)
   · showModal(modalId)
   · closeModal(modalId)
   · calculateAverageRating(reviews)
   · renderStars(rating)
   · formatPrice(amount, currency)
   · scrollToElement(elementId)
   · onScrollAnimate(selector)
   ============================================================ */


// ════════════════════════════════════════════════════════════════
// TOAST — notificaciones flotantes
// ════════════════════════════════════════════════════════════════

/**
 * Muestra una notificación flotante en la esquina inferior derecha.
 *
 * @param {string} msg              - texto del mensaje
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @param {number} [duration=3500]  - ms antes de desaparecer
 */
export function showToast(msg, type = 'success', duration = 3500) {
  // Buscar o crear el contenedor
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] ?? icons.info}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" aria-label="Cerrar">✕</button>
  `;

  // Cerrar al hacer clic en la X
  toast.querySelector('.toast-close').addEventListener('click', () => {
    _removeToast(toast);
  });

  container.appendChild(toast);

  // Trigger animación de entrada (necesita un frame para el transition)
  requestAnimationFrame(() => toast.classList.add('show'));

  // Auto-remove
  const timer = setTimeout(() => _removeToast(toast), duration);

  // Si el usuario hace hover, pausar el timer
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => _removeToast(toast), 1500);
  });
}

function _removeToast(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}


// ════════════════════════════════════════════════════════════════
// LOADER / SKELETON
// ════════════════════════════════════════════════════════════════

/**
 * Muestra u oculta un spinner de carga dentro de un contenedor.
 *
 * @param {string}  containerId  - ID del elemento contenedor
 * @param {boolean} show         - true = mostrar spinner, false = limpiar
 */
export function toggleLoader(containerId, show) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (show) {
    container.innerHTML = `
      <div class="loader-wrap">
        <div class="spinner"></div>
      </div>
    `;
  } else {
    const loader = container.querySelector('.loader-wrap');
    if (loader) loader.remove();
  }
}

/**
 * Rellena un contenedor con tarjetas skeleton de carga.
 * Reemplazar con createDestinationCard() cuando lleguen los datos.
 *
 * @param {string} containerId - ID del grid contenedor
 * @param {number} [count=6]   - cantidad de skeletons
 */
export function renderSkeletons(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="skeleton-card"></div>`)
    .join('');
}


// ════════════════════════════════════════════════════════════════
// TARJETA DE DESTINO
// ════════════════════════════════════════════════════════════════

/**
 * Genera el HTML de una tarjeta de destino.
 * Compatible con el CSS de components.css (.card, .card-image, etc.)
 *
 * @param {Object} dest   - objeto destino desde db.json / api.js
 * @param {string} [lang='es'] - idioma activo para título y descripción
 * @returns {string} HTML listo para insertar con innerHTML
 */
export function createDestinationCard(dest, lang = 'es') {
  const title    = lang === 'en' && dest.title_en ? dest.title_en : dest.title;
  const stars    = renderStars(dest.rating_avg ?? 0);
  const price    = formatPrice(dest.price_from, dest.currency);
  const featured = dest.featured
    ? `<span class="card-featured-badge">★ Destacado</span>`
    : '';

  const categoryLabels = {
    nature:     { es: 'Naturaleza',  en: 'Nature'      },
    culture:    { es: 'Cultura',     en: 'Culture'     },
    adventure:  { es: 'Aventura',    en: 'Adventure'   },
    gastronomy: { es: 'Gastronomía', en: 'Gastronomy'  },
    wellness:   { es: 'Bienestar',   en: 'Wellness'    },
  };

  const catLabel = categoryLabels[dest.category]?.[lang]
    ?? dest.category
    ?? '';

  return `
    <article
      class="card"
      data-id="${dest.id}"
      data-cat="${dest.category ?? ''}"
      data-dept="${dest.department?.toLowerCase().replace(/\s+/g, '-') ?? ''}"
      data-price="${dest.price_from ?? 0}"
      data-rating="${dest.rating_avg ?? 0}"
      style="cursor:pointer"
    >
      <div class="card-image">
        <span class="card-category">${catLabel}</span>
        ${featured}
        <img
          src="${dest.cover_image}"
          alt="${title}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=60'"
        />
        <button class="card-favorite" aria-label="Guardar en favoritos">♡</button>
      </div>

      <div class="card-body">
        <div class="card-location">📍 ${dest.department}, Guatemala</div>
        <h3 class="card-title">${title}</h3>
        <div class="card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-score">${dest.rating_avg?.toFixed(1) ?? '—'}</span>
          <span class="reviews-count">(${dest.reviews_count ?? 0})</span>
        </div>
      </div>

      <div class="card-footer">
        <div class="card-price">
          <span class="price-label">${lang === 'en' ? 'From' : 'Desde'}</span>
          <span class="price-amount">${price}</span>
        </div>
        <div class="card-duration">⏱ ${dest.duration ?? ''}</div>
      </div>
    </article>
  `;
}

/**
 * Renderiza múltiples cards en un contenedor, reemplazando su contenido.
 * Maneja el estado vacío automáticamente.
 *
 * @param {string} containerId
 * @param {Array}  destinations
 * @param {string} [lang='es']
 * @param {string} [emptyMsg]    - mensaje cuando no hay resultados
 */
export function renderCards(containerId, destinations, lang = 'es', emptyMsg = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!destinations || destinations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🗺️</span>
        <p>${emptyMsg || (lang === 'en' ? 'No destinations found.' : 'No se encontraron destinos.')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = destinations
    .map(dest => createDestinationCard(dest, lang))
    .join('');

  // Conectar eventos de la card después de renderizar
  _attachCardEvents(container);
}

/** Conecta clicks y favoritos a las cards recién renderizadas */
function _attachCardEvents(container) {
  // Navegar al detalle al hacer click en la card
  container.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-favorite')) return;
      const id = card.dataset.id;
      // Detectar si estamos en /html/ o en la raíz
      const base = window.location.pathname.includes('/html/') ? '' : 'html/';
      window.location.href = `${base}destination.html?id=${id}`;
    });
  });

  // Toggle favorito
  container.querySelectorAll('.card-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const active = btn.classList.toggle('active');
      btn.textContent = active ? '♥' : '♡';
    });
  });
}


// ════════════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════════════

/**
 * Abre un modal por su ID. El modal debe existir en el HTML
 * con la clase .modal-overlay y el ID dado.
 *
 * @param {string} modalId
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add('open');
  document.body.classList.add('modal-open'); // evita scroll del fondo

  // Cerrar al hacer click fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modalId);
  }, { once: true });

  // Cerrar con Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(modalId);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * Cierra un modal por su ID.
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

/**
 * Conecta automáticamente los botones con data-modal-open y data-modal-close.
 * Llamar una vez al cargar la página.
 */
export function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => showModal(btn.dataset.modalOpen));
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
}


// ════════════════════════════════════════════════════════════════
// RATINGS Y PRECIOS
// ════════════════════════════════════════════════════════════════

/**
 * Calcula el promedio de calificaciones de un array de reseñas.
 * @param {Array} reviews - array con objetos que tienen { rating }
 * @returns {number} promedio redondeado a 1 decimal, o 0 si no hay reseñas
 */
export function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Genera HTML de estrellas llenas/vacías para un rating.
 * @param {number} rating - valor entre 0 y 5
 * @returns {string} HTML con estrellas
 */
export function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    '★'.repeat(full) +
    (half ? '½' : '') +
    '☆'.repeat(empty)
  );
}

/**
 * Formatea un precio con su moneda.
 * @param {number} amount
 * @param {string} [currency='GTQ']
 * @returns {string}  ej: "Q 150" o "$ 20"
 */
export function formatPrice(amount, currency = 'GTQ') {
  if (amount === undefined || amount === null) return '—';
  const symbol = currency === 'GTQ' ? 'Q' : '$';
  return `${symbol}${Number(amount).toLocaleString('es-GT')}`;
}


// ════════════════════════════════════════════════════════════════
// SCROLL Y ANIMACIONES
// ════════════════════════════════════════════════════════════════

/**
 * Hace scroll suave hacia un elemento por su ID.
 * @param {string} elementId
 * @param {number} [offset=80] - offset en px (para el navbar fijo)
 */
export function scrollToElement(elementId, offset = 80) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Activa animaciones de entrada en elementos cuando entran al viewport.
 * Agrega la clase .visible cuando el elemento es visible.
 *
 * @param {string} [selector='.animate-on-scroll'] - CSS selector
 * @param {number} [threshold=0.12]
 */
export function onScrollAnimate(selector = '.animate-on-scroll', threshold = 0.12) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold });

  elements.forEach(el => observer.observe(el));
}
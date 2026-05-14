/**
 * ui.js — Quetzal Routes
 * Helpers de interfaz: renderizado de tarjetas, galerías, modales, toasts y loaders.
 * Depende de i18n.js para traducir textos. No hace llamadas al servidor.
 */

import { t, getCurrentLang, getLocalizedField } from './i18n.js';

// ─── Cards de destino ─────────────────────────────────────────────────────────

/**
 * Genera el HTML completo de una tarjeta de destino.
 * Se usa en la landing, el explorador y el panel del proveedor.
 * @param {object} destination
 * @param {object} [options]
 * @param {boolean} [options.showActions]   Muestra botones editar/pausar (panel proveedor)
 * @param {boolean} [options.showBadge]     Muestra badge de categoría
 * @param {boolean} [options.compact]       Versión compacta (sin descripción)
 * @returns {string}  HTML de la tarjeta
 *
 * @example
 * const html = renderCard(destination);
 * document.getElementById('grid').insertAdjacentHTML('beforeend', html);
 */
export function renderCard(destination, options = {}) {
  const lang = getCurrentLang();
  const title = destination.title || '';
  const description = getLocalizedField(destination, 'description');
  const price = destination.price_from;
  const rating = destination.avg_rating ?? 0;
  const reviewCount = destination.review_count ?? 0;
  const dept = t(`dept.${destination.department}`) || destination.department || '';
  const category = t(`category.${destination.category}`) || destination.category || '';
  const coverImage = destination.cover_image || '/assets/placeholder.jpg';
  const isFeatured = destination.featured || false;
  const isVerified = destination.provider?.verified || false;

  const stars = renderStars(rating);
  const badge = options.showBadge !== false ? `
    <span class="card__badge card__badge--${destination.category}">
      ${category}
    </span>
  ` : '';

  const featuredRibbon = isFeatured ? `
    <div class="card__ribbon" title="Destino destacado">⭐</div>
  ` : '';

  const verifiedBadge = isVerified ? `
    <span class="card__verified" title="Proveedor verificado">✓</span>
  ` : '';

  const priceHTML = price != null ? `
    <span class="card__price">
      ${t('destination.from')} <strong>Q${price}</strong>
      <small>${t('destination.per_person')}</small>
    </span>
  ` : '';

  const descHTML = !options.compact && description ? `
    <p class="card__desc">${_truncate(description, 100)}</p>
  ` : '';

  const actionsHTML = options.showActions ? `
    <div class="card__actions">
      <button class="btn btn--sm btn--outline" data-action="edit" data-id="${destination.id}">
        ${t('general.edit')}
      </button>
      <button class="btn btn--sm btn--ghost" data-action="toggle" data-id="${destination.id}"
        data-status="${destination.status}">
        ${destination.status === 'active' ? t('dashboard.destination.pause') : 'Activar'}
      </button>
      <button class="btn btn--sm btn--danger" data-action="delete" data-id="${destination.id}">
        ${t('dashboard.destination.delete')}
      </button>
    </div>
  ` : '';

  return `
    <article class="card" data-id="${destination.id}">
      <a href="destination.html?id=${destination.id}" class="card__image-link">
        <div class="card__image-wrap">
          <img
            src="${coverImage}"
            alt="${title}"
            class="card__image"
            loading="lazy"
            onerror="this.src='/assets/placeholder.jpg'"
          />
          ${featuredRibbon}
          ${badge}
        </div>
      </a>
      <div class="card__body">
        <div class="card__meta">
          <span class="card__location">📍 ${dept}</span>
          ${priceHTML}
        </div>
        <h3 class="card__title">
          <a href="destination.html?id=${destination.id}">${title}</a>
          ${verifiedBadge}
        </h3>
        ${descHTML}
        <div class="card__footer">
          <div class="card__rating">
            ${stars}
            <span class="card__rating-count">(${reviewCount})</span>
          </div>
          ${actionsHTML}
        </div>
      </div>
    </article>
  `;
}

/**
 * Renderiza un grid de tarjetas de destinos en un contenedor.
 * @param {HTMLElement} container   Elemento donde se insertan las tarjetas
 * @param {object[]} destinations
 * @param {object} [cardOptions]    Opciones pasadas a renderCard()
 */
export function renderGrid(container, destinations, cardOptions = {}) {
  if (!container) return;

  if (!destinations || destinations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">${t('search.no_results')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = destinations.map((d) => renderCard(d, cardOptions)).join('');
}

// ─── Estrellas de rating ──────────────────────────────────────────────────────

/**
 * Genera HTML con estrellas llenas/medias/vacías según el rating.
 * @param {number} rating  0–5 (puede ser decimal, ej: 4.3)
 * @param {boolean} [interactive=false]  Si true, las estrellas son clickeables (formulario de reseña)
 * @returns {string}  HTML de estrellas
 *
 * @example
 * element.innerHTML = renderStars(4.5);
 */
export function renderStars(rating, interactive = false) {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  if (interactive) {
    for (let i = 1; i <= 5; i++) {
      stars.push(`
        <span
          class="star star--interactive"
          data-value="${i}"
          role="button"
          tabindex="0"
          aria-label="${i} estrella${i > 1 ? 's' : ''}"
        >☆</span>
      `);
    }
  } else {
    for (let i = 0; i < full;  i++) stars.push('<span class="star star--full">★</span>');
    for (let i = 0; i < half;  i++) stars.push('<span class="star star--half">⯨</span>');
    for (let i = 0; i < empty; i++) stars.push('<span class="star star--empty">☆</span>');
  }

  return `<span class="stars" aria-label="Rating: ${rating} de 5">${stars.join('')}</span>`;
}

// ─── Galería de imágenes ──────────────────────────────────────────────────────

/**
 * Renderiza una galería con imagen principal y thumbnails.
 * @param {object[]} images  Array de { id, image_url, order_index }
 * @param {string} [altText]  Texto alternativo para accesibilidad
 * @returns {string}  HTML de la galería
 *
 * @example
 * document.getElementById('gallery').innerHTML = renderGallery(destination.images);
 */
export function renderGallery(images, altText = 'Imagen del destino') {
  if (!images || images.length === 0) {
    return `
      <div class="gallery gallery--empty">
        <img src="/assets/placeholder.jpg" alt="${altText}" class="gallery__main" />
      </div>
    `;
  }

  const sorted = [...images].sort((a, b) => a.order_index - b.order_index);
  const [main, ...thumbs] = sorted;

  const thumbsHTML = thumbs.length > 0 ? `
    <div class="gallery__thumbs">
      ${thumbs.map((img, i) => `
        <button
          class="gallery__thumb"
          onclick="swapGalleryImage('${img.image_url}', '${altText}')"
          aria-label="Ver imagen ${i + 2}"
        >
          <img src="${img.image_url}" alt="${altText} ${i + 2}" loading="lazy" />
        </button>
      `).join('')}
    </div>
  ` : '';

  return `
    <div class="gallery">
      <div class="gallery__main-wrap">
        <img
          id="gallery-main"
          src="${main.image_url}"
          alt="${altText}"
          class="gallery__main"
        />
      </div>
      ${thumbsHTML}
    </div>
  `;
}

/**
 * Cambia la imagen principal de la galería.
 * Se llama desde el onclick de los thumbnails (generado por renderGallery).
 * @param {string} newSrc
 * @param {string} altText
 */
export function swapGalleryImage(newSrc, altText) {
  const mainImg = document.getElementById('gallery-main');
  if (!mainImg) return;

  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = newSrc;
    mainImg.alt = altText;
    mainImg.style.opacity = '1';
  }, 150);
}

// Exponer en global para que funcione el onclick inline generado
window.swapGalleryImage = swapGalleryImage;

// ─── Modal ────────────────────────────────────────────────────────────────────

let _modalEl = null;

/**
 * Muestra un modal con contenido HTML arbitrario.
 * Crea el elemento si no existe; lo reutiliza si ya existe.
 * @param {string} content    HTML del cuerpo del modal
 * @param {object} [options]
 * @param {string} [options.title]       Título del modal
 * @param {string} [options.size]        'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} [options.closeable]  Muestra botón X (default: true)
 *
 * @example
 * showModal('<form>...</form>', { title: 'Hacer reserva', size: 'lg' });
 */
export function showModal(content, options = {}) {
  const { title = '', size = 'md', closeable = true } = options;

  if (!_modalEl) {
    _modalEl = document.createElement('div');
    _modalEl.id = 'qr-modal';
    document.body.appendChild(_modalEl);

    // Cerrar al hacer clic en el overlay
    _modalEl.addEventListener('click', (e) => {
      if (e.target === _modalEl) closeModal();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  const closeBtn = closeable ? `
    <button class="modal__close" onclick="window.__qrCloseModal()" aria-label="Cerrar">✕</button>
  ` : '';

  const titleHTML = title ? `<h2 class="modal__title">${title}</h2>` : '';

  _modalEl.innerHTML = `
    <div class="modal__overlay">
      <div class="modal__box modal__box--${size}" role="dialog" aria-modal="true">
        <div class="modal__header">
          ${titleHTML}
          ${closeBtn}
        </div>
        <div class="modal__body">
          ${content}
        </div>
      </div>
    </div>
  `;

  _modalEl.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Enfocar primer elemento interactivo para accesibilidad
  setTimeout(() => {
    const firstFocusable = _modalEl.querySelector('button, input, select, textarea, a');
    firstFocusable?.focus();
  }, 50);
}

/**
 * Cierra el modal activo.
 */
export function closeModal() {
  if (_modalEl) {
    _modalEl.style.display = 'none';
    _modalEl.innerHTML = '';
  }
  document.body.style.overflow = '';
}

// Exponer en global para el onclick inline
window.__qrCloseModal = closeModal;

// ─── Toast (notificaciones) ───────────────────────────────────────────────────

let _toastContainer = null;

/**
 * Muestra una notificación toast temporal.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [type='info']
 * @param {number} [duration=3500]  Tiempo en ms antes de desaparecer
 *
 * @example
 * showToast('¡Reserva enviada con éxito!', 'success');
 * showToast('Error al guardar', 'error');
 */
export function showToast(message, type = 'info', duration = 3500) {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'qr-toasts';
    _toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(_toastContainer);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] ?? icons.info}</span>
    <span class="toast__message">${message}</span>
  `;

  _toastContainer.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  // Auto-eliminar
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Muestra u oculta el loader global de pantalla completa.
 * @param {boolean} show
 * @param {string} [message]  Texto que se muestra bajo el spinner
 *
 * @example
 * toggleLoader(true, 'Cargando destinos...');
 * await loadData();
 * toggleLoader(false);
 */
export function toggleLoader(show, message) {
  let loader = document.getElementById('qr-loader');

  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'qr-loader';
      loader.innerHTML = `
        <div class="loader__backdrop">
          <div class="loader__spinner"></div>
          <p class="loader__message" id="qr-loader-msg"></p>
        </div>
      `;
      document.body.appendChild(loader);
    }

    const msgEl = document.getElementById('qr-loader-msg');
    if (msgEl) msgEl.textContent = message || t('general.loading');

    loader.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } else {
    if (loader) loader.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ─── Loader en sección específica ────────────────────────────────────────────

/**
 * Muestra un spinner dentro de un contenedor específico.
 * Útil para secciones que cargan independientemente.
 * @param {HTMLElement} container
 * @param {boolean} show
 */
export function toggleSectionLoader(container, show) {
  if (!container) return;

  const existingLoader = container.querySelector('.section-loader');

  if (show) {
    if (!existingLoader) {
      const loader = document.createElement('div');
      loader.className = 'section-loader';
      loader.innerHTML = `<div class="loader__spinner loader__spinner--sm"></div>`;
      container.appendChild(loader);
    }
  } else {
    existingLoader?.remove();
  }
}

// ─── Confirmación de acciones ─────────────────────────────────────────────────

/**
 * Muestra un modal de confirmación antes de una acción destructiva.
 * @param {object} options
 * @param {string}   options.title       Título del modal
 * @param {string}   options.message     Mensaje de advertencia
 * @param {string}   [options.confirmText]  Texto del botón confirmar
 * @param {Function} options.onConfirm   Callback al confirmar
 * @param {Function} [options.onCancel]  Callback al cancelar
 *
 * @example
 * showConfirm({
 *   title: '¿Eliminar destino?',
 *   message: 'Esta acción no se puede deshacer.',
 *   confirmText: 'Sí, eliminar',
 *   onConfirm: () => deleteDestination(id),
 * });
 */
export function showConfirm(options) {
  const {
    title = t('general.confirm_delete'),
    message = '',
    confirmText = t('general.yes'),
    onConfirm,
    onCancel,
  } = options;

  const content = `
    <p class="confirm__message">${message}</p>
    <div class="confirm__actions">
      <button
        class="btn btn--danger"
        onclick="window.__qrConfirmYes()"
      >
        ${confirmText}
      </button>
      <button
        class="btn btn--outline"
        onclick="window.__qrCloseModal()"
      >
        ${t('general.cancel')}
      </button>
    </div>
  `;

  window.__qrConfirmYes = () => {
    closeModal();
    onConfirm?.();
  };

  showModal(content, { title, size: 'sm' });
}

// ─── Paginación ───────────────────────────────────────────────────────────────

/**
 * Renderiza controles de paginación.
 * @param {object} pagination  Resultado de filters.paginate()
 * @param {Function} onPageChange  Callback: onPageChange(pageNumber)
 * @returns {string}  HTML de la paginación
 *
 * @example
 * document.getElementById('pagination').innerHTML = renderPagination(pag, (p) => {
 *   loadPage(p);
 * });
 */
export function renderPagination(pagination, onPageChange) {
  const { page, totalPages, hasPrev, hasNext } = pagination;
  if (totalPages <= 1) return '';

  // Registrar el callback en el objeto global para los onclick inline
  window.__qrPageChange = onPageChange;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const items = pages.map((p) =>
    p === '...'
      ? `<span class="pagination__ellipsis">…</span>`
      : `<button
           class="pagination__btn ${p === page ? 'pagination__btn--active' : ''}"
           onclick="window.__qrPageChange(${p})"
           aria-label="Página ${p}"
           ${p === page ? 'aria-current="page"' : ''}
         >${p}</button>`,
  ).join('');

  return `
    <nav class="pagination" aria-label="Paginación">
      <button
        class="pagination__btn pagination__btn--prev"
        onclick="window.__qrPageChange(${page - 1})"
        ${!hasPrev ? 'disabled' : ''}
        aria-label="Página anterior"
      >←</button>
      ${items}
      <button
        class="pagination__btn pagination__btn--next"
        onclick="window.__qrPageChange(${page + 1})"
        ${!hasNext ? 'disabled' : ''}
        aria-label="Página siguiente"
      >→</button>
    </nav>
  `;
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

/**
 * Renderiza un estado vacío con icono, mensaje y CTA opcional.
 * @param {object} options
 * @param {string} options.icon       Emoji o SVG
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {string} [options.ctaText]
 * @param {string} [options.ctaHref]
 * @returns {string}
 */
export function renderEmptyState(options) {
  const { icon = '🌄', title, message = '', ctaText, ctaHref } = options;

  const cta = ctaText && ctaHref
    ? `<a href="${ctaHref}" class="btn btn--primary">${ctaText}</a>`
    : '';

  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <h3 class="empty-state__title">${title}</h3>
      ${message ? `<p class="empty-state__message">${message}</p>` : ''}
      ${cta}
    </div>
  `;
}

// ─── Formateo de datos ────────────────────────────────────────────────────────

/**
 * Formatea un precio en quetzales.
 * @param {number} amount
 * @returns {string}  Ejemplo: 'Q 350.00'
 */
export function formatPrice(amount) {
  const num = Number(amount) || 0;
  return `Q ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formatea una fecha para mostrarla al usuario.
 * @param {string} dateString
 * @returns {string}  Ejemplo: '15 de marzo de 2025'
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const lang = getCurrentLang();
  const locale = lang === 'es' ? 'es-GT' : 'en-US';
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Privados ─────────────────────────────────────────────────────────────────

/**
 * Trunca un texto a un número máximo de caracteres, sin cortar palabras.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function _truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(' ', maxLength)) + '…';
}
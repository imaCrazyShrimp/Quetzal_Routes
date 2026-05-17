/* ============================================================
   QUETZAL ROUTES — destination-page.js  (Frontend)
   Orquestador de destination.html.
   Reemplaza el mock hardcodeado de 350+ líneas inline
   por carga real desde db.json via api.js.

   USO en destination.html:
     <script type="module" src="../js/destination-page.js"></script>
   ============================================================ */

import { getDestinationById, getProviderById } from './api.js';
import { getCurrentUser }                       from './auth.js';
import { showToast }                            from './ui.js';
import { initBookingForm }                      from './bookings.js';
import { initReviews }                          from './reviews.js';


// ════════════════════════════════════════════════════════════════
// INIT — punto de entrada
// ════════════════════════════════════════════════════════════════

async function init() {
  // Leer ID del destino de la URL (?id=3)
  const params = new URLSearchParams(window.location.search);
  const destId = parseInt(params.get('id'));

  if (!destId || isNaN(destId)) {
    _showError('No se especificó un destino válido.');
    return;
  }

  try {
    const dest = await getDestinationById(destId);

    if (!dest) {
      _showError('Este destino no existe o fue eliminado.');
      return;
    }

    // Enriquecer con datos del proveedor
    const provider = dest.provider_id
      ? await getProviderById(dest.provider_id).catch(() => null)
      : null;

    // Ejecutar todas las secciones en paralelo
    _fillHeader(dest);
    _fillDescription(dest);
    _fillIncludes(dest);
    _fillGallery(dest);
    _fillProvider(dest, provider);
    _fillMap(dest);
    _bindActions(dest);

    // Módulos de booking y reviews
    initBookingForm(dest);
    await initReviews(destId);

    // Navbar móvil
    _initNavbar();

  } catch (err) {
    console.error('[destination-page.js] Error cargando destino:', err);
    _showError('No se pudo cargar la información del destino.');
  }
}


// ════════════════════════════════════════════════════════════════
// SECCIONES
// ════════════════════════════════════════════════════════════════

function _fillHeader(dest) {
  const lang  = _getLang();
  const title = dest.title || '';
  const cat   = _categoryLabel(dest.category, lang);

  document.title = `${title} — Quetzal Routes`;

  _setText('breadcrumbTitle',   title);
  _setText('destTitle',         title);
  _setText('destCategory',      cat);
  _setText('destLocation',      `📍 ${dest.department || ''}`);
  _setText('destDuration',      dest.duration ? `⏱ ${dest.duration}` : '');
  _setText('destPeople',        dest.max_people ? `👥 Máx. ${dest.max_people} personas` : '');
  _setText('destAddress',       `📍 ${dest.address || ''}`);
  _setText('destRatingScore',   dest.rating_avg ?? '—');
  _setText('destReviewsLink',   `(${dest.reviews_count ?? 0} reseñas)`);

  // Booking card header
  _setText('bookingPrice',        `Q${dest.price_from ?? '—'}`);
  _setText('bookingRating',       dest.rating_avg ?? '—');
  _setText('bookingReviewCount',  `(${dest.reviews_count ?? 0})`);
  _setText('confirmDestName',     title);

  // Imagen de portada principal (antes de que cargue la galería)
  const mainImg = document.getElementById('galleryMainImg');
  if (mainImg && dest.cover_image) {
    mainImg.src = dest.cover_image;
    mainImg.alt = title;
  }
}

function _fillDescription(dest) {
  const lang = _getLang();
  const desc = (lang === 'en' && dest.description_en)
    ? dest.description_en
    : dest.description_es || '';

  const descEl = document.getElementById('destDescription');
  if (descEl && desc) {
    descEl.innerHTML = desc
      .split('\n')
      .filter(p => p.trim())
      .map(p => `<p>${p}</p>`)
      .join('');
  }

  // Toggle "Leer más / Leer menos"
  const toggle = document.getElementById('descToggle');
  if (descEl && toggle) {
    descEl.classList.add('collapsed');
    toggle.addEventListener('click', () => {
      const collapsed = descEl.classList.toggle('collapsed');
      toggle.textContent = collapsed ? 'Leer más ▾' : 'Leer menos ▴';
    });
  }
}

function _fillIncludes(dest) {
  // Los includes pueden venir como array en dest.includes
  // Si no existe, usamos unos genéricos según la categoría
  const includesEl = document.getElementById('destIncludesGrid');
  if (!includesEl) return;

  const defaultIncludes = _getDefaultIncludes(dest.category);
  includesEl.innerHTML = defaultIncludes.map(item => `
    <div class="dest-include-item ${item.included ? 'dest-include-yes' : 'dest-include-no'}">
      <span>${item.included ? '✓' : '✗'}</span>
      <span>${item.label}</span>
    </div>
  `).join('');
}

function _fillGallery(dest) {
  const mainImg       = document.getElementById('galleryMainImg');
  const thumbsContainer = document.getElementById('galleryThumbs');
  if (!mainImg || !thumbsContainer) return;

  // Construir lista de imágenes: cover + imágenes adicionales
  const images = _buildImageList(dest);
  if (images.length === 0) return;

  // Imagen principal
  mainImg.src = images[0];
  mainImg.alt = dest.title;

  // Miniaturas
  thumbsContainer.innerHTML = '';
  images.slice(0, 4).forEach((src, i) => {
    const div       = document.createElement('div');
    div.className   = `gallery-thumb${i === 0 ? ' active' : ''}`;
    div.dataset.idx = i;

    const isLast = i === 3 && images.length > 4;
    div.innerHTML = `
      <img src="${src}" alt="Foto ${i + 1}" loading="lazy" />
      ${isLast ? `<div class="gallery-thumb-more">+${images.length - 4}</div>` : ''}
    `;
    thumbsContainer.appendChild(div);
  });

  // Click en miniaturas
  thumbsContainer.addEventListener('click', (e) => {
    const thumb = e.target.closest('.gallery-thumb');
    if (!thumb) return;
    const idx = parseInt(thumb.dataset.idx);
    mainImg.src = images[idx];
    mainImg.style.opacity = '0';
    requestAnimationFrame(() => {
      mainImg.style.transition = 'opacity 0.25s';
      mainImg.style.opacity = '1';
    });
    document.querySelectorAll('.gallery-thumb').forEach(t =>
      t.classList.toggle('active', t === thumb)
    );
  });
}

function _fillProvider(dest, provider) {
  const p = provider || {};

  const name = p.business_name || dest.business_name || 'Proveedor local';
  const desc = (_getLang() === 'en' && p.description_en)
    ? p.description_en
    : p.description_es || p.description || '';

  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  _setText('providerName',   name);
  _setText('providerAvatar', initials);
  _setText('providerDesc',   desc);

  // Stats del proveedor (si vienen en el objeto)
  _setText('providerStatDestinations', p.destinations_count ?? '—');
  _setText('providerStatRating',       p.avg_rating ? p.avg_rating.toFixed(1) : '—');
  _setText('providerStatYears',
    p.created_at ? `${new Date().getFullYear() - new Date(p.created_at).getFullYear()}` : '—'
  );

  // Botón WhatsApp — solo si el plan lo permite
  const waBtn = document.getElementById('whatsappBtn');
  if (waBtn) {
    const phone = p.whatsapp || dest.provider_whatsapp;
    if (phone) {
      waBtn.href = `https://wa.me/${phone.replace(/\D/g, '')}`;
    } else {
      waBtn.style.display = 'none';
    }
  }
}

function _fillMap(dest) {
  if (typeof L === 'undefined') return;
  if (!dest.lat || !dest.lng)  return;

  const mapEl = document.getElementById('destMap');
  if (!mapEl) return;

  const map = L.map('destMap').setView([dest.lat, dest.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const icon = L.divIcon({
    html:      `<div class="map-marker-icon">📍</div>`,
    className: '',
    iconSize:  [32, 32],
    iconAnchor:[16, 32],
  });

  L.marker([dest.lat, dest.lng], { icon })
    .addTo(map)
    .bindPopup(`<strong>${dest.title}</strong><br>${dest.address}`)
    .openPopup();
}

function _bindActions(dest) {
  // ── Favorito ────────────────────────────────────────────────
  const favBtn = document.getElementById('favBtn');
  if (favBtn) {
    const key    = `qr_fav_${dest.id}`;
    let   active = localStorage.getItem(key) === '1';

    const _syncFav = () => {
      favBtn.classList.toggle('active', active);
      favBtn.innerHTML = active ? '<span>♥</span> Guardado' : '<span>♡</span> Guardar';
    };

    _syncFav();

    favBtn.addEventListener('click', () => {
      active = !active;
      localStorage.setItem(key, active ? '1' : '0');
      _syncFav();
      showToast(active ? 'Destino guardado en favoritos ♥' : 'Eliminado de favoritos', active ? 'success' : 'info');
    });
  }

  // ── Compartir ────────────────────────────────────────────────
  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    const shareData = {
      title: dest.title,
      text:  `Mira este destino en Quetzal Routes: ${dest.title}`,
      url:   window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Enlace copiado al portapapeles 📋', 'success');
      }
    } catch {
      showToast('No se pudo compartir.', 'warning');
    }
  });
}

function _initNavbar() {
  const navToggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
  });
}


// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function _showError(msg) {
  const main = document.querySelector('.destination-main .container');
  if (main) {
    main.innerHTML = `
      <div style="text-align:center;padding:5rem 1rem;">
        <p style="font-size:3rem">😕</p>
        <h2 style="margin:1rem 0 0.5rem">Destino no encontrado</h2>
        <p style="color:var(--gris-texto);margin-bottom:2rem">${msg}</p>
        <a href="explore.html" class="btn btn-primary">Ver todos los destinos</a>
      </div>`;
  }
}

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

function _getLang() {
  return localStorage.getItem('qr_lang') || 'es';
}

function _buildImageList(dest) {
  const images = [];
  if (dest.cover_image) images.push(dest.cover_image);
  if (Array.isArray(dest.images)) {
    dest.images.forEach(img => {
      const src = typeof img === 'string' ? img : img.image_url;
      if (src && !images.includes(src)) images.push(src);
    });
  }
  // Fallback a Unsplash si no hay imágenes
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80');
  }
  return images;
}

function _categoryLabel(cat, lang = 'es') {
  const map = {
    es: { nature:'Naturaleza', culture:'Cultura', adventure:'Aventura',
          gastronomy:'Gastronomía', wellness:'Bienestar', history:'Historia Maya' },
    en: { nature:'Nature', culture:'Culture', adventure:'Adventure',
          gastronomy:'Gastronomy', wellness:'Wellness', history:'Mayan History' },
  };
  return map[lang]?.[cat] || cat || '';
}

function _getDefaultIncludes(category) {
  const base = [
    { label: 'Guía certificado',    included: true  },
    { label: 'Equipo de seguridad', included: true  },
    { label: 'Transporte',          included: false },
    { label: 'Alimentación',        included: false },
  ];
  const extras = {
    adventure:   [{ label: 'Equipo especializado', included: true }],
    gastronomy:  [{ label: 'Degustaciones',         included: true }],
    nature:      [{ label: 'Binoculares',            included: true }],
    culture:     [{ label: 'Entrada a sitios',       included: true }],
    history:     [{ label: 'Entrada a ruinas',       included: true }],
    wellness:    [{ label: 'Materiales de sesión',   included: true }],
  };
  return [...base, ...(extras[category] || [])];
}


// ════════════════════════════════════════════════════════════════
// ARRANCAR
// ════════════════════════════════════════════════════════════════
init();

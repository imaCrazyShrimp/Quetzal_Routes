/* ============================================================
   QUETZAL ROUTES — reviews.js  (Frontend)
   Carga reseñas reales desde db.json via api.js y conecta
   el formulario de nueva reseña con createReview().
   ============================================================ */

import { getReviewsByDestination, createReview, getUserById } from './api.js';
import { getCurrentUser } from './auth.js';
import { showToast, renderStars, calculateAverageRating } from './ui.js';


// ════════════════════════════════════════════════════════════════
// INICIALIZAR — llamar desde destination-page.js
// ════════════════════════════════════════════════════════════════

/**
 * Carga y renderiza las reseñas de un destino,
 * y activa el formulario de nueva reseña.
 * @param {number} destId
 */
export async function initReviews(destId) {
  await _loadReviews(destId);
  _initStarInput();
  _bindSubmitReview(destId);
}


// ════════════════════════════════════════════════════════════════
// CARGA Y RENDER
// ════════════════════════════════════════════════════════════════

async function _loadReviews(destId) {
  const list = document.getElementById('reviewsList');
  if (!list) return;

  list.innerHTML = `
    <div style="text-align:center;padding:1.5rem;color:var(--gris-texto)">
      <i class="fas fa-spinner fa-spin"></i> Cargando reseñas...
    </div>`;

  try {
    const reviews = await getReviewsByDestination(destId);

    if (!reviews || reviews.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--gris-texto)">
          <p style="font-size:2rem">💬</p>
          <p>Sé el primero en dejar una reseña sobre este destino.</p>
        </div>`;
      _updateRatingSummary([], 0);
      return;
    }

    // Enriquecer con datos del usuario (nombre)
    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const user = await getUserById(r.user_id).catch(() => null);
        return { ...r, userName: user?.name || 'Viajero' };
      })
    );

    list.innerHTML = enriched.map(_renderReviewItem).join('');
    _updateRatingSummary(enriched, reviews.length);

  } catch (err) {
    console.error('[reviews.js] Error cargando reseñas:', err);
    list.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--gris-texto)">
        No se pudieron cargar las reseñas.
      </div>`;
  }
}

/** Genera el HTML de una reseña individual */
function _renderReviewItem(review, isNew = false) {
  const initials = (review.userName || 'V')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : 'Recientemente';

  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return `
    <div class="review-item${isNew ? ' review-item-new' : ''}">
      <div class="review-header">
        <div class="review-avatar">${initials}</div>
        <div class="review-meta">
          <strong>${_escapeHtml(review.userName)}</strong>
          <span>${date}</span>
        </div>
        <div class="review-rating">
          <span class="stars">${stars}</span>
        </div>
      </div>
      <p class="review-text">${_escapeHtml(review.comment || '')}</p>
    </div>`;
}

/** Actualiza el puntaje promedio y el total de reseñas en el DOM */
function _updateRatingSummary(reviews, total) {
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('reviewsAvg',   avg);
  setText('reviewsTotal', `Basado en ${total} opinión${total !== 1 ? 'es' : ''}`);
  // También actualizar el rating en el encabezado y la booking card
  setText('destRatingScore',  avg);
  setText('destReviewsLink',  `(${total} reseñas)`);
  setText('bookingRating',    avg);
  setText('bookingReviewCount', `(${total})`);
}


// ════════════════════════════════════════════════════════════════
// INPUT DE ESTRELLAS
// ════════════════════════════════════════════════════════════════

let _selectedRating = 0;

function _initStarInput() {
  const starBtns  = document.querySelectorAll('.star-input');
  const starLabel = document.getElementById('starLabel');

  if (!starBtns.length) return;

  const ratingLabels = ['', 'Terrible 😞', 'Malo 😐', 'Regular 😊', 'Bueno 😄', '¡Excelente! 🤩'];

  starBtns.forEach(btn => {
    const val = parseInt(btn.dataset.value);

    btn.addEventListener('mouseenter', () => {
      starBtns.forEach((b, i) => b.classList.toggle('hover', i < val));
    });

    btn.addEventListener('mouseleave', () => {
      starBtns.forEach(b => b.classList.remove('hover'));
    });

    btn.addEventListener('click', () => {
      _selectedRating = val;
      starBtns.forEach((b, i) => b.classList.toggle('selected', i < val));
      if (starLabel) {
        starLabel.textContent = ratingLabels[val];
        starLabel.style.color = '';
      }
    });
  });
}


// ════════════════════════════════════════════════════════════════
// ENVIAR RESEÑA
// ════════════════════════════════════════════════════════════════

function _bindSubmitReview(destId) {
  const submitBtn = document.getElementById('submitReview');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    const starLabel     = document.getElementById('starLabel');
    const commentInput  = document.getElementById('reviewComment');
    const comment       = commentInput?.value.trim() || '';

    // Validar calificación
    if (!_selectedRating) {
      if (starLabel) {
        starLabel.textContent = '⚠ Selecciona una calificación';
        starLabel.style.color = 'var(--rojo-huipil)';
      }
      return;
    }

    // Validar comentario
    if (!comment || comment.length < 10) {
      commentInput?.classList.add('error');
      showToast('Escribe un comentario de al menos 10 caracteres.', 'warning');
      return;
    }
    commentInput?.classList.remove('error');

    // Verificar sesión
    const user = getCurrentUser();
    if (!user) {
      showToast('Debes iniciar sesión para dejar una reseña.', 'info');
      return;
    }

    submitBtn.textContent = 'Publicando...';
    submitBtn.disabled    = true;

    try {
      const reviewData = {
        destination_id: destId,
        user_id:        user.id,
        rating:         _selectedRating,
        comment,
        created_at:     new Date().toISOString().split('T')[0],
      };

      await createReview(reviewData);

      // Insertar la nueva reseña al tope de la lista
      const list = document.getElementById('reviewsList');
      if (list) {
        const newHtml = _renderReviewItem(
          { ...reviewData, userName: user.name || 'Tú' },
          true
        );
        list.insertAdjacentHTML('afterbegin', newHtml);
      }

      // Limpiar formulario
      if (commentInput)   commentInput.value = '';
      _selectedRating = 0;
      document.querySelectorAll('.star-input').forEach(b => b.classList.remove('selected'));
      if (starLabel) {
        starLabel.textContent = 'Selecciona una calificación';
        starLabel.style.color = '';
      }

      showToast('¡Reseña publicada! Gracias por tu opinión. 🙏', 'success');

    } catch (err) {
      console.error('[reviews.js] Error al crear reseña:', err);
      showToast('No se pudo publicar la reseña. Inténtalo de nuevo.', 'error');
    } finally {
      submitBtn.textContent = 'Publicar reseña';
      submitBtn.disabled    = false;
    }
  });
}


// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

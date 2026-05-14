/**
 * reviews.js — Quetzal Routes
 * Gestión de reseñas y calificaciones de destinos turísticos.
 */

import { get, post, del } from './api.js';
import { isAuthenticated, getCurrentUser } from './auth.js';

// ─── Obtener reseñas ──────────────────────────────────────────────────────────

/**
 * Obtiene todas las reseñas de un destino.
 * @param {number|string} destinationId
 * @param {object} [options]
 * @param {number} [options.page]   Página (default: 1)
 * @param {number} [options.limit]  Reseñas por página (default: 10)
 * @param {string} [options.sort]   'newest' | 'rating_desc' | 'rating_asc'
 * @returns {Promise<{reviews: object[], total: number, avg_rating: number}>}
 *
 * @example
 * const { reviews, avg_rating } = await getReviewsByDestination(5);
 */
export async function getReviewsByDestination(destinationId, options = {}) {
  const params = new URLSearchParams();
  if (options.page)  params.set('page', options.page);
  if (options.limit) params.set('limit', options.limit);
  if (options.sort)  params.set('sort', options.sort);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/destinations/${destinationId}/reviews${query}`);
}

/**
 * Obtiene las reseñas escritas por el usuario actual.
 * @returns {Promise<object[]>}
 */
export async function getMyReviews() {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  return get('/reviews/me');
}

// ─── Crear reseña ─────────────────────────────────────────────────────────────

/**
 * Crea una nueva reseña para un destino.
 * Solo usuarios autenticados (turistas) pueden dejar reseñas.
 * @param {number|string} destinationId
 * @param {object} data
 * @param {number} data.rating    1–5
 * @param {string} data.comment   Texto de la reseña
 * @returns {Promise<object>}  Reseña creada
 *
 * @example
 * await createReview(5, { rating: 5, comment: '¡Increíble experiencia!' });
 */
export async function createReview(destinationId, data) {
  if (!isAuthenticated()) {
    throw new Error('Debes iniciar sesión para dejar una reseña.');
  }

  const { valid, errors } = validateReview(data);
  if (!valid) {
    const firstError = Object.values(errors)[0];
    throw new Error(firstError);
  }

  return post(`/destinations/${destinationId}/reviews`, {
    rating: data.rating,
    comment: data.comment.trim(),
  });
}

/**
 * Elimina una reseña. Solo el autor o un admin puede eliminarla.
 * @param {number|string} reviewId
 * @returns {Promise<null>}
 */
export async function deleteReview(reviewId) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  return del(`/reviews/${reviewId}`);
}

// ─── Cálculos de rating ───────────────────────────────────────────────────────

/**
 * Calcula el promedio de calificación de un array de reseñas.
 * @param {object[]} reviews  Array de objetos con propiedad 'rating' (1–5)
 * @returns {number}  Promedio redondeado a 1 decimal. 0 si no hay reseñas.
 *
 * @example
 * const avg = calculateAverageRating([{ rating: 5 }, { rating: 4 }, { rating: 3 }]);
 * // → 4.0
 */
export function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = sum / reviews.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Cuenta cuántas reseñas tiene cada calificación (1–5).
 * Útil para mostrar la barra de distribución de ratings.
 * @param {object[]} reviews
 * @returns {object}  Ejemplo: { 1: 2, 2: 0, 3: 1, 4: 5, 5: 12 }
 *
 * @example
 * const dist = getRatingDistribution(reviews);
 * // dist[5] → número de reseñas con 5 estrellas
 */
export function getRatingDistribution(reviews) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    const rating = Math.round(r.rating);
    if (rating >= 1 && rating <= 5) {
      dist[rating]++;
    }
  });

  return dist;
}

/**
 * Calcula el porcentaje de cada calificación para mostrar barras de progreso.
 * @param {object[]} reviews
 * @returns {object}  Ejemplo: { 5: 60, 4: 25, 3: 10, 2: 5, 1: 0 } (porcentajes)
 */
export function getRatingPercentages(reviews) {
  if (!reviews.length) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const dist = getRatingDistribution(reviews);
  const total = reviews.length;
  const percentages = {};

  Object.entries(dist).forEach(([star, count]) => {
    percentages[star] = Math.round((count / total) * 100);
  });

  return percentages;
}

/**
 * Verifica si el usuario actual ya escribió una reseña para un destino.
 * @param {object[]} reviews  Lista de reseñas del destino
 * @returns {boolean}
 */
export function hasUserReviewed(reviews) {
  const user = getCurrentUser();
  if (!user) return false;

  return reviews.some((r) => r.user_id === user.id);
}

// ─── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida los datos de una reseña antes de enviarla.
 * @param {object} data
 * @param {number} data.rating
 * @param {string} data.comment
 * @returns {{ valid: boolean, errors: object }}
 *
 * @example
 * const { valid, errors } = validateReview({ rating: 0, comment: '' });
 * // errors.rating → 'Selecciona una calificación entre 1 y 5.'
 */
export function validateReview(data) {
  const errors = {};

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Selecciona una calificación entre 1 y 5.';
  }
  if (!data.comment || data.comment.trim().length < 10) {
    errors.comment = 'El comentario debe tener al menos 10 caracteres.';
  }
  if (data.comment && data.comment.trim().length > 1000) {
    errors.comment = 'El comentario no puede superar los 1000 caracteres.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Formateo ─────────────────────────────────────────────────────────────────

/**
 * Formatea la fecha de una reseña para mostrarla al usuario.
 * @param {string} dateString  Fecha ISO del servidor
 * @param {'es'|'en'} [lang='es']
 * @returns {string}  Ejemplo: '12 de enero de 2025'
 */
export function formatReviewDate(dateString, lang = 'es') {
  if (!dateString) return '';

  const date = new Date(dateString);
  const locale = lang === 'es' ? 'es-GT' : 'en-US';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
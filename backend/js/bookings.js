/**
 * bookings.js — Quetzal Routes
 * Gestión de reservas: creación, consulta, cambio de estado y cálculo de comisión.
 * Comisión de servicio: 10% sobre el precio base de la reserva.
 */

import { get, post, patch } from './api.js';
import { isAuthenticated, getCurrentUser, hasRole } from './auth.js';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const COMMISSION_RATE = 0.10; // 10%

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// ─── Crear reserva ────────────────────────────────────────────────────────────

/**
 * Crea una nueva reserva para un destino.
 * Cualquier usuario autenticado puede reservar.
 * @param {number|string} destinationId
 * @param {object} data
 * @param {string} data.date_requested    Fecha en formato 'YYYY-MM-DD'
 * @param {number} data.people_count      Número de personas (mínimo 1)
 * @param {string} [data.guest_name]      Nombre del turista (si no está en perfil)
 * @param {string} [data.guest_email]     Email de contacto
 * @param {string} [data.guest_phone]     Teléfono
 * @param {string} [data.notes]           Solicitudes especiales
 * @returns {Promise<object>}  Reserva creada con commission_amount calculado
 *
 * @example
 * const booking = await createBooking(7, {
 *   date_requested: '2025-03-15',
 *   people_count: 2,
 *   guest_name: 'Pedro García',
 *   guest_email: 'pedro@email.com',
 * });
 */
export async function createBooking(destinationId, data) {
  if (!isAuthenticated()) {
    throw new Error('Debes iniciar sesión para hacer una reserva.');
  }

  const { valid, errors } = validateBookingData(data);
  if (!valid) {
    const firstError = Object.values(errors)[0];
    throw new Error(firstError);
  }

  return post(`/destinations/${destinationId}/bookings`, {
    date_requested: data.date_requested,
    people_count: Number(data.people_count),
    guest_name: data.guest_name,
    guest_email: data.guest_email,
    guest_phone: data.guest_phone,
    notes: data.notes,
  });
}

// ─── Consultar reservas ───────────────────────────────────────────────────────

/**
 * Obtiene todas las reservas del usuario actual (como turista).
 * @param {object} [options]
 * @param {string} [options.status]   Filtrar por estado
 * @param {number} [options.page]
 * @param {number} [options.limit]
 * @returns {Promise<{bookings: object[], total: number}>}
 *
 * @example
 * const { bookings } = await getBookingsByUser(getCurrentUser().id);
 */
export async function getBookingsByUser(userId, options = {}) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');

  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.page)   params.set('page', options.page);
  if (options.limit)  params.set('limit', options.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/users/${userId}/bookings${query}`);
}

/**
 * Obtiene todas las reservas recibidas por un proveedor.
 * Solo accesible por el proveedor dueño o un admin.
 * @param {number|string} providerId
 * @param {object} [options]
 * @param {string} [options.status]
 * @param {number} [options.page]
 * @param {number} [options.limit]
 * @returns {Promise<{bookings: object[], total: number}>}
 */
export async function getBookingsByProvider(providerId, options = {}) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  if (!hasRole('provider') && !hasRole('admin')) {
    throw new Error('No tienes permisos para ver estas reservas.');
  }

  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.page)   params.set('page', options.page);
  if (options.limit)  params.set('limit', options.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/providers/${providerId}/bookings${query}`);
}

/**
 * Obtiene el detalle de una reserva por ID.
 * @param {number|string} bookingId
 * @returns {Promise<object>}
 */
export async function getBookingById(bookingId) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  return get(`/bookings/${bookingId}`);
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

/**
 * Actualiza el estado de una reserva.
 * El proveedor puede confirmar o cancelar.
 * El turista puede cancelar si aún está pendiente.
 * @param {number|string} bookingId
 * @param {'confirmed'|'cancelled'|'completed'} status
 * @param {string} [reason]  Razón de cancelación (opcional)
 * @returns {Promise<object>}
 *
 * @example
 * // Confirmar como proveedor
 * await updateBookingStatus(12, 'confirmed');
 *
 * // Cancelar como turista con razón
 * await updateBookingStatus(12, 'cancelled', 'No puedo asistir en esa fecha.');
 */
export async function updateBookingStatus(bookingId, status, reason) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');

  const validStatuses = Object.values(BOOKING_STATUS);
  if (!validStatuses.includes(status)) {
    throw new Error(`Estado inválido: ${status}. Debe ser uno de: ${validStatuses.join(', ')}`);
  }

  const payload = { status };
  if (reason) payload.cancellation_reason = reason;

  return patch(`/bookings/${bookingId}/status`, payload);
}

/**
 * Cancela una reserva. Shorthand de updateBookingStatus.
 * @param {number|string} bookingId
 * @param {string} [reason]
 * @returns {Promise<object>}
 */
export async function cancelBooking(bookingId, reason) {
  return updateBookingStatus(bookingId, BOOKING_STATUS.CANCELLED, reason);
}

/**
 * Confirma una reserva. Solo para proveedores.
 * @param {number|string} bookingId
 * @returns {Promise<object>}
 */
export async function confirmBooking(bookingId) {
  if (!hasRole('provider') && !hasRole('admin')) {
    throw new Error('Solo los proveedores pueden confirmar reservas.');
  }
  return updateBookingStatus(bookingId, BOOKING_STATUS.CONFIRMED);
}

// ─── Cálculo de comisión ──────────────────────────────────────────────────────

/**
 * Calcula la comisión de Quetzal Routes sobre una reserva.
 * La comisión es del 10% sobre el monto base.
 * @param {number} amount  Monto base de la reserva en quetzales
 * @returns {{ base: number, commission: number, total: number }}
 *
 * @example
 * const pricing = calculateCommission(350);
 * // → { base: 350, commission: 35, total: 385 }
 */
export function calculateCommission(amount) {
  const base = Number(amount) || 0;
  const commission = Math.round(base * COMMISSION_RATE * 100) / 100;
  const total = Math.round((base + commission) * 100) / 100;

  return { base, commission, total };
}

/**
 * Calcula el precio total de una reserva (precio × personas + comisión).
 * @param {number} pricePerPerson
 * @param {number} peopleCount
 * @returns {{ base: number, commission: number, total: number }}
 *
 * @example
 * const pricing = calculateBookingTotal(350, 2);
 * // → { base: 700, commission: 70, total: 770 }
 */
export function calculateBookingTotal(pricePerPerson, peopleCount) {
  const base = (Number(pricePerPerson) || 0) * (Number(peopleCount) || 1);
  return calculateCommission(base);
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

/**
 * Calcula estadísticas básicas de un array de reservas.
 * Útil para el dashboard del proveedor (plan Elite).
 * @param {object[]} bookings
 * @returns {object}
 */
export function getBookingStats(bookings) {
  if (!bookings || bookings.length === 0) {
    return { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0, revenue: 0 };
  }

  const stats = {
    total: bookings.length,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
  };

  bookings.forEach((b) => {
    if (stats[b.status] !== undefined) stats[b.status]++;

    // Sumar ingresos solo de reservas confirmadas o completadas
    if (b.status === 'confirmed' || b.status === 'completed') {
      stats.revenue += Number(b.commission_amount) || 0;
    }
  });

  stats.revenue = Math.round(stats.revenue * 100) / 100;
  return stats;
}

// ─── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida los datos de una reserva antes de enviarla.
 * @param {object} data
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateBookingData(data) {
  const errors = {};

  if (!data.date_requested) {
    errors.date = 'Selecciona una fecha para la reserva.';
  } else {
    const selectedDate = new Date(data.date_requested);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.date = 'La fecha debe ser hoy o en el futuro.';
    }
  }

  if (!data.people_count || data.people_count < 1) {
    errors.people = 'Debe haber al menos 1 persona.';
  }
  if (data.people_count > 50) {
    errors.people = 'Para grupos grandes de más de 50 personas, contacta directamente.';
  }

  if (data.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guest_email)) {
    errors.email = 'Ingresa un email válido.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Formateo ─────────────────────────────────────────────────────────────────

/**
 * Devuelve el label legible del estado de una reserva.
 * @param {string} status
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function getStatusLabel(status, lang = 'es') {
  const labels = {
    es: {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    },
    en: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed',
    },
  };

  return labels[lang]?.[status] ?? status;
}
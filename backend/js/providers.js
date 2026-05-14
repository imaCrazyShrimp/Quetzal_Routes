/**
 * providers.js — Quetzal Routes
 * Lógica del panel de proveedores: perfil, destinos, estadísticas y reservas.
 */

import { get, post, put } from './api.js';
import { isAuthenticated, hasRole, getCurrentUser } from './auth.js';

// ─── Perfil del proveedor ─────────────────────────────────────────────────────

/**
 * Obtiene el perfil completo de un proveedor.
 * Incluye datos del negocio, plan activo y estadísticas básicas.
 * @param {number|string} providerId
 * @returns {Promise<object>}
 *
 * @example
 * const profile = await getProviderProfile(3);
 * console.log(profile.business_name, profile.plan);
 */
export async function getProviderProfile(providerId) {
  return get(`/providers/${providerId}`);
}

/**
 * Obtiene el perfil del proveedor actualmente autenticado.
 * Shorthand para no necesitar saber el ID.
 * @returns {Promise<object>}
 */
export async function getMyProviderProfile() {
  if (!isAuthenticated() || !hasRole('provider')) {
    throw new Error('Solo proveedores pueden acceder a este panel.');
  }
  return get('/providers/me');
}

/**
 * Actualiza los datos del negocio del proveedor.
 * @param {object} data
 * @param {string} [data.business_name]
 * @param {string} [data.description]
 * @param {string} [data.contact_email]
 * @param {string} [data.whatsapp]       Número con código de país: '+502 5555-0000'
 * @param {string} [data.website]
 * @param {string} [data.logo_url]
 * @returns {Promise<object>}
 *
 * @example
 * await updateProviderProfile({
 *   business_name: 'Aventuras Mayas S.A.',
 *   whatsapp: '+502 5555-1234',
 * });
 */
export async function updateProviderProfile(data) {
  if (!isAuthenticated() || !hasRole('provider')) {
    throw new Error('Solo proveedores pueden actualizar su perfil.');
  }

  const { valid, errors } = validateProviderData(data);
  if (!valid) {
    const firstError = Object.values(errors)[0];
    throw new Error(firstError);
  }

  return put('/providers/me', data);
}

// ─── Destinos del proveedor ───────────────────────────────────────────────────

/**
 * Obtiene todos los destinos publicados por un proveedor.
 * @param {number|string} providerId
 * @param {object} [options]
 * @param {string} [options.status]  'active' | 'inactive' | 'pending' | 'all'
 * @param {number} [options.page]
 * @param {number} [options.limit]
 * @returns {Promise<{destinations: object[], total: number}>}
 *
 * @example
 * const { destinations } = await getProviderDestinations(3, { status: 'active' });
 */
export async function getProviderDestinations(providerId, options = {}) {
  const params = new URLSearchParams();
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.page)   params.set('page', options.page);
  if (options.limit)  params.set('limit', options.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/providers/${providerId}/destinations${query}`);
}

/**
 * Obtiene los destinos del proveedor autenticado.
 * @param {object} [options]
 * @returns {Promise<{destinations: object[], total: number}>}
 */
export async function getMyDestinations(options = {}) {
  if (!isAuthenticated() || !hasRole('provider')) {
    throw new Error('Solo proveedores pueden acceder a este panel.');
  }

  const params = new URLSearchParams();
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.page)   params.set('page', options.page);
  if (options.limit)  params.set('limit', options.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/providers/me/destinations${query}`);
}

// ─── Reservas del proveedor ───────────────────────────────────────────────────

/**
 * Obtiene todas las reservas recibidas por el proveedor.
 * @param {number|string} providerId
 * @param {object} [options]
 * @param {string} [options.status]  Filtrar por estado
 * @param {number} [options.page]
 * @param {number} [options.limit]
 * @returns {Promise<{bookings: object[], total: number}>}
 */
export async function getProviderBookings(providerId, options = {}) {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.page)   params.set('page', options.page);
  if (options.limit)  params.set('limit', options.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/providers/${providerId}/bookings${query}`);
}

// ─── Estadísticas (plan Elite) ────────────────────────────────────────────────

/**
 * Obtiene estadísticas avanzadas del proveedor.
 * Solo disponible para el plan Elite.
 * @param {number|string} providerId
 * @param {object} [options]
 * @param {string} [options.period]  'week' | 'month' | 'year' (default: 'month')
 * @returns {Promise<object>}  Estadísticas detalladas
 *
 * @example
 * const stats = await getProviderStats(3, { period: 'month' });
 * console.log(stats.total_visits, stats.booking_rate, stats.revenue_chart);
 */
export async function getProviderStats(providerId, options = {}) {
  const period = options.period || 'month';
  return get(`/providers/${providerId}/stats?period=${period}`);
}

/**
 * Calcula estadísticas básicas desde los datos en memoria.
 * Útil cuando los datos ya están cargados y no se quiere otra llamada al servidor.
 * @param {object[]} destinations  Destinos del proveedor con avg_rating y visit_count
 * @param {object[]} bookings      Reservas del proveedor
 * @returns {object}
 */
export function calculateLocalStats(destinations, bookings) {
  const totalVisits = destinations.reduce((sum, d) => sum + (d.visit_count || 0), 0);
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed',
  ).length;

  const ratings = destinations
    .filter((d) => d.avg_rating > 0)
    .map((d) => d.avg_rating);

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : 0;

  const revenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.commission_amount) || 0), 0);

  return {
    total_visits: totalVisits,
    total_bookings: totalBookings,
    confirmed_bookings: confirmedBookings,
    avg_rating: avgRating,
    active_destinations: destinations.filter((d) => d.status === 'active').length,
    revenue: Math.round(revenue * 100) / 100,
  };
}

// ─── Verificación de proveedor ────────────────────────────────────────────────

/**
 * Verifica si un proveedor está verificado por el admin de la plataforma.
 * Los proveedores verificados tienen un badge especial en sus destinos.
 * @param {object} providerProfile
 * @returns {boolean}
 */
export function isVerifiedProvider(providerProfile) {
  return Boolean(providerProfile?.verified);
}

/**
 * Verifica si el proveedor autenticado es el dueño de un destino.
 * @param {object} destination  Debe incluir provider_id
 * @param {object} [providerProfile]  Perfil del proveedor (si ya está cargado)
 * @returns {boolean}
 */
export function isOwnerOfDestination(destination, providerProfile) {
  const user = getCurrentUser();
  if (!user || !hasRole('provider')) return false;

  if (providerProfile) {
    return destination.provider_id === providerProfile.id;
  }

  // Si no hay perfil, comparamos user_id (indirecto)
  return destination.user_id === user.id;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Genera el enlace de WhatsApp para contactar al proveedor sobre un destino.
 * @param {string} whatsappNumber  Número con código de país (ej: '+502 5555-1234')
 * @param {object} destination
 * @param {'es'|'en'} [lang='es']
 * @returns {string}  URL de wa.me listo para usar en href
 *
 * @example
 * const link = buildWhatsAppLink('+502 5555-1234', destination, 'es');
 * // → 'https://wa.me/50255551234?text=...'
 */
export function buildWhatsAppLink(whatsappNumber, destination, lang = 'es') {
  // Limpiar el número: solo dígitos
  const phone = whatsappNumber.replace(/\D/g, '');

  const messages = {
    es: `Hola, estoy interesado/a en "${destination.title}" que vi en Quetzal Routes. ¿Me pueden dar más información?`,
    en: `Hello, I'm interested in "${destination.title}" that I found on Quetzal Routes. Can you give me more information?`,
  };

  const message = encodeURIComponent(messages[lang] || messages.es);
  return `https://wa.me/${phone}?text=${message}`;
}

// ─── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida los datos del perfil de proveedor.
 * @param {object} data
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateProviderData(data) {
  const errors = {};

  if (data.business_name !== undefined) {
    if (!data.business_name || data.business_name.trim().length < 3) {
      errors.business_name = 'El nombre del negocio debe tener al menos 3 caracteres.';
    }
  }

  if (data.whatsapp !== undefined && data.whatsapp) {
    const digits = data.whatsapp.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      errors.whatsapp = 'Ingresa un número de WhatsApp válido con código de país.';
    }
  }

  if (data.contact_email !== undefined && data.contact_email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
      errors.contact_email = 'Ingresa un email de contacto válido.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
/**
 * destinations.js — Quetzal Routes
 * CRUD completo de destinos turísticos.
 * Soporta filtros, búsqueda, creación y edición por proveedores.
 */

import { get, post, put, del, postForm } from './api.js';
import { isAuthenticated, hasRole, getCurrentUser } from './auth.js';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const CATEGORIES = ['nature', 'culture', 'adventure', 'gastronomy', 'wellness'];

export const DEPARTMENTS = [
  'Sacatepequez',
  'Solola',
  'Peten',
  'AltaVerapaz',
  'IzabalNorte',
  'Quiche',
  'Quetzaltenango',
  'Huehuetenango',
  'Guatemala',
];

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

// ─── Listar destinos ──────────────────────────────────────────────────────────

/**
 * Obtiene todos los destinos con filtros opcionales.
 * @param {object} [filters]
 * @param {string} [filters.category]     'nature' | 'culture' | ...
 * @param {string} [filters.department]   'antigua' | 'atitlan' | ...
 * @param {number} [filters.price_min]
 * @param {number} [filters.price_max]
 * @param {number} [filters.rating_min]   1–5
 * @param {string} [filters.sort]         'rating' | 'newest' | 'price_asc' | 'price_desc'
 * @param {number} [filters.page]         Para paginación (default: 1)
 * @param {number} [filters.limit]        Resultados por página (default: 12)
 * @returns {Promise<{destinations: object[], total: number, page: number}>}
 *
 * @example
 * const { destinations } = await getAllDestinations({ category: 'nature', department: 'atitlan' });
 */
export async function getAllDestinations(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category)    params.set('category', filters.category);
  if (filters.department)  params.set('department', filters.department);
  if (filters.price_min)   params.set('price_min', filters.price_min);
  if (filters.price_max)   params.set('price_max', filters.price_max);
  if (filters.rating_min)  params.set('rating_min', filters.rating_min);
  if (filters.sort)        params.set('sort', filters.sort);
  if (filters.page)        params.set('page', filters.page);
  if (filters.limit)       params.set('limit', filters.limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/destinations${query}`);
}

/**
 * Obtiene el detalle de un destino por su ID.
 * @param {number|string} id
 * @returns {Promise<object>}  Destino con imágenes, proveedor y reseñas incluidas
 *
 * @example
 * const destination = await getDestinationById(7);
 */
export async function getDestinationById(id) {
  return get(`/destinations/${id}`);
}

/**
 * Busca destinos por texto libre (nombre, descripción, departamento).
 * @param {string} query       Texto de búsqueda
 * @param {object} [filters]   Filtros adicionales (mismos que getAllDestinations)
 * @returns {Promise<{destinations: object[], total: number}>}
 *
 * @example
 * const { destinations } = await searchDestinations('tikal', { category: 'culture' });
 */
export async function searchDestinations(query, filters = {}) {
  return getAllDestinations({ ...filters, q: query });
}

/**
 * Obtiene los destinos destacados (planes Premium y Elite).
 * Se muestran en la landing page.
 * @param {number} [limit=6]
 * @returns {Promise<object[]>}
 */
export async function getFeaturedDestinations(limit = 6) {
  const result = await get(`/destinations/featured?limit=${limit}`);
  return Array.isArray(result) ? result : result.destinations || [];
}

/**
 * Obtiene destinos similares al destino actual (misma categoría/departamento).
 * @param {number|string} destinationId
 * @param {number} [limit=4]
 * @returns {Promise<object[]>}
 */
export async function getRelatedDestinations(destinationId, limit = 4) {
  const result = await get(`/destinations/${destinationId}/related?limit=${limit}`);
  return Array.isArray(result) ? result : result.destinations || [];
}

// ─── Crear y editar ───────────────────────────────────────────────────────────

/**
 * Crea un nuevo destino. Solo proveedores autenticados.
 * @param {object} data
 * @param {string} data.title
 * @param {string} data.description_es
 * @param {string} data.description_en
 * @param {string} data.category        'nature' | 'culture' | 'adventure' | 'gastronomy' | 'wellness'
 * @param {string} data.department
 * @param {string} data.address
 * @param {number} data.lat
 * @param {number} data.lng
 * @param {number} data.price_from
 * @param {number} [data.price_to]
 * @returns {Promise<object>}  Destino creado
 *
 * @example
 * const dest = await createDestination({
 *   title: 'Tour Tikal al amanecer',
 *   description_es: 'Visita las ruinas mayas...',
 *   description_en: 'Visit the Mayan ruins...',
 *   category: 'culture',
 *   department: 'peten',
 *   address: 'Parque Nacional Tikal, Petén',
 *   lat: 17.2220,
 *   lng: -89.6237,
 *   price_from: 350,
 * });
 */
export async function createDestination(data) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión para crear destinos.');
  if (!hasRole('provider')) throw new Error('Solo proveedores pueden crear destinos.');

  return post('/destinations', data);
}

/**
 * Actualiza un destino existente.
 * @param {number|string} id
 * @param {object} data  Solo los campos que se quieren actualizar
 * @returns {Promise<object>}
 */
export async function updateDestination(id, data) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  if (!hasRole('provider') && !hasRole('admin')) {
    throw new Error('No tienes permiso para editar este destino.');
  }

  return put(`/destinations/${id}`, data);
}

/**
 * Elimina un destino. Solo el proveedor dueño o un admin.
 * @param {number|string} id
 * @returns {Promise<null>}
 */
export async function deleteDestination(id) {
  if (!isAuthenticated()) throw new Error('Debes iniciar sesión.');
  return del(`/destinations/${id}`);
}

/**
 * Cambia el estado de un destino (activo, pausado, pendiente).
 * @param {number|string} id
 * @param {'active'|'inactive'|'pending'} status
 * @returns {Promise<object>}
 */
export async function setDestinationStatus(id, status) {
  return updateDestination(id, { status });
}

// ─── Imágenes ─────────────────────────────────────────────────────────────────

/**
 * Sube una imagen para un destino.
 * @param {number|string} destinationId
 * @param {File} imageFile
 * @returns {Promise<{image_url: string}>}
 *
 * @example
 * const fileInput = document.getElementById('cover-image');
 * await uploadDestinationImage(7, fileInput.files[0]);
 */
export async function uploadDestinationImage(destinationId, imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  return postForm(`/destinations/${destinationId}/images`, formData);
}

/**
 * Elimina una imagen de un destino.
 * @param {number|string} destinationId
 * @param {number|string} imageId
 * @returns {Promise<null>}
 */
export async function deleteDestinationImage(destinationId, imageId) {
  return del(`/destinations/${destinationId}/images/${imageId}`);
}

/**
 * Reordena las imágenes de un destino.
 * @param {number|string} destinationId
 * @param {number[]} orderedIds  Array de IDs de imagen en el orden deseado
 * @returns {Promise<object[]>}
 */
export async function reorderImages(destinationId, orderedIds) {
  return post(`/destinations/${destinationId}/images/reorder`, { order: orderedIds });
}

// ─── Validación de formulario ─────────────────────────────────────────────────

/**
 * Valida los datos de un destino antes de enviarlo al servidor.
 * @param {object} data
 * @returns {{ valid: boolean, errors: object }}
 *
 * @example
 * const { valid, errors } = validateDestinationData(formData);
 * if (!valid) console.log(errors.title); // 'El título es requerido'
 */
export function validateDestinationData(data) {
  const errors = {};

  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'El título debe tener al menos 5 caracteres.';
  }
  if (!data.description_es || data.description_es.trim().length < 20) {
    errors.description_es = 'La descripción en español debe tener al menos 20 caracteres.';
  }
  if (!data.category || !CATEGORIES.includes(data.category)) {
    errors.category = 'Selecciona una categoría válida.';
  }
  if (!data.department || !DEPARTMENTS.includes(data.department)) {
    errors.department = 'Selecciona un departamento válido.';
  }
  if (!data.price_from || data.price_from < 0) {
    errors.price_from = 'El precio debe ser mayor a 0.';
  }
  if (data.price_to && data.price_to < data.price_from) {
    errors.price_to = 'El precio máximo debe ser mayor al mínimo.';
  }
  if (!data.lat || !data.lng) {
    errors.location = 'Selecciona la ubicación en el mapa.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
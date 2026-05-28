/* ============================================================
   QUETZAL ROUTES — api.js
   Capa de datos: lee db.json mientras el backend no está listo.
   Cuando el backend exista, solo cambia BASE_URL y las funciones
   internas — el resto del proyecto no cambia nada.
   ============================================================ */

// ── Configuración ─────────────────────────────────────────────
const DB_URL = '../../db/db.json';

// Cache en memoria para no hacer fetch múltiples veces
let _cache = null;

// Ususarios creados dinamicamente
const USERS_STORAGE_KEY = 'qr_users';

// ── Función base: carga db.json una sola vez ──────────────────
async function getDB() {
  if (_cache) return _cache;

  try {
    const res = await fetch(DB_URL);
    if (!res.ok) throw new Error(`Error cargando db.json: ${res.status}`);
    _cache = await res.json();
    return _cache;
  } catch (err) {
    console.error('[api.js] No se pudo cargar la base de datos:', err);
    throw err;
  }
}


// ════════════════════════════════════════════════════════════════
// DESTINOS
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve todos los destinos activos.
 * @returns {Promise<Array>}
 */
export async function getAllDestinations(filters = {}) {
  const db = await getDB();

  // Combinar destinos del JSON estático con los creados en localStorage
  const localDestsRaw = localStorage.getItem('qr_destinations');
  const localDests = localDestsRaw ? JSON.parse(localDestsRaw) : [];
  // Evitar duplicados por id
  const dbIds = new Set(db.destinations.map(d => d.id));
  const newLocal = localDests.filter(d => !dbIds.has(d.id));
  const allDests = [...db.destinations, ...newLocal];

  let results = allDests.filter(d => d.status === 'active');

  // Aplicar filtros localmente (misma interfaz que el backend)
  if (filters.category)   results = results.filter(d => d.category === filters.category);
  if (filters.department) results = results.filter(d => d.department === filters.department);
  if (filters.price_min)  results = results.filter(d => d.price_from >= Number(filters.price_min));
  if (filters.price_max)  results = results.filter(d => d.price_from <= Number(filters.price_max));
  if (filters.rating_min) results = results.filter(d => (d.rating_avg ?? 0) >= Number(filters.rating_min));
  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.title_en       && d.title_en.toLowerCase().includes(q)) ||
      (d.description_es && d.description_es.toLowerCase().includes(q)) ||
      (d.description_en && d.description_en.toLowerCase().includes(q)) ||
      d.department.toLowerCase().includes(q)
    );
  }

  // Ordenamiento
  if (filters.sort === 'price_asc')   results.sort((a, b) => a.price_from - b.price_from);
  if (filters.sort === 'price_desc')  results.sort((a, b) => b.price_from - a.price_from);
  if (filters.sort === 'rating_desc') results.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
  if (filters.sort === 'newest')      results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Paginación
  if (filters.page || filters.limit) {
    const limit = Number(filters.limit) || 12;
    const page  = Number(filters.page)  || 1;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit);
  }

  return results;
}

/**
 * Devuelve un destino por su ID.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getDestinationById(id) {
  const db = await getDB();
  return db.destinations.find(d => d.id === Number(id)) || null;
}

/**
 * Devuelve los destinos marcados como featured (plan premium/elite).
 * @returns {Promise<Array>}
 */
export async function getFeaturedDestinations() {
  const db = await getDB();
  return db.destinations.filter(d => d.featured && d.status === 'active');
}

/**
 * Busca destinos por texto libre + filtros opcionales.
 * @param {string} query       - Texto a buscar en título / descripción
 * @param {Object} filters     - { category, department, minPrice, maxPrice }
 * @returns {Promise<Array>}
 */
export async function searchDestinations(query = '', filters = {}) {
  const db    = await getDB();
  let results = db.destinations.filter(d => d.status === 'active');

  // Búsqueda por texto
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.title_en  && d.title_en.toLowerCase().includes(q))  ||
      (d.description_es && d.description_es.toLowerCase().includes(q)) ||
      (d.description_en && d.description_en.toLowerCase().includes(q)) ||
      d.department.toLowerCase().includes(q)
    );
  }

  // Filtro por categoría
  if (filters.category) {
    results = results.filter(d => d.category === filters.category);
  }

  // Filtro por departamento
  if (filters.department) {
    results = results.filter(d =>
      d.department.toLowerCase().includes(filters.department.toLowerCase())
    );
  }

  // Filtro por precio mínimo
  if (filters.minPrice !== undefined && filters.minPrice !== '') {
    results = results.filter(d => d.price_from >= Number(filters.minPrice));
  }

  // Filtro por precio máximo
  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    results = results.filter(d => d.price_from <= Number(filters.maxPrice));
  }

  return results;
}

/**
 * Devuelve destinos de un proveedor específico.
 * @param {number|string} providerId
 * @returns {Promise<Array>}
 */
export async function getDestinationsByProvider(providerId) {
  const db = await getDB();
  return db.destinations.filter(d => d.provider_id === Number(providerId));
}


// ════════════════════════════════════════════════════════════════
// RESEÑAS
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve todas las reseñas de un destino.
 * @param {number|string} destinationId
 * @returns {Promise<Array>}
 */
export async function getReviewsByDestination(destinationId) {
  const db = await getDB();
  return db.reviews.filter(r => r.destination_id === Number(destinationId));
}

/**
 * Simula crear una reseña (solo en memoria mientras no hay backend).
 * @param {Object} reviewData - { destination_id, user_id, rating, comment }
 * @returns {Promise<Object>}
 */
export async function createReview(reviewData) {
  const db = await getDB();
  const newReview = {
    id: db.reviews.length + 1,
    ...reviewData,
    created_at: new Date().toISOString().split('T')[0]
  };
  db.reviews.push(newReview);
  return newReview;
}


// ════════════════════════════════════════════════════════════════
// PROVEEDORES
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve el perfil de un proveedor por su ID.
 * @param {number|string} providerId
 * @returns {Promise<Object|null>}
 */
export async function getProviderById(providerId) {
  const db = await getDB();
  return db.providers.find(p => p.id === Number(providerId)) || null;
}

/**
 * Devuelve todos los proveedores.
 * @returns {Promise<Array>}
 */
export async function getAllProviders() {
  const db = await getDB();
  return db.providers;
}


// ════════════════════════════════════════════════════════════════
// RESERVAS
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve las reservas de un usuario.
 * @param {number|string} userId
 * @returns {Promise<Array>}
 */
export async function getBookingsByUser(userId) {
  const db = await getDB();
  return db.bookings.filter(b => b.user_id === Number(userId));
}

/**
 * Devuelve las reservas recibidas por un proveedor (via sus destinos).
 * @param {number|string} providerId
 * @returns {Promise<Array>}
 */
export async function getBookingsByProvider(providerId) {
  const db = await getDB();

  // IDs de destinos del proveedor
  const destIds = db.destinations
    .filter(d => d.provider_id === Number(providerId))
    .map(d => d.id);

  return db.bookings.filter(b => destIds.includes(b.destination_id));
}

/**
 * Simula crear una reserva (en memoria).
 * @param {Object} bookingData - { destination_id, user_id, date_requested, people_count }
 * @returns {Promise<Object>}
 */
export async function createBooking(bookingData) {
  const db = await getDB();
  const newBooking = {
    id: db.bookings.length + 1,
    status: 'pending',
    commission_amount: 0, // se calcula en bookings.js
    created_at: new Date().toISOString().split('T')[0],
    ...bookingData
  };
  db.bookings.push(newBooking);
  return newBooking;
}


// ════════════════════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════════════════════

/**
 * Busca un usuario por email (para login simulado).
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  const db = await getDB();
  
  // Usuarios originales del db.json
  const dbUsers = db.users || [];

  // Usuarios registrados dinamicamente
  const localUsers =
  JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]'); // cambio echo!

  // Unificar usuarios
  const allUsers = [...dbUsers, ...localUsers];

  return (
    allUsers.find(
      u => u.email.toLowerCase() == email.toLowerCase()
    ) || null
  );
}

/**
 * Devuelve un usuario por ID.
 * @param {number|string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUserById(userId) {
  const db = await getDB();
  return db.users.find(u => u.id === Number(userId)) || null;
}


// ════════════════════════════════════════════════════════════════
// CATEGORÍAS Y DEPARTAMENTOS (para filtros)
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve la lista de categorías disponibles.
 * @returns {Promise<Array>}
 */
export async function getCategories() {
  const db = await getDB();
  return db.categories || [];
}

/**
 * Devuelve la lista de departamentos disponibles.
 * @returns {Promise<Array>}
 */
export async function getDepartments() {
  const db = await getDB();
  return db.departments || [];
}


// ════════════════════════════════════════════════════════════════
// SUSCRIPCIONES
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve la suscripción activa de un proveedor.
 * @param {number|string} providerId
 * @returns {Promise<Object|null>}
 */
export async function getSubscriptionByProvider(providerId) {
  const db = await getDB();
  return db.subscriptions
    ? db.subscriptions.find(s => s.provider_id === Number(providerId)) || null
    : null;
}
/**
 * db.js — Capa de datos central de Quetzal Routes
 * Simula una base de datos usando localStorage.
 * Todas las páginas deben leer y escribir datos a través de este archivo.
 */

// ─── CLAVES DE ALMACENAMIENTO ─────────────────────────────────────────────────
const KEYS = {
  users:        'qr_users',
  providers:    'qr_providers',
  destinations: 'qr_destinations',
  bookings:     'qr_bookings',
  reviews:      'qr_reviews',
  favorites:    'qr_favorites',
  session:      'qr_user',
  initialized:  'qr_db_initialized',
};

// ─── DATOS INICIALES (del db.json) ───────────────────────────────────────────
const SEED = {
  users: [
    { id:1, name:'Admin Quetzal Routes', email:'admin@quetzalroutes.com',    password:'admin123', language:'es', role:'admin',    avatar_url:null, created_at:'2025-01-01T00:00:00Z' },
    { id:2, name:'Carlos Tun',           email:'carlos@aventuraatitlan.com', password:'12345678', language:'es', role:'provider', avatar_url:null, created_at:'2025-01-05T10:00:00Z' },
    { id:3, name:'Maria Ajú',            email:'maria@petentours.com',       password:'12345678', language:'es', role:'provider', avatar_url:null, created_at:'2025-01-06T09:00:00Z' },
    { id:4, name:'James Wilson',         email:'james@email.com',            password:'12345678', language:'en', role:'tourist',  avatar_url:null, created_at:'2025-02-10T15:30:00Z' },
    { id:5, name:'Sophie Müller',        email:'sophie@email.de',            password:'12345678', language:'en', role:'tourist',  avatar_url:null, created_at:'2025-02-15T11:00:00Z' },
    { id:6, name:'Pedro Xoyón',          email:'pedro@antiguaheritage.com',  password:'12345678', language:'es', role:'provider', avatar_url:null, created_at:'2025-01-08T08:00:00Z' },
  ],
  providers: [
    { id:1, user_id:2, business_name:'Aventura Atitlán',      description_es:'Empresa familiar con 10 años de experiencia ofreciendo tours en kayak, senderismo y visitas a comunidades indígenas alrededor del Lago de Atitlán.', contact_email:'carlos@aventuraatitlan.com', whatsapp:'+50255551234', plan:'premium', verified:1, created_at:'2025-01-05T10:00:00Z' },
    { id:2, user_id:3, business_name:'Petén Explorers',       description_es:'Agencia especializada en expediciones a la selva del Petén y ruinas mayas. Guías certificados y compromiso con el turismo sostenible.',             contact_email:'maria@petentours.com',       whatsapp:'+50266667890', plan:'elite',   verified:1, created_at:'2025-01-06T09:00:00Z' },
    { id:3, user_id:6, business_name:'Antigua Heritage Tours', description_es:'Recorridos culturales e históricos por la Antigua Guatemala declarada Patrimonio de la Humanidad. Tours a pie, en bicicleta y artesanía local.',    contact_email:'pedro@antiguaheritage.com',  whatsapp:'+50299998765', plan:'free',    verified:1, created_at:'2025-01-08T08:00:00Z' },
  ],
  destinations: [
    { 
      id:1, provider_id:3, title:'Tour Colonial Antigua Guatemala', category:'cultura', department:'Sacatepequez', 
      price_from:150, price_to:150, duration_hours:6, max_people:12, status:'active', featured:1, views_count:342, 
      cover_image:'https://alacartatours.com/wp-content/uploads/2025/01/the-colonial-city-of-antigua-tour-2.jpg', 
      address:'Parque Central, Antigua Guatemala, Sacatepéquez', lat:14.5586, lng:-90.7295, rating_avg: 4.8,
      description_es:'Recorre las calles empedradas de la Ciudad Colonial más bella de Centroamérica. Visita conventos, iglesias barrocas, mercados de artesanías y disfruta de una degustación de café de altura. Nuestro guía experto te contará 500 años de historia viva.', 
      images:['https://alacartatours.com/wp-content/uploads/2025/01/the-colonial-city-of-antigua-tour-2.jpg',
        'https://cdn.tourcms.com/a/11676/586/1/large.jpg',
        'https://media.tacdn.com/media/attractions-splice-spp-674x446/12/73/d2/25.jpg'],
      created_at:'2025-01-10T08:00:00Z' 
    },
    { 
      id:2, provider_id:2, title:'Amanecer en Tikal — Tour Madrugada', category:'cultura', department:'Peten', 
      price_from:450, price_to:450, duration_hours:8, max_people:8, status:'active', featured:1, views_count:589, 
      cover_image:'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&q=80', 
      address:'Parque Nacional Tikal, Petén', lat:17.222, lng:-89.6237, rating_avg: 4.9,
      description_es:'Adéntrate en la jungla del Petén para descubrir Tikal. Recorre templos milenarios, observa fauna silvestre y sube al Templo IV para ver el amanecer sobre el dosel de la selva.', 
      images:['https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&q=80',
        'https://images.unsplash.com/photo-1592229506179-7995edeb6226?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://www.visitcentroamerica.com/wp-content/uploads/2025/04/Tikal-National-Park-Aerial-View-Guatemala-Centroamerica-04.webp'],
      created_at:'2025-01-12T09:00:00Z' 
    },
    { 
      id:3, provider_id:1, title:'Kayak en Lago de Atitlán', category:'aventura', department:'Solola', 
      price_from:200, price_to:200, duration_hours:4, max_people:10, status:'active', featured:1, views_count:210, 
      cover_image:'https://www.civitatis.com/f/guatemala/antigua-guatemala/galeria/big/lago-atitlan-vistas-volcanes.jpg', 
      address:'Panajachel, Sololá', lat:14.7444, lng:-91.1542, rating_avg: 4.7,
      description_es:'Vive la magia del Lago de Atitlán desde el agua. Tour en kayak rodeado de los tres volcanes. Incluye guía bilingüe y equipo completo.', 
      images:['https://www.civitatis.com/f/guatemala/antigua-guatemala/galeria/big/lago-atitlan-vistas-volcanes.jpg',
        'https://www.civitatis.com/f/guatemala/antigua-guatemala/big/tour-kayak-lago-atitlan.jpg',
        'https://dynamic-media.tacdn.com/media/photo-o/2f/18/af/b8/caption.jpg?w=1400&h=1000&s=1'],
      created_at:'2025-01-15T10:00:00Z' 
    },
    { 
      id:4, provider_id:2, title:'Senderismo Volcán Acatenango — Cima a 3,976 msnm', category:'aventura', department:'Chimaltenango', 
      price_from:380, price_to:400, duration_hours:24, max_people:15, status:'active', featured:0, views_count:278, 
      cover_image:'https://www.prensalibre.com/wp-content/uploads/2021/12/NAC-LM-071121-VOLCAN-ACATENANGO-011.jpg?resize=1536,1024', 
      address:'La Soledad, Chimaltenango', lat:14.5012, lng:-90.8757, rating_avg: 4.9,
      description_es:'Acampa frente al Volcán de Fuego en erupción. Una expedición extrema de dos días con guías certificados, equipo de acampar y alimentación incluida.', 
      images:['https://www.prensalibre.com/wp-content/uploads/2021/12/NAC-LM-071121-VOLCAN-ACATENANGO-011.jpg?resize=1536,1024',
        'https://www.visitcentroamerica.com/wp-content/uploads/2025/04/Acatenango-Volcano-Hiking-Guatemala-Centroamerica-03.webp',
        'https://blackbeartravel.mx/contenido/uploads/2023/10/excursion-al-volcan-acatenango-guatemala-BLACKBEAR-13.jpg'],
      created_at:'2025-01-18T07:00:00Z' 
    },
    { 
      id:5, provider_id:3, title:'Ruta del Cacao y Chocolate Artesanal', category:'gastronomía', department:'AltaVerapaz', 
      price_from:175, price_to:200, duration_hours:5, max_people:20, status:'active', featured:0, views_count:415, 
      cover_image:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/ed/e5/15/5ta-avenida-norte-15.jpg?w=900&h=500&s=1', 
      address:'Cobán, Alta Verapaz', lat:15.4697, lng:-90.3795, rating_avg: 4.6,
      description_es:'Especialistas en turismo gastronómico y cultural. Aprende el proceso completo desde la semilla hasta la barra de chocolate con comunidades locales.', 
      images:['https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/ed/e5/15/5ta-avenida-norte-15.jpg?w=900&h=500&s=1',
        'https://www.guatemala.com/fotos/201603/Jose-Moreno-885x500.png',
        'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80'],
      created_at:'2025-01-20T08:00:00Z' 
    }
  ],
  bookings: [
    { id:1, destination_id:1, user_id:4, date_requested:'2025-02-10', people_count:2, total_amount:90.0,  status:'completed', created_at:'2025-02-01T12:00:00Z' },
    { id:2, destination_id:2, user_id:4, date_requested:'2025-02-18', people_count:1, total_amount:85.0,  status:'completed', created_at:'2025-02-10T09:00:00Z' },
    { id:3, destination_id:5, user_id:5, date_requested:'2025-03-10', people_count:3, total_amount:195.0, status:'confirmed', created_at:'2025-02-28T16:00:00Z' },
  ],
  reviews: [
    { id:1, destination_id:1, user_id:4, rating:5, comment:'Absolutely magical experience. Watching the sunrise over the volcanoes from a kayak is something I will never forget.', created_at:'2025-02-12T10:00:00Z' },
    { id:2, destination_id:1, user_id:5, rating:5, comment:'One of the best mornings of my life. The lake is breathtaking, and the traditional breakfast at the end was delicious.', created_at:'2025-02-16T09:30:00Z' },
    { id:3, destination_id:2, user_id:4, rating:5, comment:'Tikal exceeded all my expectations. Standing on Temple IV above the jungle canopy at dawn was surreal.', created_at:'2025-02-20T15:00:00Z' },
    { id:4, destination_id:3, user_id:5, rating:4, comment:'Pedro was very knowledgeable about Antigua\'s history. The chocolate tasting was a highlight!', created_at:'2025-02-22T14:00:00Z' },
    { id:5, destination_id:5, user_id:4, rating:5, comment:'Semuc Champey is one of the most beautiful places I have ever seen. The cave exploration was thrilling.', created_at:'2025-03-01T11:00:00Z' },
  ],
  favorites: [
    { user_id:4, destination_id:1 },
    { user_id:4, destination_id:3 },
    { user_id:5, destination_id:2 },
    { user_id:5, destination_id:5 },
  ],
};

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

/**
 * Inicializa la base de datos en localStorage con los datos semilla.
 * Solo se ejecuta una vez. Si ya fue inicializado, no sobreescribe.
 */
export function initDB() {
  if (localStorage.getItem(KEYS.initialized)) return;

  localStorage.setItem(KEYS.users,        JSON.stringify(SEED.users));
  localStorage.setItem(KEYS.providers,    JSON.stringify(SEED.providers));
  localStorage.setItem(KEYS.destinations, JSON.stringify(SEED.destinations));
  localStorage.setItem(KEYS.bookings,     JSON.stringify(SEED.bookings));
  localStorage.setItem(KEYS.reviews,      JSON.stringify(SEED.reviews));
  localStorage.setItem(KEYS.favorites,    JSON.stringify(SEED.favorites));
  localStorage.setItem(KEYS.initialized,  '1');
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

function getCollection(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveCollection(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(collection) {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map(i => i.id || 0)) + 1;
}

// ─── SESIÓN ───────────────────────────────────────────────────────────────────

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.session));
  } catch {
    return null;
  }
}

export function setSession(user) {
  const { password, ...safeUser } = user;
  localStorage.setItem(KEYS.session, JSON.stringify(safeUser));
  return safeUser;
}

export function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export function getUsers() {
  return getCollection(KEYS.users);
}

export function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

export function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function createUser({ name, email, password, role = 'tourist', language = 'es' }) {
  const users = getUsers();
  if (getUserByEmail(email)) return { ok: false, error: 'Ya existe una cuenta con ese correo.' };

  const newUser = {
    id:         nextId(users),
    name,
    email:      email.toLowerCase(),
    password,
    role,
    language,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveCollection(KEYS.users, users);
  return { ok: true, user: newUser };
}

export function updateUser(id, changes) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { ok: false, error: 'Usuario no encontrado.' };

  users[index] = { ...users[index], ...changes };
  saveCollection(KEYS.users, users);

  // Actualizar sesión si es el usuario activo
  const session = getSession();
  if (session && session.id === id) {
    setSession(users[index]);
  }

  return { ok: true, user: users[index] };
}

// ─── AUTENTICACIÓN ────────────────────────────────────────────────────────────

export function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (!user) return { ok: false, error: 'No existe una cuenta con ese correo.' };
  if (user.password !== password) return { ok: false, error: 'La contraseña es incorrecta.' };

  const safeUser = setSession(user);
  return { ok: true, user: safeUser };
}

export function getRedirectByRole(role) {
  if (role === 'admin')    return 'admin.html';
  if (role === 'provider') return 'dashboard-provider.html';
  return 'explore.html';
}

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────

export function getProviders() {
  return getCollection(KEYS.providers);
}

export function getProviderByUserId(userId) {
  return getProviders().find(p => p.user_id === userId) || null;
}

export function getProviderById(id) {
  return getProviders().find(p => p.id === id) || null;
}

export function updateProvider(id, changes) {
  const providers = getProviders();
  const index = providers.findIndex(p => p.id === id);
  if (index === -1) return { ok: false, error: 'Proveedor no encontrado.' };

  providers[index] = { ...providers[index], ...changes };
  saveCollection(KEYS.providers, providers);
  return { ok: true, provider: providers[index] };
}

export function createProvider({ user_id, business_name, description_es = '', contact_email, whatsapp = '' }) {
  const providers = getProviders();
  const newProvider = {
    id:             nextId(providers),
    user_id,
    business_name,
    description_es,
    contact_email,
    whatsapp,
    plan:           'free',
    verified:       0,
    created_at:     new Date().toISOString(),
  };
  providers.push(newProvider);
  saveCollection(KEYS.providers, providers);
  return { ok: true, provider: newProvider };
}

// ─── DESTINOS ─────────────────────────────────────────────────────────────────

export function getDestinations() {
  return getCollection(KEYS.destinations);
}

export function getDestinationById(id) {
  return getDestinations().find(d => d.id === id) || null;
}

export function getDestinationsByProvider(providerId) {
  return getDestinations().filter(d => d.provider_id === providerId);
}

export function getActiveDestinations() {
  return getDestinations().filter(d => d.status === 'active');
}

export function getFeaturedDestinations() {
  return getDestinations().filter(d => d.featured === 1 && d.status === 'active');
}

export function createDestination(data) {
  const destinations = getDestinations();
  const newDest = {
    id:           nextId(destinations),
    views_count:  0,
    status:       'active',
    featured:     0,
    created_at:   new Date().toISOString(),
    ...data,
  };
  destinations.push(newDest);
  saveCollection(KEYS.destinations, destinations);
  return { ok: true, destination: newDest };
}

export function updateDestination(id, changes) {
  const destinations = getDestinations();
  const index = destinations.findIndex(d => d.id === id);
  if (index === -1) return { ok: false, error: 'Destino no encontrado.' };

  destinations[index] = { ...destinations[index], ...changes };
  saveCollection(KEYS.destinations, destinations);
  return { ok: true, destination: destinations[index] };
}

// ─── RESERVAS ─────────────────────────────────────────────────────────────────

export function getBookings() {
  return getCollection(KEYS.bookings);
}

export function getBookingsByUser(userId) {
  const bookings = getBookings();
  const destinations = getDestinations();
  return bookings
    .filter(b => b.user_id === userId)
    .map(b => ({
      ...b,
      destination: destinations.find(d => d.id === b.destination_id) || null,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getBookingsByProvider(providerId) {
  const bookings     = getBookings();
  const destinations = getDestinationsByProvider(providerId);
  const destIds      = new Set(destinations.map(d => d.id));
  const users        = getUsers();

  return bookings
    .filter(b => destIds.has(b.destination_id))
    .map(b => ({
      ...b,
      destination: destinations.find(d => d.id === b.destination_id) || null,
      user:        users.find(u => u.id === b.user_id) || null,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function createBooking({ destination_id, user_id, date_requested, people_count, total_amount, notes = '' }) {
  const bookings = getBookings();
  const newBooking = {
    id:             nextId(bookings),
    destination_id,
    user_id,
    date_requested,
    people_count,
    total_amount,
    status:         'pending',
    notes,
    created_at:     new Date().toISOString(),
  };
  bookings.push(newBooking);
  saveCollection(KEYS.bookings, bookings);
  return { ok: true, booking: newBooking };
}

export function updateBookingStatus(id, status) {
  const bookings = getBookings();
  const index    = bookings.findIndex(b => b.id === id);
  if (index === -1) return { ok: false, error: 'Reserva no encontrada.' };

  bookings[index].status = status;
  saveCollection(KEYS.bookings, bookings);
  return { ok: true, booking: bookings[index] };
}

// ─── RESEÑAS ──────────────────────────────────────────────────────────────────

export function getReviews() {
  return getCollection(KEYS.reviews);
}

export function getReviewsByDestination(destinationId) {
  const reviews = getReviews();
  const users   = getUsers();
  return reviews
    .filter(r => r.destination_id === destinationId)
    .map(r => ({ ...r, user: users.find(u => u.id === r.user_id) || null }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getReviewsByUser(userId) {
  const reviews      = getReviews();
  const destinations = getDestinations();
  return reviews
    .filter(r => r.user_id === userId)
    .map(r => ({ ...r, destination: destinations.find(d => d.id === r.destination_id) || null }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function createReview({ destination_id, user_id, rating, comment }) {
  const reviews = getReviews();

  // Un usuario solo puede reseñar un destino una vez
  const existing = reviews.find(r => r.destination_id === destination_id && r.user_id === user_id);
  if (existing) return { ok: false, error: 'Ya publicaste una reseña para este destino.' };

  const newReview = {
    id:             nextId(reviews),
    destination_id,
    user_id,
    rating,
    comment,
    created_at:     new Date().toISOString(),
  };
  reviews.push(newReview);
  saveCollection(KEYS.reviews, reviews);
  return { ok: true, review: newReview };
}

export function getAverageRating(destinationId) {
  const reviews = getReviews().filter(r => r.destination_id === destinationId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// ─── FAVORITOS ────────────────────────────────────────────────────────────────

export function getFavorites() {
  return getCollection(KEYS.favorites);
}

export function getFavoritesByUser(userId) {
  const favorites    = getFavorites();
  const destinations = getDestinations();
  return favorites
    .filter(f => f.user_id === userId)
    .map(f => ({ ...f, destination: destinations.find(d => d.id === f.destination_id) || null }))
    .filter(f => f.destination !== null);
}

export function isFavorite(userId, destinationId) {
  return getFavorites().some(f => f.user_id === userId && f.destination_id === destinationId);
}

export function toggleFavorite(userId, destinationId) {
  const favorites = getFavorites();
  const index = favorites.findIndex(f => f.user_id === userId && f.destination_id === destinationId);

  if (index !== -1) {
    favorites.splice(index, 1);
    saveCollection(KEYS.favorites, favorites);
    return { ok: true, action: 'removed' };
  } else {
    favorites.push({ user_id: userId, destination_id: destinationId });
    saveCollection(KEYS.favorites, favorites);
    return { ok: true, action: 'added' };
  }
}

// ─── ESTADÍSTICAS (para admin) ────────────────────────────────────────────────

export function getStats() {
  const users        = getUsers();
  const destinations = getDestinations();
  const bookings     = getBookings();
  const reviews      = getReviews();
  const providers    = getProviders();

  const allRatings = reviews.map(r => r.rating);
  const avgRating  = allRatings.length
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
    : 0;

  return {
    total_users:        users.filter(u => u.role === 'tourist').length,
    total_providers:    providers.length,
    verified_providers: providers.filter(p => p.verified).length,
    total_destinations: destinations.filter(d => d.status === 'active').length,
    featured_count:     destinations.filter(d => d.featured === 1).length,
    total_bookings:     bookings.length,
    avg_rating:         avgRating,
    categories:         [...new Set(destinations.map(d => d.category))],
  };
}

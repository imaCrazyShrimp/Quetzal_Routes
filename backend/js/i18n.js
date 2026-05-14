/**
 * i18n.js — Quetzal Routes
 * Internacionalización: diccionario ES/EN y función de traducción t(key).
 * Detecta el idioma del navegador por defecto y permite cambiarlo en runtime.
 */

// ─── Diccionario ──────────────────────────────────────────────────────────────

const translations = {
  es: {
    // Navegación
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.login': 'Iniciar sesión',
    'nav.register': 'Registrarse',
    'nav.logout': 'Cerrar sesión',
    'nav.dashboard': 'Mi panel',
    'nav.profile': 'Mi perfil',

    // Landing — Hero
    'hero.title': 'Descubre Guatemala Auténtica',
    'hero.subtitle': 'Experiencias únicas con guías locales en destinos increíbles',
    'hero.cta': 'Explorar destinos',
    'hero.cta.provider': 'Registra tu empresa',

    // Búsqueda
    'search.placeholder': '¿A dónde quieres ir?',
    'search.button': 'Buscar',
    'search.no_results': 'No encontramos destinos con esos filtros.',
    'search.results': 'destinos encontrados',

    // Filtros
    'filter.title': 'Filtros',
    'filter.category': 'Categoría',
    'filter.department': 'Departamento',
    'filter.price': 'Precio',
    'filter.price.from': 'Desde',
    'filter.price.to': 'Hasta',
    'filter.rating': 'Calificación mínima',
    'filter.apply': 'Aplicar filtros',
    'filter.clear': 'Limpiar',
    'filter.sort': 'Ordenar por',
    'filter.sort.rating': 'Mejor calificación',
    'filter.sort.newest': 'Más reciente',
    'filter.sort.price_asc': 'Precio: menor a mayor',
    'filter.sort.price_desc': 'Precio: mayor a menor',

    // Categorías
    'category.nature': 'Naturaleza',
    'category.culture': 'Cultura',
    'category.adventure': 'Aventura',
    'category.gastronomy': 'Gastronomía',
    'category.wellness': 'Wellness',

    // Departamentos
    'dept.antigua': 'Antigua Guatemala',
    'dept.atitlan': 'Lago Atitlán',
    'dept.peten': 'Petén',
    'dept.verapaz': 'Verapaz',
    'dept.izabal': 'Izabal',
    'dept.quetzaltenango': 'Quetzaltenango',
    'dept.huehuetenango': 'Huehuetenango',

    // Destino — Detalle
    'destination.from': 'Desde',
    'destination.per_person': 'por persona',
    'destination.book': 'Reservar ahora',
    'destination.contact_whatsapp': 'Contactar por WhatsApp',
    'destination.gallery': 'Galería',
    'destination.description': 'Descripción',
    'destination.location': 'Ubicación',
    'destination.provider': 'Ofrecido por',
    'destination.reviews': 'Reseñas',
    'destination.no_reviews': 'Aún no hay reseñas. ¡Sé el primero!',

    // Reserva
    'booking.title': 'Hacer una reserva',
    'booking.date': 'Fecha',
    'booking.people': 'Número de personas',
    'booking.name': 'Tu nombre',
    'booking.email': 'Tu email',
    'booking.phone': 'Tu teléfono',
    'booking.notes': 'Notas adicionales',
    'booking.submit': 'Confirmar reserva',
    'booking.success': '¡Reserva enviada! El proveedor te contactará pronto.',
    'booking.error': 'Ocurrió un error al enviar la reserva.',
    'booking.commission': 'Se aplica una comisión de servicio del 10%.',

    // Reseñas
    'review.title': 'Deja tu reseña',
    'review.rating': 'Calificación',
    'review.comment': 'Comentario',
    'review.submit': 'Publicar reseña',
    'review.success': '¡Reseña publicada!',
    'review.login_required': 'Inicia sesión para dejar una reseña.',

    // Autenticación
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre completo',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Crear cuenta',
    'auth.role.tourist': 'Soy turista',
    'auth.role.provider': 'Tengo una empresa turística',
    'auth.forgot_password': '¿Olvidaste tu contraseña?',
    'auth.no_account': '¿No tienes cuenta?',
    'auth.have_account': '¿Ya tienes cuenta?',
    'auth.login_error': 'Email o contraseña incorrectos.',
    'auth.register_error': 'Error al crear la cuenta. Intenta de nuevo.',

    // Dashboard del proveedor
    'dashboard.title': 'Mi panel',
    'dashboard.stats.visits': 'Visitas este mes',
    'dashboard.stats.bookings': 'Reservas recibidas',
    'dashboard.stats.rating': 'Calificación promedio',
    'dashboard.stats.revenue': 'Ingresos estimados',
    'dashboard.destinations': 'Mis destinos',
    'dashboard.destination.add': 'Agregar destino',
    'dashboard.destination.edit': 'Editar',
    'dashboard.destination.pause': 'Pausar',
    'dashboard.destination.delete': 'Eliminar',
    'dashboard.bookings': 'Reservas recibidas',
    'dashboard.plan': 'Mi plan',
    'dashboard.plan.upgrade': 'Mejorar plan',
    'dashboard.plan.current': 'Plan actual',

    // Planes
    'plan.free': 'Gratuito',
    'plan.premium': 'Premium',
    'plan.elite': 'Elite',
    'plan.free.desc': 'Hasta 2 destinos publicados',
    'plan.premium.desc': 'Hasta 10 destinos + destaque',
    'plan.elite.desc': 'Ilimitado + estadísticas avanzadas',

    // Mensajes generales
    'general.loading': 'Cargando...',
    'general.error': 'Ocurrió un error. Intenta de nuevo.',
    'general.success': 'Operación exitosa.',
    'general.confirm_delete': '¿Estás seguro de que deseas eliminar esto?',
    'general.yes': 'Sí, eliminar',
    'general.cancel': 'Cancelar',
    'general.save': 'Guardar',
    'general.edit': 'Editar',
    'general.back': 'Volver',
    'general.see_more': 'Ver más',
    'general.share': 'Compartir',
    'general.quetzales': 'Q',

    // Footer
    'footer.rights': 'Todos los derechos reservados.',
    'footer.about': 'Sobre nosotros',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',

    // Errores de validación
    'validation.required': 'Este campo es requerido.',
    'validation.email': 'Ingresa un email válido.',
    'validation.password_length': 'La contraseña debe tener al menos 6 caracteres.',
    'validation.date_future': 'La fecha debe ser en el futuro.',
    'validation.people_min': 'Debe haber al menos 1 persona.',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.login': 'Log in',
    'nav.register': 'Sign up',
    'nav.logout': 'Log out',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'My profile',

    // Landing — Hero
    'hero.title': 'Discover Authentic Guatemala',
    'hero.subtitle': 'Unique experiences with local guides at incredible destinations',
    'hero.cta': 'Explore destinations',
    'hero.cta.provider': 'List your business',

    // Search
    'search.placeholder': 'Where do you want to go?',
    'search.button': 'Search',
    'search.no_results': 'No destinations found with those filters.',
    'search.results': 'destinations found',

    // Filters
    'filter.title': 'Filters',
    'filter.category': 'Category',
    'filter.department': 'Region',
    'filter.price': 'Price',
    'filter.price.from': 'From',
    'filter.price.to': 'To',
    'filter.rating': 'Minimum rating',
    'filter.apply': 'Apply filters',
    'filter.clear': 'Clear',
    'filter.sort': 'Sort by',
    'filter.sort.rating': 'Best rated',
    'filter.sort.newest': 'Newest',
    'filter.sort.price_asc': 'Price: low to high',
    'filter.sort.price_desc': 'Price: high to low',

    // Categories
    'category.nature': 'Nature',
    'category.culture': 'Culture',
    'category.adventure': 'Adventure',
    'category.gastronomy': 'Gastronomy',
    'category.wellness': 'Wellness',

    // Departments
    'dept.antigua': 'Antigua Guatemala',
    'dept.atitlan': 'Lake Atitlán',
    'dept.peten': 'Petén',
    'dept.verapaz': 'Verapaz',
    'dept.izabal': 'Izabal',
    'dept.quetzaltenango': 'Quetzaltenango',
    'dept.huehuetenango': 'Huehuetenango',

    // Destination — Detail
    'destination.from': 'From',
    'destination.per_person': 'per person',
    'destination.book': 'Book now',
    'destination.contact_whatsapp': 'Contact via WhatsApp',
    'destination.gallery': 'Gallery',
    'destination.description': 'Description',
    'destination.location': 'Location',
    'destination.provider': 'Offered by',
    'destination.reviews': 'Reviews',
    'destination.no_reviews': 'No reviews yet. Be the first!',

    // Booking
    'booking.title': 'Make a reservation',
    'booking.date': 'Date',
    'booking.people': 'Number of people',
    'booking.name': 'Your name',
    'booking.email': 'Your email',
    'booking.phone': 'Your phone',
    'booking.notes': 'Additional notes',
    'booking.submit': 'Confirm booking',
    'booking.success': 'Booking sent! The provider will contact you soon.',
    'booking.error': 'An error occurred while sending the booking.',
    'booking.commission': 'A 10% service commission applies.',

    // Reviews
    'review.title': 'Leave your review',
    'review.rating': 'Rating',
    'review.comment': 'Comment',
    'review.submit': 'Post review',
    'review.success': 'Review posted!',
    'review.login_required': 'Log in to leave a review.',

    // Auth
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.name': 'Full name',
    'auth.login': 'Log in',
    'auth.register': 'Create account',
    'auth.role.tourist': 'I am a tourist',
    'auth.role.provider': 'I have a tourism business',
    'auth.forgot_password': 'Forgot your password?',
    'auth.no_account': "Don't have an account?",
    'auth.have_account': 'Already have an account?',
    'auth.login_error': 'Incorrect email or password.',
    'auth.register_error': 'Error creating account. Please try again.',

    // Provider dashboard
    'dashboard.title': 'My dashboard',
    'dashboard.stats.visits': 'Visits this month',
    'dashboard.stats.bookings': 'Bookings received',
    'dashboard.stats.rating': 'Average rating',
    'dashboard.stats.revenue': 'Estimated revenue',
    'dashboard.destinations': 'My destinations',
    'dashboard.destination.add': 'Add destination',
    'dashboard.destination.edit': 'Edit',
    'dashboard.destination.pause': 'Pause',
    'dashboard.destination.delete': 'Delete',
    'dashboard.bookings': 'Bookings received',
    'dashboard.plan': 'My plan',
    'dashboard.plan.upgrade': 'Upgrade plan',
    'dashboard.plan.current': 'Current plan',

    // Plans
    'plan.free': 'Free',
    'plan.premium': 'Premium',
    'plan.elite': 'Elite',
    'plan.free.desc': 'Up to 2 published destinations',
    'plan.premium.desc': 'Up to 10 destinations + featured',
    'plan.elite.desc': 'Unlimited + advanced analytics',

    // General
    'general.loading': 'Loading...',
    'general.error': 'An error occurred. Please try again.',
    'general.success': 'Operation successful.',
    'general.confirm_delete': 'Are you sure you want to delete this?',
    'general.yes': 'Yes, delete',
    'general.cancel': 'Cancel',
    'general.save': 'Save',
    'general.edit': 'Edit',
    'general.back': 'Back',
    'general.see_more': 'See more',
    'general.share': 'Share',
    'general.quetzales': 'Q',

    // Footer
    'footer.rights': 'All rights reserved.',
    'footer.about': 'About us',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',

    // Validation
    'validation.required': 'This field is required.',
    'validation.email': 'Enter a valid email.',
    'validation.password_length': 'Password must be at least 6 characters.',
    'validation.date_future': 'Date must be in the future.',
    'validation.people_min': 'There must be at least 1 person.',
  },
};

// ─── Estado del idioma ────────────────────────────────────────────────────────

let currentLang = 'es';

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * Inicializa el idioma: usa localStorage si existe, sino detecta el navegador.
 * Debe llamarse al inicio de cada página.
 */
export function initLanguage() {
  const stored = localStorage.getItem('qr_lang');
  if (stored && translations[stored]) {
    currentLang = stored;
  } else {
    // Detectar idioma del navegador (toma los primeros 2 caracteres)
    const browserLang = (navigator.language || 'es').slice(0, 2);
    currentLang = translations[browserLang] ? browserLang : 'es';
  }

  // Actualizar el atributo lang del HTML para accesibilidad
  document.documentElement.lang = currentLang;

  // Renderizar todos los elementos con atributo data-i18n
  _renderAll();
}

/**
 * Cambia el idioma activo y re-renderiza la página.
 * @param {'es'|'en'} lang
 */
export function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`[i18n] Idioma no soportado: ${lang}`);
    return;
  }

  currentLang = lang;
  localStorage.setItem('qr_lang', lang);
  document.documentElement.lang = lang;

  _renderAll();

  // Evento para que otros módulos puedan reaccionar al cambio de idioma
  window.dispatchEvent(new CustomEvent('qr:langChange', { detail: { lang } }));
}

/**
 * Devuelve el idioma activo.
 * @returns {'es'|'en'}
 */
export function getCurrentLang() {
  return currentLang;
}

/**
 * Traduce una clave al idioma activo.
 * Si la clave no existe, devuelve la clave misma como fallback.
 * @param {string} key
 * @param {object} [vars]  Variables para interpolación: t('search.results', { count: 5 })
 * @returns {string}
 *
 * @example
 * t('hero.title')                          // 'Descubre Guatemala Auténtica'
 * t('search.results', { count: 12 })       // '12 destinos encontrados'
 */
export function t(key, vars = {}) {
  const dict = translations[currentLang] || translations['es'];
  let text = dict[key] ?? key;

  // Interpolación de variables: {{ count }} → valor
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v);
  });

  return text;
}

/**
 * Devuelve el texto de un destino en el idioma activo.
 * Útil porque los destinos tienen description_es y description_en.
 * @param {object} destination
 * @param {'title'|'description'} field
 * @returns {string}
 *
 * @example
 * const desc = getLocalizedField(destination, 'description');
 */
export function getLocalizedField(destination, field) {
  const langField = `${field}_${currentLang}`;
  return destination[langField] || destination[field] || '';
}

// ─── Privados ─────────────────────────────────────────────────────────────────

/**
 * Renderiza todos los elementos que tengan data-i18n en el DOM.
 * El valor del atributo es la clave de traducción.
 *
 * @example HTML
 * <h1 data-i18n="hero.title"></h1>
 * <input data-i18n-placeholder="search.placeholder">
 */
function _renderAll() {
  // Traduce textContent
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Traduce placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Traduce title (tooltip)
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // Traduce aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
}
/* ============================================================
   QUETZAL ROUTES — i18n.js
   Sistema de internacionalización ES / EN
   Uso:
     import { t, setLanguage, getCurrentLang } from './i18n.js';
     t('hero.title1')          → texto traducido
     setLanguage('en')         → cambia idioma y guarda en localStorage
     getCurrentLang()          → 'es' | 'en'
   ============================================================ */

// ── Diccionario completo ──────────────────────────────────────
const translations = {

  es: {

    // ── Navbar ───────────────────────────────────────────────
    'nav.explore':    'Explorar',
    'nav.categories': 'Categorías',
    'nav.how':        'Cómo funciona',
    'nav.providers':  'Para empresas',
    'nav.login':      'Iniciar sesión',
    'nav.register':   'Registrarse',

    // ── Hero ─────────────────────────────────────────────────
    'hero.tag':               'Destinos auténticos en Guatemala',
    'hero.title1':            'Vive Guatemala',
    'hero.title2':            'como nunca antes',
    'hero.subtitle':          'Conectamos viajeros con experiencias únicas en Antigua, Atitlán, Petén y más. Guías locales. Aventuras reales. Recuerdos para siempre.',
    'hero.searchPlaceholder': '¿A dónde quieres ir?',
    'hero.searchBtn':         'Buscar',
    'hero.stat1':             'Destinos',
    'hero.stat2':             'Proveedores',
    'hero.stat3':             'Viajeros felices',
    'hero.stat4':             'Calificación media',

    // ── Destinos destacados ───────────────────────────────────
    'featured.title':    'Destinos destacados',
    'featured.subtitle': 'Experiencias seleccionadas por nuestros mejores proveedores',
    'featured.cta':      'Ver todos los destinos →',

    // ── Categorías ────────────────────────────────────────────
    'categories.title':    'Explora por categoría',
    'categories.subtitle': 'Encuentra la experiencia que más te emociona',
    'cat.nature':          'Naturaleza',
    'cat.natureDesc':      'Lagos, selvas y volcanes',
    'cat.culture':         'Cultura',
    'cat.cultureDesc':     'Mayas, coloniales e historia viva',
    'cat.adventure':       'Aventura',
    'cat.adventureDesc':   'Senderismo, kayak y volcanes',
    'cat.gastronomy':      'Gastronomía',
    'cat.gastronomyDesc':  'Cacao, café y cocina maya',
    'cat.wellness':        'Bienestar',
    'cat.wellnessDesc':    'Retiros, spa y meditación',

    // ── Departamentos ─────────────────────────────────────────
    'departments.title':    'Explora por región',
    'departments.subtitle': 'Guatemala en toda su diversidad',

    // ── Cómo funciona ─────────────────────────────────────────
    'how.title':      '¿Cómo funciona?',
    'how.subtitle':   'Reserva tu experiencia en 3 simples pasos',
    'how.step1Title': 'Explora y filtra',
    'how.step1Desc':  'Navega cientos de experiencias. Filtra por categoría, departamento, precio y calificación para encontrar la aventura perfecta.',
    'how.step2Title': 'Reserva fácil',
    'how.step2Desc':  'Elige fecha, número de personas y confirma tu reserva directamente con el proveedor local. Sin intermediarios innecesarios.',
    'how.step3Title': '¡Vive la experiencia!',
    'how.step3Desc':  'Disfruta tu aventura en Guatemala con guías locales expertos. Luego comparte tu reseña para ayudar a otros viajeros.',
    'how.cta':        'Empezar a explorar',
    'how.ctaProvider':'¿Tienes un negocio turístico? →',

    // ── Testimonios ───────────────────────────────────────────
    'testimonials.title':    'Lo que dicen los viajeros',
    'testimonials.subtitle': 'Miles de experiencias reales en Guatemala',

    // ── CTA Proveedor ─────────────────────────────────────────
    'providerCta.title': '¿Tienes una empresa turística en Guatemala?',
    'providerCta.desc':  'Únete a Quetzal Routes y lleva tu negocio al siguiente nivel. Llega a miles de turistas extranjeros que buscan exactamente lo que tú ofreces.',

    // ── Explorador ────────────────────────────────────────────
    'explore.title':    'Explora Guatemala',
    'explore.subtitle': 'Descubre experiencias auténticas en todo el país',

    // ── Cards de destino ──────────────────────────────────────
    'card.from':     'Desde',
    'card.rating':   'Calificación',
    'card.featured': '★ Destacado',
    'card.book':     'Reservar',
    'card.noResults':'No se encontraron destinos con esos filtros.',

    // ── Página de destino ─────────────────────────────────────
    'dest.gallery':        'Galería',
    'dest.description':    'Descripción',
    'dest.includes':       'Incluye',
    'dest.location':       'Ubicación',
    'dest.reviews':        'Reseñas',
    'dest.bookNow':        'Reservar ahora',
    'dest.contactWhatsapp':'Contactar por WhatsApp',
    'dest.provider':       'Proveedor',
    'dest.from':           'Desde',
    'dest.perPerson':      'por persona',
    'dest.duration':       'Duración',
    'dest.maxPeople':      'Máximo',
    'dest.people':         'personas',
    'dest.writeReview':    'Escribe tu reseña',
    'dest.yourRating':     'Tu calificación',
    'dest.yourComment':    'Cuéntanos tu experiencia...',
    'dest.submitReview':   'Publicar reseña',
    'dest.noReviews':      'Aún no hay reseñas para este destino.',

    // ── Formulario de reserva ─────────────────────────────────
    'booking.title':       'Hacer una reserva',
    'booking.date':        'Fecha deseada',
    'booking.people':      'Número de personas',
    'booking.name':        'Tu nombre',
    'booking.email':       'Tu correo',
    'booking.phone':       'Tu teléfono (opcional)',
    'booking.notes':       'Notas adicionales',
    'booking.notesHint':   'Alergias, requerimientos especiales...',
    'booking.submit':      'Confirmar reserva',
    'booking.success':     '¡Reserva enviada! El proveedor te contactará pronto.',
    'booking.error':       'Hubo un error. Inténtalo de nuevo.',

    // ── Login / Register ──────────────────────────────────────
    'auth.loginTitle':       'Iniciar sesión',
    'auth.registerTitle':    'Crear cuenta',
    'auth.email':            'Correo electrónico',
    'auth.password':         'Contraseña',
    'auth.name':             'Nombre completo',
    'auth.role':             'Tipo de cuenta',
    'auth.roleTourist':      'Soy turista',
    'auth.roleProvider':     'Tengo una empresa turística',
    'auth.loginBtn':         'Ingresar',
    'auth.registerBtn':      'Crear cuenta',
    'auth.noAccount':        '¿No tienes cuenta?',
    'auth.hasAccount':       '¿Ya tienes cuenta?',
    'auth.forgotPassword':   '¿Olvidaste tu contraseña?',
    'auth.or':               'o',
    'auth.loginSuccess':     '¡Bienvenido de vuelta!',
    'auth.registerSuccess':  '¡Cuenta creada! Bienvenido a Quetzal Routes.',
    'auth.errorCredentials': 'Correo o contraseña incorrectos.',
    'auth.errorEmail':       'Ingresa un correo válido.',
    'auth.errorPassword':    'La contraseña debe tener al menos 6 caracteres.',
    'auth.errorName':        'Ingresa tu nombre completo.',

    // ── Dashboard proveedor ───────────────────────────────────
    'dash.welcome':       'Bienvenido',
    'dash.overview':      'Resumen',
    'dash.myDestinations':'Mis destinos',
    'dash.bookings':      'Reservas',
    'dash.myPlan':        'Mi plan',
    'dash.profile':       'Perfil',
    'dash.visits':        'Visitas este mes',
    'dash.totalBookings': 'Reservas totales',
    'dash.avgRating':     'Calificación promedio',
    'dash.revenue':       'Ingresos estimados',
    'dash.addDestination':'+ Agregar destino',
    'dash.edit':          'Editar',
    'dash.pause':         'Pausar',
    'dash.delete':        'Eliminar',
    'dash.status.active': 'Activo',
    'dash.status.inactive':'Pausado',
    'dash.status.pending':'Pendiente',
    'dash.upgrade':       'Mejorar plan',
    'dash.currentPlan':   'Plan actual',

    // ── Planes ────────────────────────────────────────────────
    'plan.free':    'Gratuito',
    'plan.premium': 'Premium',
    'plan.elite':   'Elite',

    // ── Filtros ───────────────────────────────────────────────
    'filter.title':      'Filtros',
    'filter.category':   'Categoría',
    'filter.department': 'Departamento',
    'filter.price':      'Precio',
    'filter.minPrice':   'Precio mínimo',
    'filter.maxPrice':   'Precio máximo',
    'filter.rating':     'Calificación mínima',
    'filter.apply':      'Aplicar filtros',
    'filter.clear':      'Limpiar filtros',
    'filter.sortBy':     'Ordenar por',
    'filter.sort.newest':'Más recientes',
    'filter.sort.rating':'Mejor calificados',
    'filter.sort.price': 'Menor precio',
    'filter.allCats':    'Todas las categorías',
    'filter.allDepts':   'Todos los departamentos',

    // ── Generales ─────────────────────────────────────────────
    'general.loading':   'Cargando...',
    'general.error':     'Algo salió mal. Inténtalo de nuevo.',
    'general.noData':    'No hay datos disponibles.',
    'general.back':      '← Volver',
    'general.seeMore':   'Ver más',
    'general.close':     'Cerrar',
    'general.save':      'Guardar',
    'general.cancel':    'Cancelar',
    'general.confirm':   'Confirmar',
    'general.delete':    'Eliminar',
    'general.edit':      'Editar',
    'general.search':    'Buscar',
    'general.of':        'de',
    'general.results':   'resultados',

    // ── Footer ────────────────────────────────────────────────
    'footer.tagline':    'El marketplace turístico de Guatemala.',
    'footer.explore':    'Explorar',
    'footer.destinations':'Destinos',
    'footer.company':    'Empresa',
    'footer.about':      'Acerca de nosotros',
    'footer.forProviders':'Para proveedores',
    'footer.plans':      'Planes y precios',
    'footer.contact':    'Contacto',
    'footer.privacy':    'Privacidad',
    'footer.rights':     'Todos los derechos reservados.',
  },

  // ════════════════════════════════════════════════════════════
  en: {

    // ── Navbar ───────────────────────────────────────────────
    'nav.explore':    'Explore',
    'nav.categories': 'Categories',
    'nav.how':        'How it works',
    'nav.providers':  'For businesses',
    'nav.login':      'Sign in',
    'nav.register':   'Sign up',

    // ── Hero ─────────────────────────────────────────────────
    'hero.tag':               'Authentic destinations in Guatemala',
    'hero.title1':            'Experience Guatemala',
    'hero.title2':            'like never before',
    'hero.subtitle':          'We connect travelers with unique experiences in Antigua, Atitlán, Petén and more. Local guides. Real adventures. Memories forever.',
    'hero.searchPlaceholder': 'Where do you want to go?',
    'hero.searchBtn':         'Search',
    'hero.stat1':             'Destinations',
    'hero.stat2':             'Providers',
    'hero.stat3':             'Happy travelers',
    'hero.stat4':             'Average rating',

    // ── Destinos destacados ───────────────────────────────────
    'featured.title':    'Featured destinations',
    'featured.subtitle': 'Experiences handpicked by our best providers',
    'featured.cta':      'See all destinations →',

    // ── Categorías ────────────────────────────────────────────
    'categories.title':    'Explore by category',
    'categories.subtitle': 'Find the experience that excites you most',
    'cat.nature':          'Nature',
    'cat.natureDesc':      'Lakes, jungles and volcanoes',
    'cat.culture':         'Culture',
    'cat.cultureDesc':     'Mayan, colonial and living history',
    'cat.adventure':       'Adventure',
    'cat.adventureDesc':   'Hiking, kayaking and volcanoes',
    'cat.gastronomy':      'Gastronomy',
    'cat.gastronomyDesc':  'Cacao, coffee and Mayan cuisine',
    'cat.wellness':        'Wellness',
    'cat.wellnessDesc':    'Retreats, spa and meditation',

    // ── Departamentos ─────────────────────────────────────────
    'departments.title':    'Explore by region',
    'departments.subtitle': 'Guatemala in all its diversity',

    // ── Cómo funciona ─────────────────────────────────────────
    'how.title':      'How does it work?',
    'how.subtitle':   'Book your experience in 3 simple steps',
    'how.step1Title': 'Explore and filter',
    'how.step1Desc':  'Browse hundreds of experiences. Filter by category, department, price and rating to find your perfect adventure.',
    'how.step2Title': 'Easy booking',
    'how.step2Desc':  'Choose your date, number of people and confirm your booking directly with the local provider. No unnecessary middlemen.',
    'how.step3Title': 'Live the experience!',
    'how.step3Desc':  'Enjoy your Guatemalan adventure with expert local guides. Then share your review to help other travelers.',
    'how.cta':        'Start exploring',
    'how.ctaProvider':'Do you have a tourism business? →',

    // ── Testimonios ───────────────────────────────────────────
    'testimonials.title':    'What travelers say',
    'testimonials.subtitle': 'Thousands of real experiences in Guatemala',

    // ── CTA Proveedor ─────────────────────────────────────────
    'providerCta.title': 'Do you have a tourism business in Guatemala?',
    'providerCta.desc':  'Join Quetzal Routes and take your business to the next level. Reach thousands of international travelers looking for exactly what you offer.',

    // ── Explorador ────────────────────────────────────────────
    'explore.title':    'Explore Guatemala',
    'explore.subtitle': 'Discover authentic experiences across the country',

    // ── Cards de destino ──────────────────────────────────────
    'card.from':     'From',
    'card.rating':   'Rating',
    'card.featured': '★ Featured',
    'card.book':     'Book now',
    'card.noResults':'No destinations found with those filters.',

    // ── Página de destino ─────────────────────────────────────
    'dest.gallery':        'Gallery',
    'dest.description':    'Description',
    'dest.includes':       'Includes',
    'dest.location':       'Location',
    'dest.reviews':        'Reviews',
    'dest.bookNow':        'Book now',
    'dest.contactWhatsapp':'Contact via WhatsApp',
    'dest.provider':       'Provider',
    'dest.from':           'From',
    'dest.perPerson':      'per person',
    'dest.duration':       'Duration',
    'dest.maxPeople':      'Maximum',
    'dest.people':         'people',
    'dest.writeReview':    'Write your review',
    'dest.yourRating':     'Your rating',
    'dest.yourComment':    'Tell us about your experience...',
    'dest.submitReview':   'Post review',
    'dest.noReviews':      'No reviews yet for this destination.',

    // ── Formulario de reserva ─────────────────────────────────
    'booking.title':       'Make a booking',
    'booking.date':        'Preferred date',
    'booking.people':      'Number of people',
    'booking.name':        'Your name',
    'booking.email':       'Your email',
    'booking.phone':       'Your phone (optional)',
    'booking.notes':       'Additional notes',
    'booking.notesHint':   'Allergies, special requirements...',
    'booking.submit':      'Confirm booking',
    'booking.success':     'Booking sent! The provider will contact you soon.',
    'booking.error':       'Something went wrong. Please try again.',

    // ── Login / Register ──────────────────────────────────────
    'auth.loginTitle':       'Sign in',
    'auth.registerTitle':    'Create account',
    'auth.email':            'Email address',
    'auth.password':         'Password',
    'auth.name':             'Full name',
    'auth.role':             'Account type',
    'auth.roleTourist':      'I am a traveler',
    'auth.roleProvider':     'I have a tourism business',
    'auth.loginBtn':         'Sign in',
    'auth.registerBtn':      'Create account',
    'auth.noAccount':        "Don't have an account?",
    'auth.hasAccount':       'Already have an account?',
    'auth.forgotPassword':   'Forgot your password?',
    'auth.or':               'or',
    'auth.loginSuccess':     'Welcome back!',
    'auth.registerSuccess':  'Account created! Welcome to Quetzal Routes.',
    'auth.errorCredentials': 'Incorrect email or password.',
    'auth.errorEmail':       'Please enter a valid email.',
    'auth.errorPassword':    'Password must be at least 6 characters.',
    'auth.errorName':        'Please enter your full name.',

    // ── Dashboard proveedor ───────────────────────────────────
    'dash.welcome':       'Welcome',
    'dash.overview':      'Overview',
    'dash.myDestinations':'My destinations',
    'dash.bookings':      'Bookings',
    'dash.myPlan':        'My plan',
    'dash.profile':       'Profile',
    'dash.visits':        'Visits this month',
    'dash.totalBookings': 'Total bookings',
    'dash.avgRating':     'Average rating',
    'dash.revenue':       'Estimated revenue',
    'dash.addDestination':'+ Add destination',
    'dash.edit':          'Edit',
    'dash.pause':         'Pause',
    'dash.delete':        'Delete',
    'dash.status.active': 'Active',
    'dash.status.inactive':'Paused',
    'dash.status.pending':'Pending',
    'dash.upgrade':       'Upgrade plan',
    'dash.currentPlan':   'Current plan',

    // ── Planes ────────────────────────────────────────────────
    'plan.free':    'Free',
    'plan.premium': 'Premium',
    'plan.elite':   'Elite',

    // ── Filtros ───────────────────────────────────────────────
    'filter.title':      'Filters',
    'filter.category':   'Category',
    'filter.department': 'Department',
    'filter.price':      'Price',
    'filter.minPrice':   'Min price',
    'filter.maxPrice':   'Max price',
    'filter.rating':     'Minimum rating',
    'filter.apply':      'Apply filters',
    'filter.clear':      'Clear filters',
    'filter.sortBy':     'Sort by',
    'filter.sort.newest':'Newest first',
    'filter.sort.rating':'Top rated',
    'filter.sort.price': 'Lowest price',
    'filter.allCats':    'All categories',
    'filter.allDepts':   'All departments',

    // ── Generales ─────────────────────────────────────────────
    'general.loading':   'Loading...',
    'general.error':     'Something went wrong. Please try again.',
    'general.noData':    'No data available.',
    'general.back':      '← Back',
    'general.seeMore':   'See more',
    'general.close':     'Close',
    'general.save':      'Save',
    'general.cancel':    'Cancel',
    'general.confirm':   'Confirm',
    'general.delete':    'Delete',
    'general.edit':      'Edit',
    'general.search':    'Search',
    'general.of':        'of',
    'general.results':   'results',

    // ── Footer ────────────────────────────────────────────────
    'footer.tagline':    'Guatemala\'s tourism marketplace.',
    'footer.explore':    'Explore',
    'footer.destinations':'Destinations',
    'footer.company':    'Company',
    'footer.about':      'About us',
    'footer.forProviders':'For providers',
    'footer.plans':      'Plans & pricing',
    'footer.contact':    'Contact',
    'footer.privacy':    'Privacy',
    'footer.rights':     'All rights reserved.',
  }
};


// ── Estado del idioma ─────────────────────────────────────────
const STORAGE_KEY = 'qr_lang';

let currentLang = localStorage.getItem(STORAGE_KEY) || 'es';

// Validar que sea un idioma soportado
if (!translations[currentLang]) currentLang = 'es';


// ── API pública ───────────────────────────────────────────────

/**
 * Devuelve el texto traducido para una clave.
 * Si la clave no existe, devuelve la clave misma como fallback.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return translations[currentLang][key] ?? translations['es'][key] ?? key;
}

/**
 * Cambia el idioma activo y lo guarda en localStorage.
 * @param {'es'|'en'} lang
 */
export function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`[i18n] Idioma no soportado: ${lang}`);
    return;
  }
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

/**
 * Devuelve el idioma activo.
 * @returns {'es'|'en'}
 */
export function getCurrentLang() {
  return currentLang;
}

/**
 * Aplica las traducciones a todos los elementos con data-i18n en el DOM.
 * Llama esto una vez que el DOM esté listo, y cada vez que cambies idioma.
 */
export function applyTranslations() {
  // Textos normales
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });

  // Placeholders de inputs
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text) el.placeholder = text;
  });

  // Atributos title (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const text = t(key);
    if (text) el.title = text;
  });

  // Atributo aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    const text = t(key);
    if (text) el.setAttribute('aria-label', text);
  });

  // Actualizar atributo lang del <html>
  document.documentElement.lang = currentLang;
}
/**
 * index.js — Quetzal Routes
 * Punto de entrada y orquestador del backend.
 *
 * Responsabilidades:
 *  1. Re-exportar todos los módulos bajo un namespace único (QuetzalRoutes)
 *  2. Inicializar el estado global (token de sesión, usuario activo)
 *  3. Exponer helpers de arranque para las páginas HTML
 *  4. Registrar listeners globales (logout automático por expiración, cambios de idioma)
 *
 * Uso en HTML:
 *  <script type="module">
 *    import { init, auth, destinations } from '../js/index.js';
 *    await init();
 *    const featured = await destinations.getFeaturedDestinations();
 *  </script>
 */

// ─── Re-exportaciones de módulos ──────────────────────────────────────────────

export * as api           from './api.js';
export * as auth          from './auth.js';
export * as destinations  from './destinations.js';
export * as bookings      from './bookings.js';
export * as reviews       from './reviews.js';
export * as providers     from './providers.js';
export * as subscriptions from './subscriptions.js';
export * as maps          from './maps.js';
export * as filters       from './filters.js';

// ─── Imports internos para la inicialización ──────────────────────────────────

import { isAuthenticated, getCurrentUser, refreshUser, logoutUser } from './auth.js';
import { PLANS }                                                      from './subscriptions.js';

// ─── Constantes globales ──────────────────────────────────────────────────────

/** Versión del cliente. Se puede mostrar en el pie de página o en logs. */
export const VERSION = '1.0.0';

/** Idioma por defecto. Se lee de localStorage si el usuario lo cambió antes. */
export const DEFAULT_LANG = 'es';

// ─── Estado de la aplicación ──────────────────────────────────────────────────

/**
 * Estado global compartido por todos los módulos.
 * No modificar directamente desde fuera; usar los helpers de abajo.
 * @type {{ user: object|null, lang: string, initialized: boolean }}
 */
export const AppState = {
  user:        null,
  lang:        DEFAULT_LANG,
  initialized: false,
};

// ─── Inicialización principal ─────────────────────────────────────────────────

/**
 * Inicializa el backend de la aplicación.
 * Debe llamarse una vez al cargar cada página, antes de usar cualquier módulo.
 *
 * - Restaura el usuario autenticado desde localStorage
 * - Detecta el idioma preferido del usuario
 * - Registra los listeners globales (expiración de sesión, beforeunload)
 *
 * @param {object} [options]
 * @param {boolean} [options.requireAuth=false]   Si true, redirige a login si no hay sesión
 * @param {'tourist'|'provider'|'admin'} [options.requireRole]  Redirige si el rol no coincide
 * @param {string}  [options.loginUrl='../pages/login.html']     URL de redirección si no hay sesión
 * @returns {Promise<{ user: object|null, lang: string }>}
 *
 * @example
 * // En index.html (pública):
 * const { user, lang } = await init();
 *
 * // En dashboard-provider.html (privada, solo proveedores):
 * const { user } = await init({ requireAuth: true, requireRole: 'provider' });
 */
export async function init(options = {}) {
  const {
    requireAuth = false,
    requireRole  = null,
    loginUrl     = '../pages/login.html',
  } = options;

  // 1. Detectar idioma almacenado
  AppState.lang = localStorage.getItem('qr_lang') || DEFAULT_LANG;

  // 2. Restaurar sesión del usuario
  if (isAuthenticated()) {
    try {
      // Intentar refrescar el perfil desde el servidor
      AppState.user = await refreshUser();
    } catch {
      // Si el token expiró o hay error de red, usar el caché local
      AppState.user = getCurrentUser();
    }
  }

  // 3. Validar autenticación y rol si la página lo requiere
  if (requireAuth && !AppState.user) {
    window.location.href = loginUrl;
    return AppState;
  }

  if (requireRole && AppState.user?.role !== requireRole) {
    window.location.href = loginUrl;
    return AppState;
  }

  // 4. Registrar listeners globales
  _registerGlobalListeners();

  AppState.initialized = true;
  return { user: AppState.user, lang: AppState.lang };
}

// ─── Helpers de sesión ────────────────────────────────────────────────────────

/**
 * Devuelve el usuario autenticado actualmente, o null si no hay sesión.
 * Atajo para no importar auth.js en cada módulo solo por esta función.
 * @returns {object|null}
 */
export function getUser() {
  return AppState.user;
}

/**
 * Devuelve true si hay una sesión activa.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!AppState.user;
}

/**
 * Cierra la sesión del usuario y redirige al inicio.
 * @param {string} [redirectUrl='../index.html']
 */
export function logout(redirectUrl = '../index.html') {
  logoutUser();
  AppState.user = null;
  window.location.href = redirectUrl;
}

// ─── Helpers de idioma ────────────────────────────────────────────────────────

/**
 * Devuelve el idioma activo ('es' | 'en').
 * @returns {string}
 */
export function getLang() {
  return AppState.lang;
}

/**
 * Cambia el idioma activo y lo guarda en localStorage.
 * Emite el evento personalizado 'qr:langchange' para que los módulos reaccionen.
 * @param {'es'|'en'} lang
 */
export function setLang(lang) {
  if (lang !== 'es' && lang !== 'en') {
    console.warn(`[QuetzalRoutes] Idioma no soportado: ${lang}. Usando 'es'.`);
    lang = 'es';
  }
  AppState.lang = lang;
  localStorage.setItem('qr_lang', lang);
  document.documentElement.setAttribute('lang', lang);
  window.dispatchEvent(new CustomEvent('qr:langchange', { detail: { lang } }));
}

// ─── Helpers de planes ────────────────────────────────────────────────────────

/**
 * Devuelve true si el proveedor autenticado tiene acceso a una feature.
 * Verifica directamente en PLANS sin llamada al servidor.
 *
 * @param {'featured'|'analytics'|'priority_support'} feature
 * @returns {boolean}
 *
 * @example
 * if (!hasPlanFeature('analytics')) showUpgradePrompt();
 */
export function hasPlanFeature(feature) {
  const plan = PLANS[AppState.user?.plan || 'free'];
  return !!plan?.[feature];
}

/**
 * Devuelve el máximo de destinos que puede publicar el proveedor activo.
 * @returns {number}
 */
export function getMaxDestinations() {
  const plan = PLANS[AppState.user?.plan || 'free'];
  return plan?.max_destinations ?? 2;
}

// ─── Listeners globales (privado) ────────────────────────────────────────────

/**
 * Registra una sola vez los listeners que deben correr en toda la app.
 * Llamado internamente desde init().
 */
function _registerGlobalListeners() {
  // Detectar expiración de token: si otra pestaña hace logout, sincronizar
  window.addEventListener('storage', (e) => {
    if (e.key === 'qr_token' && !e.newValue) {
      AppState.user = null;
      // Redirigir si la página actual requería autenticación
      const metaAuth = document.querySelector('meta[name="qr-require-auth"]');
      if (metaAuth) {
        window.location.href = '../pages/login.html';
      }
    }

    // Sincronizar cambio de idioma entre pestañas
    if (e.key === 'qr_lang' && e.newValue) {
      AppState.lang = e.newValue;
      window.dispatchEvent(new CustomEvent('qr:langchange', { detail: { lang: e.newValue } }));
    }
  });

  // Exponer el estado en la consola en modo desarrollo (hostname = localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.__QR__ = { AppState, getUser, getLang, hasPlanFeature };
    console.info(
      '%c[Quetzal Routes]%c Backend inicializado — v' + VERSION,
      'color:#2D6A4F;font-weight:bold',
      'color:inherit',
    );
  }
}

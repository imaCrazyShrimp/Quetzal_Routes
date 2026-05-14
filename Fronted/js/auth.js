/* ============================================================
   QUETZAL ROUTES — auth.js
   Manejo de sesión, login, registro y permisos.

   Mientras no hay backend: simula autenticación con db.json.
   Cuando el backend esté listo: solo cambia las funciones
   _loginRequest() y _registerRequest() — el resto no cambia.
   ============================================================ */

import { getUserByEmail } from './api.js';

// ── Clave de sesión en sessionStorage ─────────────────────────
const SESSION_KEY = 'qr_user';

// ── Redirects por rol ─────────────────────────────────────────
const ROLE_REDIRECTS = {
  tourist:  '../html/explore.html',
  provider: '../html/dashboard-provider.html',
  admin:    '../html/admin.html',
};

// Desde dentro de /html/, las rutas son relativas
const ROLE_REDIRECTS_FROM_HTML = {
  tourist:  'explore.html',
  provider: 'dashboard-provider.html',
  admin:    'admin.html',
};


// ════════════════════════════════════════════════════════════════
// SESIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Devuelve el usuario de la sesión activa, o null si no hay sesión.
 * @returns {Object|null} { id, name, email, role, language }
 */
export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Indica si hay un usuario autenticado.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Indica si el usuario actual tiene un rol específico.
 * @param {'tourist'|'provider'|'admin'} role
 * @returns {boolean}
 */
export function hasRole(role) {
  const user = getCurrentUser();
  return user?.role === role;
}

/**
 * Cierra la sesión y redirige al login.
 */
export function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

/**
 * Guarda el usuario en sesión (uso interno).
 * @param {Object} user
 */
function _saveSession(user) {
  // No guardar password_hash en sesión
  const { password_hash, ...safeUser } = user;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}


// ════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════

/**
 * Autentica al usuario con email y contraseña.
 * Devuelve { ok: true, user } o { ok: false, error: 'mensaje' }
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>}
 */
export async function loginUser(email, password) {
  // Simular latencia de red
  await _delay(800);

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return { ok: false, error: 'No existe una cuenta con ese correo.' };
    }

    // En mock: cualquier contraseña no vacía es válida.
    // Con backend real: comparar hash aquí o en el servidor.
    if (!password || password.length < 1) {
      return { ok: false, error: 'La contraseña es incorrecta.' };
    }

    // Login exitoso
    _saveSession(user);
    return { ok: true, user };

  } catch (err) {
    console.error('[auth.js] loginUser error:', err);
    return { ok: false, error: 'Error de conexión. Inténtalo de nuevo.' };
  }
}

/**
 * Devuelve la URL de redirección según el rol del usuario.
 * @param {'tourist'|'provider'|'admin'} role
 * @param {boolean} fromHtml - si se llama desde dentro de /html/
 * @returns {string}
 */
export function getRedirectByRole(role, fromHtml = true) {
  return fromHtml
    ? (ROLE_REDIRECTS_FROM_HTML[role] || 'explore.html')
    : (ROLE_REDIRECTS[role] || '../html/explore.html');
}


// ════════════════════════════════════════════════════════════════
// REGISTRO
// ════════════════════════════════════════════════════════════════

/**
 * Registra un nuevo usuario (turista o proveedor).
 * Devuelve { ok: true, user } o { ok: false, error: 'mensaje' }
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {'tourist'|'provider'} data.role
 * @param {string} [data.language]        - 'es' | 'en'
 * @param {string} [data.businessName]    - solo si role === 'provider'
 * @param {string} [data.whatsapp]        - solo si role === 'provider'
 * @param {string} [data.businessDesc]    - solo si role === 'provider'
 * @param {'free'|'premium'|'elite'} [data.plan] - solo si role === 'provider'
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>}
 */
export async function registerUser(data) {
  await _delay(1000);

  try {
    // Validaciones básicas
    const validationError = _validateRegisterData(data);
    if (validationError) return { ok: false, error: validationError };

    // Verificar si el email ya existe
    const existing = await getUserByEmail(data.email);
    if (existing) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
    }

    // Crear usuario en memoria (mock)
    const newUser = {
      id:         Date.now(),
      name:       data.name.trim(),
      email:      data.email.trim().toLowerCase(),
      language:   data.language || 'es',
      role:       data.role || 'tourist',
      created_at: new Date().toISOString().split('T')[0],
    };

    // Si es proveedor, agregar datos del negocio
    if (data.role === 'provider' && data.businessName) {
      newUser.business = {
        name:        data.businessName.trim(),
        whatsapp:    data.whatsapp || '',
        description: data.businessDesc || '',
        plan:        data.plan || 'free',
        verified:    false,
      };
    }

    _saveSession(newUser);
    return { ok: true, user: newUser };

  } catch (err) {
    console.error('[auth.js] registerUser error:', err);
    return { ok: false, error: 'Error al crear la cuenta. Inténtalo de nuevo.' };
  }
}


// ════════════════════════════════════════════════════════════════
// PROTECCIÓN DE RUTAS
// ════════════════════════════════════════════════════════════════

/**
 * Protege una página: si no hay sesión, redirige al login.
 * Llámalo al inicio del script de cualquier página privada.
 *
 * @param {'tourist'|'provider'|'admin'} [requiredRole] - opcional
 */
export function requireAuth(requiredRole) {
  const user = getCurrentUser();

  if (!user) {
    // Guardar URL actual para redirigir después del login
    sessionStorage.setItem('qr_redirect_after_login', window.location.href);
    window.location.href = 'login.html';
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Tiene sesión pero no el rol correcto
    const redirect = getRedirectByRole(user.role);
    window.location.href = redirect;
  }
}

/**
 * Si ya hay sesión activa y el usuario intenta ir al login/register,
 * lo redirige a su página correspondiente.
 * Llámalo en login.html y register.html.
 */
export function redirectIfAuthenticated() {
  const user = getCurrentUser();
  if (!user) return;

  // Ver si hay un redirect guardado
  const savedRedirect = sessionStorage.getItem('qr_redirect_after_login');
  if (savedRedirect) {
    sessionStorage.removeItem('qr_redirect_after_login');
    window.location.href = savedRedirect;
    return;
  }

  window.location.href = getRedirectByRole(user.role);
}


// ════════════════════════════════════════════════════════════════
// VALIDACIONES
// ════════════════════════════════════════════════════════════════

/**
 * Valida un email con regex básico.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Valida la fortaleza de una contraseña.
 * Devuelve { score: 0-4, label: string, color: string }
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)                        score++;
  if (password.length >= 12)                       score++;
  if (/[A-Z]/.test(password))                      score++;
  if (/[0-9]/.test(password))                      score++;
  if (/[^A-Za-z0-9]/.test(password))               score++;

  const levels = [
    { label: 'Muy débil',  color: '#e63946' },
    { label: 'Débil',      color: '#f4a261' },
    { label: 'Regular',    color: '#e9c46a' },
    { label: 'Fuerte',     color: '#52b788' },
    { label: 'Muy fuerte', color: '#2d6a4f' },
  ];

  return { score, ...levels[Math.min(score, 4)] };
}


// ════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ════════════════════════════════════════════════════════════════

function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function _validateRegisterData(data) {
  if (!data.name || data.name.trim().length < 2) {
    return 'Ingresa tu nombre completo.';
  }
  if (!isValidEmail(data.email)) {
    return 'Ingresa un correo electrónico válido.';
  }
  if (!data.password || data.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (data.role === 'provider' && !data.businessName?.trim()) {
    return 'Ingresa el nombre de tu empresa.';
  }
  return null; // sin errores
}
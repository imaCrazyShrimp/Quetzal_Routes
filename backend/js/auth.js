/**
 * auth.js — Quetzal Routes
 * Gestión de autenticación: registro, login, logout y verificación de sesión.
 * Usa JWT almacenado en localStorage.
 */

import { get, post, setAuthHeader, clearAuthHeader } from './api.js';

// ─── Clave de almacenamiento ──────────────────────────────────────────────────

const USER_KEY = 'qr_user';
const TOKEN_KEY = 'qr_token';

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario (turista o proveedor).
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {'tourist'|'provider'} data.role
 * @param {'es'|'en'} [data.language]
 * @returns {Promise<{user: object, token: string}>}
 *
 * @example
 * const result = await registerUser({
 *   name: 'Ana López',
 *   email: 'ana@email.com',
 *   password: 'segura123',
 *   role: 'tourist',
 *   language: 'es'
 * });
 */
export async function registerUser(data) {
  const payload = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'tourist',
    language: data.language || 'es',
  };

  const result = await post('/auth/register', payload);

  // Guardar sesión automáticamente tras registro exitoso
  _saveSession(result.token, result.user);

  return result;
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, token: string}>}
 *
 * @example
 * const { user, token } = await loginUser('ana@email.com', 'segura123');
 */
export async function loginUser(email, password) {
  const result = await post('/auth/login', { email, password });

  _saveSession(result.token, result.user);

  return result;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Cierra la sesión actual: elimina token y datos del usuario.
 */
export function logoutUser() {
  clearAuthHeader();
  localStorage.removeItem(USER_KEY);

  // Disparar evento para que otros módulos reaccionen (ej: actualizar UI)
  window.dispatchEvent(new CustomEvent('qr:logout'));
}

// ─── Usuario actual ───────────────────────────────────────────────────────────

/**
 * Devuelve el usuario de la sesión activa desde localStorage.
 * @returns {object|null}  Objeto usuario o null si no hay sesión.
 *
 * @example
 * const user = getCurrentUser();
 * if (user) console.log(user.name, user.role);
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve el token JWT almacenado.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Verificación ─────────────────────────────────────────────────────────────

/**
 * Verifica si hay una sesión activa con token no expirado.
 * @returns {boolean}
 *
 * @example
 * if (!isAuthenticated()) {
 *   window.location.href = '/login.html';
 * }
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    // Decodificar el payload del JWT (sin verificar firma en cliente)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      // Token expirado: limpiar sesión
      logoutUser();
      return false;
    }

    return true;
  } catch {
    // Token malformado
    logoutUser();
    return false;
  }
}

/**
 * Verifica si el usuario actual tiene un rol específico.
 * @param {'tourist'|'provider'|'admin'} role
 * @returns {boolean}
 *
 * @example
 * if (!hasRole('provider')) {
 *   showToast('Solo proveedores pueden crear destinos', 'error');
 * }
 */
export function hasRole(role) {
  const user = getCurrentUser();
  return user?.role === role;
}

/**
 * Verifica si el usuario es proveedor.
 * @returns {boolean}
 */
export function isProvider() {
  return hasRole('provider');
}

/**
 * Verifica si el usuario es administrador.
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole('admin');
}

// ─── Actualizar perfil ────────────────────────────────────────────────────────

/**
 * Actualiza los datos del usuario en el servidor y en localStorage.
 * @param {object} data  Campos a actualizar (name, language, etc.)
 * @returns {Promise<object>}
 */
export async function updateProfile(data) {
  const user = getCurrentUser();
  if (!user) throw new Error('No hay sesión activa');

  const updated = await put(`/users/${user.id}`, data);

  // Actualizar el usuario guardado localmente
  _saveSession(getToken(), { ...user, ...updated });

  return updated;
}

/**
 * Refresca los datos del usuario desde el servidor.
 * Útil después de cambios de plan o verificación.
 * @returns {Promise<object>}
 */
export async function refreshUser() {
  const updated = await get('/auth/me');
  const user = getCurrentUser();
  _saveSession(getToken(), { ...user, ...updated });
  return updated;
}

// ─── Privados ─────────────────────────────────────────────────────────────────

/**
 * Guarda el token y el usuario en localStorage.
 * @param {string} token
 * @param {object} user
 */
function _saveSession(token, user) {
  setAuthHeader(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Notificar a otros módulos que hay una nueva sesión
  window.dispatchEvent(new CustomEvent('qr:login', { detail: { user } }));
}
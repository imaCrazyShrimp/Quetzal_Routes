/**
 * api.js — Quetzal Routes
 * Capa de comunicación centralizada con el backend REST.
 * Todos los módulos importan de aquí para hacer peticiones HTTP.
 */

// ─── Configuración base ───────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api'; // Cambia a tu URL de producción

// ─── Manejo de token ──────────────────────────────────────────────────────────

/**
 * Devuelve los headers estándar para todas las peticiones.
 * Si existe un token JWT en localStorage, lo incluye en Authorization.
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('qr_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Guarda el token JWT en localStorage.
 * @param {string} token
 */
export function setAuthHeader(token) {
  localStorage.setItem('qr_token', token);
}

/**
 * Elimina el token del localStorage.
 */
export function clearAuthHeader() {
  localStorage.removeItem('qr_token');
}

// ─── Manejo de errores ────────────────────────────────────────────────────────

/**
 * Procesa la respuesta HTTP y lanza un error descriptivo si no fue exitosa.
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
  if (response.ok) {
    // 204 No Content no tiene body
    if (response.status === 204) return null;
    return response.json();
  }

  let errorMessage = `Error ${response.status}: ${response.statusText}`;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch {
    // Si el body no es JSON, usamos el mensaje por defecto
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  throw error;
}

// ─── Métodos HTTP ─────────────────────────────────────────────────────────────

/**
 * GET — Obtener datos del servidor.
 * @param {string} endpoint  Ejemplo: '/destinations' o '/destinations/5'
 * @returns {Promise<any>}
 *
 * @example
 * const destinations = await get('/destinations?category=nature');
 */
export async function get(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] GET ${endpoint} falló:`, error.message);
    throw error;
  }
}

/**
 * POST — Crear un nuevo recurso.
 * @param {string} endpoint
 * @param {object} data  Objeto que se enviará como JSON
 * @returns {Promise<any>}
 *
 * @example
 * const newDest = await post('/destinations', { title: 'Lago Atitlán', ... });
 */
export async function post(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] POST ${endpoint} falló:`, error.message);
    throw error;
  }
}

/**
 * PUT — Actualizar un recurso existente.
 * @param {string} endpoint
 * @param {object} data
 * @returns {Promise<any>}
 *
 * @example
 * const updated = await put('/destinations/5', { title: 'Nuevo nombre' });
 */
export async function put(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] PUT ${endpoint} falló:`, error.message);
    throw error;
  }
}

/**
 * PATCH — Actualización parcial de un recurso.
 * @param {string} endpoint
 * @param {object} data
 * @returns {Promise<any>}
 */
export async function patch(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] PATCH ${endpoint} falló:`, error.message);
    throw error;
  }
}

/**
 * DEL — Eliminar un recurso.
 * @param {string} endpoint
 * @returns {Promise<any>}
 *
 * @example
 * await del('/destinations/5');
 */
export async function del(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] DELETE ${endpoint} falló:`, error.message);
    throw error;
  }
}

/**
 * POST con FormData — Para subir archivos (imágenes de destinos).
 * No incluye Content-Type para que el browser lo establezca con boundary.
 * @param {string} endpoint
 * @param {FormData} formData
 * @returns {Promise<any>}
 *
 * @example
 * const formData = new FormData();
 * formData.append('image', fileInput.files[0]);
 * const result = await postForm('/destinations/5/images', formData);
 */
export async function postForm(endpoint, formData) {
  const headers = {};
  const token = localStorage.getItem('qr_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] POST (form) ${endpoint} falló:`, error.message);
    throw error;
  }
}
/**
 * filters.js — Quetzal Routes
 * Filtros y ordenamiento del lado del cliente.
 * Opera sobre arrays ya cargados, sin llamadas al backend.
 * Funciones puras: no modifican el array original.
 */

// ─── Filtros individuales ─────────────────────────────────────────────────────

/**
 * Filtra destinos por categoría.
 * @param {object[]} destinations
 * @param {string} category  'nature' | 'culture' | 'adventure' | 'gastronomy' | 'wellness'
 * @returns {object[]}
 *
 * @example
 * const nature = filterByCategory(all, 'nature');
 */
export function filterByCategory(destinations, category) {
  if (!category || category === 'all') return destinations;
  return destinations.filter((d) => d.category === category);
}

/**
 * Filtra destinos por departamento/región.
 * @param {object[]} destinations
 * @param {string} department  'antigua' | 'atitlan' | 'peten' | ...
 * @returns {object[]}
 */
export function filterByDepartment(destinations, department) {
  if (!department || department === 'all') return destinations;
  return destinations.filter((d) => d.department === department);
}

/**
 * Filtra destinos por rango de precio (precio inicial del destino).
 * @param {object[]} destinations
 * @param {number} [min]  Precio mínimo en quetzales
 * @param {number} [max]  Precio máximo en quetzales
 * @returns {object[]}
 *
 * @example
 * const mid = filterByPrice(all, 100, 500);
 */
export function filterByPrice(destinations, min, max) {
  return destinations.filter((d) => {
    const price = d.price_from ?? 0;
    const aboveMin = min == null || price >= min;
    const belowMax = max == null || price <= max;
    return aboveMin && belowMax;
  });
}

/**
 * Filtra destinos por calificación mínima promedio.
 * @param {object[]} destinations
 * @param {number} minRating  1–5
 * @returns {object[]}
 *
 * @example
 * const topRated = filterByRating(all, 4);
 */
export function filterByRating(destinations, minRating) {
  if (!minRating) return destinations;
  return destinations.filter((d) => (d.avg_rating ?? 0) >= minRating);
}

/**
 * Filtra destinos por texto libre.
 * Busca en título, descripción y departamento.
 * @param {object[]} destinations
 * @param {string} query
 * @returns {object[]}
 *
 * @example
 * const results = filterByText(all, 'tikal');
 */
export function filterByText(destinations, query) {
  if (!query || query.trim() === '') return destinations;

  const q = query.toLowerCase().trim();

  return destinations.filter((d) => {
    const inTitle = (d.title || '').toLowerCase().includes(q);
    const inDescEs = (d.description_es || '').toLowerCase().includes(q);
    const inDescEn = (d.description_en || '').toLowerCase().includes(q);
    const inDept = (d.department || '').toLowerCase().includes(q);
    const inAddress = (d.address || '').toLowerCase().includes(q);
    return inTitle || inDescEs || inDescEn || inDept || inAddress;
  });
}

/**
 * Filtra solo los destinos activos (no pendientes ni pausados).
 * @param {object[]} destinations
 * @returns {object[]}
 */
export function filterByActive(destinations) {
  return destinations.filter((d) => d.status === 'active');
}

// ─── Ordenamiento ─────────────────────────────────────────────────────────────

/**
 * Ordena destinos de mayor a menor calificación promedio.
 * @param {object[]} destinations
 * @returns {object[]}  Nuevo array ordenado (no muta el original)
 */
export function sortByRating(destinations) {
  return [...destinations].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
}

/**
 * Ordena destinos del más nuevo al más antiguo.
 * @param {object[]} destinations
 * @returns {object[]}
 */
export function sortByNewest(destinations) {
  return [...destinations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

/**
 * Ordena destinos por precio ascendente (más barato primero).
 * @param {object[]} destinations
 * @returns {object[]}
 */
export function sortByPriceAsc(destinations) {
  return [...destinations].sort((a, b) => (a.price_from ?? 0) - (b.price_from ?? 0));
}

/**
 * Ordena destinos por precio descendente (más caro primero).
 * @param {object[]} destinations
 * @returns {object[]}
 */
export function sortByPriceDesc(destinations) {
  return [...destinations].sort((a, b) => (b.price_from ?? 0) - (a.price_from ?? 0));
}

/**
 * Ordena destinos por nombre alfabéticamente.
 * @param {object[]} destinations
 * @returns {object[]}
 */
export function sortByName(destinations) {
  return [...destinations].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

// ─── Aplicar todos los filtros de una vez ─────────────────────────────────────

/**
 * Aplica un conjunto de filtros y un criterio de ordenamiento en un solo paso.
 * Es la función principal que usa el explorador de destinos.
 *
 * @param {object[]} destinations  Array completo de destinos
 * @param {object} filters
 * @param {string}  [filters.category]
 * @param {string}  [filters.department]
 * @param {number}  [filters.price_min]
 * @param {number}  [filters.price_max]
 * @param {number}  [filters.rating_min]
 * @param {string}  [filters.text]
 * @param {string}  [filters.sort]   'rating' | 'newest' | 'price_asc' | 'price_desc' | 'name'
 * @returns {object[]}
 *
 * @example
 * const results = applyFilters(allDestinations, {
 *   category: 'nature',
 *   department: 'atitlan',
 *   price_min: 100,
 *   price_max: 500,
 *   rating_min: 4,
 *   sort: 'rating',
 * });
 */
export function applyFilters(destinations, filters = {}) {
  let result = [...destinations];

  // Aplicar filtros en orden (primero los que descartan más resultados)
  if (filters.category)   result = filterByCategory(result, filters.category);
  if (filters.department) result = filterByDepartment(result, filters.department);
  if (filters.price_min != null || filters.price_max != null) {
    result = filterByPrice(result, filters.price_min, filters.price_max);
  }
  if (filters.rating_min) result = filterByRating(result, filters.rating_min);
  if (filters.text)       result = filterByText(result, filters.text);

  // Ordenar
  switch (filters.sort) {
    case 'rating':     result = sortByRating(result);    break;
    case 'newest':     result = sortByNewest(result);    break;
    case 'price_asc':  result = sortByPriceAsc(result);  break;
    case 'price_desc': result = sortByPriceDesc(result); break;
    case 'name':       result = sortByName(result);      break;
    default:           result = sortByRating(result);    break; // default: mejor calificación
  }

  return result;
}

// ─── Paginación ───────────────────────────────────────────────────────────────

/**
 * Divide un array en páginas.
 * @param {object[]} items
 * @param {number} page    Número de página (empieza en 1)
 * @param {number} limit   Elementos por página
 * @returns {{ items: object[], total: number, page: number, totalPages: number }}
 *
 * @example
 * const { items, totalPages } = paginate(filtered, 2, 12);
 */
export function paginate(items, page = 1, limit = 12) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: items.slice(start, end),
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ─── Estadísticas rápidas ─────────────────────────────────────────────────────

/**
 * Calcula el precio mínimo y máximo de un array de destinos.
 * Útil para configurar los sliders de precio dinámicamente.
 * @param {object[]} destinations
 * @returns {{ min: number, max: number }}
 */
export function getPriceRange(destinations) {
  if (!destinations.length) return { min: 0, max: 0 };

  const prices = destinations.map((d) => d.price_from ?? 0).filter((p) => p > 0);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Cuenta cuántos destinos hay por categoría.
 * Útil para mostrar badges con conteo en los botones de filtro.
 * @param {object[]} destinations
 * @returns {object}  Ejemplo: { nature: 5, culture: 3, adventure: 8 }
 */
export function countByCategory(destinations) {
  return destinations.reduce((acc, d) => {
    const cat = d.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Cuenta cuántos destinos hay por departamento.
 * @param {object[]} destinations
 * @returns {object}  Ejemplo: { atitlan: 7, antigua: 4 }
 */
export function countByDepartment(destinations) {
  return destinations.reduce((acc, d) => {
    const dept = d.department || 'other';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
}
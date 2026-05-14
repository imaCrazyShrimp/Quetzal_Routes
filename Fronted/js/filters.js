/* ============================================================
   QUETZAL ROUTES — filters.js
   Funciones puras de filtrado y ordenamiento sobre arrays
   de destinos. No tocan el DOM — solo reciben datos y
   devuelven datos. El HTML/explore.html los consume.
   ============================================================ */


// ════════════════════════════════════════════════════════════════
// FILTROS INDIVIDUALES
// ════════════════════════════════════════════════════════════════

/**
 * Filtra destinos por categoría.
 * @param {Array}  destinations
 * @param {string} category - 'nature' | 'culture' | 'adventure' | 'gastronomy' | 'wellness'
 * @returns {Array}
 */
export function filterByCategory(destinations, category) {
  if (!category) return destinations;
  return destinations.filter(d => d.category === category);
}

/**
 * Filtra destinos por uno o varios departamentos.
 * @param {Array}          destinations
 * @param {string|Array}   department - string o array de strings
 * @returns {Array}
 */
export function filterByDepartment(destinations, department) {
  if (!department || (Array.isArray(department) && department.length === 0)) {
    return destinations;
  }

  const depts = Array.isArray(department)
    ? department.map(d => d.toLowerCase())
    : [department.toLowerCase()];

  return destinations.filter(d =>
    depts.some(dept => d.department.toLowerCase().includes(dept))
  );
}

/**
 * Filtra destinos por rango de precio.
 * @param {Array}  destinations
 * @param {number} min - precio mínimo en Quetzales
 * @param {number} max - precio máximo en Quetzales
 * @returns {Array}
 */
export function filterByPrice(destinations, min = 0, max = Infinity) {
  return destinations.filter(d => {
    const price = d.price_from ?? 0;
    return price >= min && price <= max;
  });
}

/**
 * Filtra destinos por calificación mínima.
 * @param {Array}  destinations
 * @param {number} minRating - valor entre 1 y 5
 * @returns {Array}
 */
export function filterByRating(destinations, minRating = 0) {
  if (!minRating) return destinations;
  return destinations.filter(d => (d.rating_avg ?? 0) >= minRating);
}

/**
 * Filtra destinos por texto libre.
 * Busca en título (ES/EN), descripción y departamento.
 * @param {Array}  destinations
 * @param {string} query
 * @returns {Array}
 */
export function filterByQuery(destinations, query) {
  if (!query || !query.trim()) return destinations;

  const q = query.trim().toLowerCase();

  return destinations.filter(d =>
    (d.title          && d.title.toLowerCase().includes(q))          ||
    (d.title_en       && d.title_en.toLowerCase().includes(q))       ||
    (d.description_es && d.description_es.toLowerCase().includes(q)) ||
    (d.description_en && d.description_en.toLowerCase().includes(q)) ||
    (d.department     && d.department.toLowerCase().includes(q))     ||
    (d.category       && d.category.toLowerCase().includes(q))
  );
}


// ════════════════════════════════════════════════════════════════
// ORDENAMIENTO
// ════════════════════════════════════════════════════════════════

/**
 * Ordena destinos por calificación (mayor primero).
 * @param {Array} destinations
 * @returns {Array} nuevo array ordenado
 */
export function sortByRating(destinations) {
  return [...destinations].sort((a, b) =>
    (b.rating_avg ?? 0) - (a.rating_avg ?? 0)
  );
}

/**
 * Ordena destinos por precio ascendente (menor primero).
 * @param {Array} destinations
 * @returns {Array} nuevo array ordenado
 */
export function sortByPriceAsc(destinations) {
  return [...destinations].sort((a, b) =>
    (a.price_from ?? 0) - (b.price_from ?? 0)
  );
}

/**
 * Ordena destinos por precio descendente (mayor primero).
 * @param {Array} destinations
 * @returns {Array} nuevo array ordenado
 */
export function sortByPriceDesc(destinations) {
  return [...destinations].sort((a, b) =>
    (b.price_from ?? 0) - (a.price_from ?? 0)
  );
}

/**
 * Ordena destinos por fecha de creación (más recientes primero).
 * @param {Array} destinations
 * @returns {Array} nuevo array ordenado
 */
export function sortByNewest(destinations) {
  return [...destinations].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * Ordena destinos: destacados primero, luego por rating.
 * @param {Array} destinations
 * @returns {Array} nuevo array ordenado
 */
export function sortByFeatured(destinations) {
  return [...destinations].sort((a, b) => {
    if (b.featured && !a.featured) return 1;
    if (a.featured && !b.featured) return -1;
    return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
  });
}

/**
 * Aplica un criterio de ordenamiento por nombre.
 * @param {Array}  destinations
 * @param {'featured'|'rating'|'price_asc'|'price_desc'|'newest'} sortKey
 * @returns {Array}
 */
export function sortBy(destinations, sortKey) {
  switch (sortKey) {
    case 'rating':     return sortByRating(destinations);
    case 'price_asc':  return sortByPriceAsc(destinations);
    case 'price_desc': return sortByPriceDesc(destinations);
    case 'newest':     return sortByNewest(destinations);
    case 'featured':
    default:           return sortByFeatured(destinations);
  }
}


// ════════════════════════════════════════════════════════════════
// FILTRO COMBINADO
// ════════════════════════════════════════════════════════════════

/**
 * Aplica todos los filtros y el ordenamiento de una sola vez.
 * Es el método principal que usa explore.html al cargar datos.
 *
 * @param {Array}  destinations  - array completo desde api.js
 * @param {Object} filters
 * @param {string}        [filters.query]      - texto de búsqueda
 * @param {string}        [filters.category]   - categoría seleccionada
 * @param {string|Array}  [filters.department] - departamento(s)
 * @param {number}        [filters.minPrice]   - precio mínimo
 * @param {number}        [filters.maxPrice]   - precio máximo
 * @param {number}        [filters.minRating]  - calificación mínima
 * @param {string}        [filters.sort]       - criterio de orden
 * @returns {Array}
 */
export function applyAllFilters(destinations, filters = {}) {
  let result = [...destinations];

  if (filters.query)      result = filterByQuery(result, filters.query);
  if (filters.category)   result = filterByCategory(result, filters.category);
  if (filters.department) result = filterByDepartment(result, filters.department);

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    result = filterByPrice(
      result,
      filters.minPrice ?? 0,
      filters.maxPrice ?? Infinity
    );
  }

  if (filters.minRating) result = filterByRating(result, filters.minRating);

  result = sortBy(result, filters.sort || 'featured');

  return result;
}


// ════════════════════════════════════════════════════════════════
// PAGINACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Divide un array en páginas.
 * @param {Array}  items       - array completo ya filtrado
 * @param {number} page        - página actual (base 1)
 * @param {number} perPage     - items por página (default 9)
 * @returns {{ items: Array, total: number, totalPages: number, page: number }}
 */
export function paginate(items, page = 1, perPage = 9) {
  const total      = items.length;
  const totalPages = Math.ceil(total / perPage);
  const safePage   = Math.max(1, Math.min(page, totalPages || 1));
  const start      = (safePage - 1) * perPage;
  const end        = start + perPage;

  return {
    items:      items.slice(start, end),
    total,
    totalPages,
    page:       safePage,
  };
}


// ════════════════════════════════════════════════════════════════
// HELPERS DE URL
// ════════════════════════════════════════════════════════════════

/**
 * Lee los filtros activos desde los parámetros de la URL actual.
 * Útil para sincronizar estado al cargar explore.html.
 * @returns {Object} filtros extraídos de la URL
 */
export function getFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  return {
    query:      params.get('q')       || '',
    category:   params.get('cat')     || '',
    department: params.get('dept')    || '',
    minPrice:   Number(params.get('minPrice')) || 0,
    maxPrice:   Number(params.get('maxPrice')) || 1000,
    minRating:  Number(params.get('rating'))   || 0,
    sort:       params.get('sort')    || 'featured',
    page:       Number(params.get('page'))     || 1,
  };
}

/**
 * Serializa un objeto de filtros como query string.
 * Útil para actualizar la URL sin recargar la página.
 * @param {Object} filters
 * @returns {string} query string (sin el '?')
 */
export function filtersToQueryString(filters = {}) {
  const params = new URLSearchParams();

  if (filters.query)      params.set('q',        filters.query);
  if (filters.category)   params.set('cat',      filters.category);
  if (filters.department) params.set('dept',     filters.department);
  if (filters.minPrice)   params.set('minPrice', filters.minPrice);
  if (filters.maxPrice && filters.maxPrice < 1000)
                          params.set('maxPrice', filters.maxPrice);
  if (filters.minRating)  params.set('rating',   filters.minRating);
  if (filters.sort && filters.sort !== 'featured')
                          params.set('sort',     filters.sort);
  if (filters.page && filters.page > 1)
                          params.set('page',     filters.page);

  return params.toString();
}

/**
 * Actualiza la URL del navegador con los filtros activos
 * sin recargar la página (history.pushState).
 * @param {Object} filters
 */
export function syncFiltersToURL(filters = {}) {
  const qs  = filtersToQueryString(filters);
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  history.replaceState(null, '', url);
}
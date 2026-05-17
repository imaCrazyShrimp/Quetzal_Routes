/* ============================================================
   QUETZAL ROUTES — explore.js  (Frontend)
   Orquestador de explore.html.
   Carga destinos reales desde db.json, aplica filtros en
   memoria y renderiza cards dinámicas con paginación real.

   USO en explore.html:
     <script type="module" src="../js/explore.js"></script>
   ============================================================ */

import { getAllDestinations, getCategories, getDepartments } from './api.js';
import { applyFilters, sortDestinations, paginate }         from './filters.js';
import { renderCards, showToast, toggleLoader }              from './ui.js';


// ════════════════════════════════════════════════════════════════
// ESTADO — fuente de verdad de filtros activos
// ════════════════════════════════════════════════════════════════
const _state = {
  all:       [],       // todos los destinos de db.json
  filtered:  [],       // resultado tras aplicar filtros
  page:      1,
  pageSize:  12,
  filters: {
    query:    '',
    category: '',
    depts:    [],
    priceMin: 0,
    priceMax: 2000,
    rating:   0,
    sort:     'featured',
  },
  view: 'grid',        // 'grid' | 'list'
};


// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════

async function init() {
  _initNavbar();
  _readURL();           // leer filtros previos de la URL
  _syncUIWithState();   // pintar los controles con esos valores

  try {
    toggleLoader('resultsGrid', true);
    _state.all = await getAllDestinations();
    toggleLoader('resultsGrid', false);
  } catch (err) {
    console.error('[explore.js] Error cargando destinos:', err);
    showToast('Error al cargar los destinos. Recarga la página.', 'error');
    toggleLoader('resultsGrid', false);
    return;
  }

  _bindAll();
  _applyAndRender();
}


// ════════════════════════════════════════════════════════════════
// APLICAR FILTROS Y RENDERIZAR
// ════════════════════════════════════════════════════════════════

function _applyAndRender() {
  const { filters, all } = _state;

  // 1. Filtrar
  let result = applyFilters(all, {
    text:       filters.query,
    category:   filters.category,
    departments: filters.depts,
    priceMin:   filters.priceMin,
    priceMax:   filters.priceMax,
    minRating:  filters.rating,
  });

  // 2. Ordenar
  result = sortDestinations(result, filters.sort);

  _state.filtered = result;
  _state.page     = 1;

  _renderPage();
  _renderActiveFilterTags();
  _pushToURL();
}

function _renderPage() {
  const lang = localStorage.getItem('qr_lang') || 'es';
  const { items, total, page, totalPages, hasNext, hasPrev } =
    paginate(_state.filtered, _state.page, _state.pageSize);

  // Contador de resultados
  const countEl = document.getElementById('resultsNumber');
  if (countEl) countEl.textContent = total;

  // Empty state
  const emptyEl = document.getElementById('resultsEmpty');
  if (emptyEl) emptyEl.classList.toggle('hidden', total > 0);

  // Grid de cards
  const grid = document.getElementById('resultsGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = '';
  } else {
    const view = _state.view;
    grid.className = view === 'list' ? 'results-list' : 'results-grid';
    renderCards('resultsGrid', items, lang);

    // Hacer las cards clickeables
    grid.querySelectorAll('[data-id]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-favorite')) return;
        window.location.href = `destination.html?id=${card.dataset.id}`;
      });
    });
  }

  _renderPagination(page, totalPages, hasNext, hasPrev);
}

function _renderPagination(page, totalPages, hasNext, hasPrev) {
  const el = document.getElementById('pagination');
  if (!el) return;

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const pages = _pageRange(page, totalPages);

  el.innerHTML = `
    <div class="pagination-controls">
      <button class="page-btn" ${!hasPrev ? 'disabled' : ''} data-go="${page - 1}">← Anterior</button>
      ${pages.map(p => p === '…'
        ? `<span class="page-dots">…</span>`
        : `<button class="page-btn ${p === page ? 'active' : ''}" data-go="${p}">${p}</button>`
      ).join('')}
      <button class="page-btn" ${!hasNext ? 'disabled' : ''} data-go="${page + 1}">Siguiente →</button>
    </div>`;

  el.querySelectorAll('[data-go]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.page = parseInt(btn.dataset.go);
      _renderPage();
      document.getElementById('resultsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


// ════════════════════════════════════════════════════════════════
// BIND DE TODOS LOS CONTROLES
// ════════════════════════════════════════════════════════════════

function _bindAll() {
  _bindSearch();
  _bindCategoryChips();
  _bindDeptCheckboxes();
  _bindPriceRange();
  _bindPricePresets();
  _bindRating();
  _bindSort();
  _bindViewToggle();
  _bindClearFilters();
}

function _bindSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  const form  = document.getElementById('searchForm');

  let debounce;

  const doSearch = () => {
    _state.filters.query = input?.value.trim() || '';
    clear?.classList.toggle('hidden', !_state.filters.query);
    _applyAndRender();
  };

  input?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(doSearch, 320);
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounce);
    doSearch();
  });

  clear?.addEventListener('click', () => {
    if (input) input.value = '';
    _state.filters.query = '';
    clear.classList.add('hidden');
    _applyAndRender();
  });
}

function _bindCategoryChips() {
  document.querySelectorAll('.chip-category').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.cat || '';
      _state.filters.category = _state.filters.category === val ? '' : val;
      document.querySelectorAll('.chip-category').forEach(c =>
        c.classList.toggle('active', c.dataset.cat === _state.filters.category)
      );
      _applyAndRender();
    });
  });
}

function _bindDeptCheckboxes() {
  document.querySelectorAll('input[name="dept"]').forEach(input => {
    input.addEventListener('change', () => {
      _state.filters.depts = Array.from(
        document.querySelectorAll('input[name="dept"]:checked')
      ).map(i => i.value);
      _applyAndRender();
    });
  });
}

function _bindPriceRange() {
  const rangeMin = document.getElementById('priceRangeMin');
  const rangeMax = document.getElementById('priceRangeMax');
  const labelMin = document.getElementById('priceMin');
  const labelMax = document.getElementById('priceMax');

  rangeMin?.addEventListener('input', () => {
    const val = Math.min(parseInt(rangeMin.value), parseInt(rangeMax?.value || 2000) - 50);
    rangeMin.value = val;
    _state.filters.priceMin = val;
    if (labelMin) labelMin.textContent = val;
    _applyAndRender();
  });

  rangeMax?.addEventListener('input', () => {
    const val = Math.max(parseInt(rangeMax.value), parseInt(rangeMin?.value || 0) + 50);
    rangeMax.value = val;
    _state.filters.priceMax = val;
    if (labelMax) labelMax.textContent = val;
    _applyAndRender();
  });
}

function _bindPricePresets() {
  document.querySelectorAll('.price-presets .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const min = parseInt(btn.dataset.min || 0);
      const max = parseInt(btn.dataset.max || 2000);
      _state.filters.priceMin = min;
      _state.filters.priceMax = max;
      const rangeMin = document.getElementById('priceRangeMin');
      const rangeMax = document.getElementById('priceRangeMax');
      if (rangeMin) rangeMin.value = min;
      if (rangeMax) rangeMax.value = max;
      const labelMin = document.getElementById('priceMin');
      const labelMax = document.getElementById('priceMax');
      if (labelMin) labelMin.textContent = min;
      if (labelMax) labelMax.textContent = max;
      _applyAndRender();
    });
  });
}

function _bindRating() {
  document.querySelectorAll('input[name="rating"]').forEach(input => {
    input.addEventListener('change', () => {
      _state.filters.rating = parseFloat(input.value) || 0;
      _applyAndRender();
    });
  });
}

function _bindSort() {
  const sortEl = document.getElementById('sortSelect');
  sortEl?.addEventListener('change', () => {
    _state.filters.sort = sortEl.value;
    _applyAndRender();
  });
}

function _bindViewToggle() {
  document.getElementById('viewGrid')?.addEventListener('click', () => {
    _state.view = 'grid';
    _renderPage();
  });
  document.getElementById('viewList')?.addEventListener('click', () => {
    _state.view = 'list';
    _renderPage();
  });
}

function _bindClearFilters() {
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    _state.filters = { query:'', category:'', depts:[], priceMin:0, priceMax:2000, rating:0, sort:'featured' };
    _syncUIWithState();
    _applyAndRender();
  });
}


// ════════════════════════════════════════════════════════════════
// TAGS DE FILTROS ACTIVOS
// ════════════════════════════════════════════════════════════════

function _renderActiveFilterTags() {
  const container = document.getElementById('filtersActive');
  if (!container) return;

  container.innerHTML = '';
  const { filters } = _state;

  if (filters.category) {
    _addTag(container, `Categoría: ${filters.category}`, () => {
      _state.filters.category = '';
      document.querySelectorAll('.chip-category').forEach(c => c.classList.remove('active'));
      _applyAndRender();
    });
  }

  filters.depts.forEach(d => {
    _addTag(container, `Región: ${d}`, () => {
      _state.filters.depts = _state.filters.depts.filter(x => x !== d);
      const check = document.querySelector(`input[name="dept"][value="${d}"]`);
      if (check) check.checked = false;
      _applyAndRender();
    });
  });

  if (filters.priceMin > 0 || filters.priceMax < 2000) {
    _addTag(container, `Q${filters.priceMin}–Q${filters.priceMax}`, () => {
      _state.filters.priceMin = 0;
      _state.filters.priceMax = 2000;
      const rMin = document.getElementById('priceRangeMin');
      const rMax = document.getElementById('priceRangeMax');
      if (rMin) rMin.value = 0;
      if (rMax) rMax.value = 2000;
      document.getElementById('priceMin') && (document.getElementById('priceMin').textContent = 0);
      document.getElementById('priceMax') && (document.getElementById('priceMax').textContent = 2000);
      _applyAndRender();
    });
  }

  if (filters.rating > 0) {
    _addTag(container, `★ ${filters.rating}+`, () => {
      _state.filters.rating = 0;
      document.querySelectorAll('input[name="rating"]').forEach(i => i.checked = false);
      _applyAndRender();
    });
  }
}

function _addTag(container, label, onRemove) {
  const tag = document.createElement('span');
  tag.className = 'active-filter-tag';
  tag.innerHTML = `${label} <button aria-label="Quitar filtro">✕</button>`;
  tag.querySelector('button').addEventListener('click', onRemove);
  container.appendChild(tag);
}


// ════════════════════════════════════════════════════════════════
// URL — sincronizar filtros con ?params para compartir búsquedas
// ════════════════════════════════════════════════════════════════

function _readURL() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('q'))    _state.filters.query    = p.get('q');
  if (p.get('cat'))  _state.filters.category = p.get('cat');
  if (p.get('dept')) _state.filters.depts    = p.get('dept').split(',');
  if (p.get('sort')) _state.filters.sort     = p.get('sort');
}

function _pushToURL() {
  const { filters } = _state;
  const p = new URLSearchParams();
  if (filters.query)            p.set('q',    filters.query);
  if (filters.category)         p.set('cat',  filters.category);
  if (filters.depts.length)     p.set('dept', filters.depts.join(','));
  if (filters.sort !== 'featured') p.set('sort', filters.sort);
  history.replaceState(null, '', `?${p.toString()}`);
}


// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function _syncUIWithState() {
  const { filters } = _state;

  // Búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = filters.query;

  // Categoría
  document.querySelectorAll('.chip-category').forEach(c =>
    c.classList.toggle('active', c.dataset.cat === filters.category)
  );

  // Departamentos
  document.querySelectorAll('input[name="dept"]').forEach(i => {
    i.checked = filters.depts.includes(i.value);
  });

  // Sort
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = filters.sort;
}

function _initNavbar() {
  const navToggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
  });
}

function _pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set    = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}


// ════════════════════════════════════════════════════════════════
// ARRANCAR
// ════════════════════════════════════════════════════════════════
init();

/* ============================================================
   QUETZAL ROUTES — dashboard.js  (Frontend)
   Orquestador de dashboard-provider.html.
   Extrae y mejora el script inline existente:
   - Formulario "crear destino" con validación real
   - Editar / pausar destinos
   - Formulario de perfil con guardado en localStorage
   - Sección de planes con info clara
   - Stats calculadas desde datos reales

   USO en dashboard-provider.html:
     <script type="module" src="../js/dashboard.js"></script>
   ============================================================ */

import { getCurrentUser, requireAuth, logoutUser }            from './auth.js';
import {
  getDestinationsByProvider,
  getBookingsByProvider,
  getProviderById,
  getSubscriptionByProvider,
}                                                             from './api.js';
import { showToast, formatPrice }                             from './ui.js';


// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════

async function init() {
  // Proteger la ruta — solo proveedores
  requireAuth('provider');

  const user = getCurrentUser();

  // Cargar datos del proveedor
  // En producción: buscar provider cuyo user_id === user.id
  // En mock: usamos el primer provider que matchea, o id=1 como fallback
  const provider = await _loadProvider(user);
  const planId   = provider?.plan || 'free';

  _fillProviderUI(user, provider, planId);

  // Cargar destinos y reservas en paralelo
  const [destinations, bookings] = await Promise.all([
    getDestinationsByProvider(provider?.id || 1).catch(() => []),
    getBookingsByProvider(provider?.id || 1).catch(() => []),
  ]);

  _renderDestinationsOverview(destinations);
  _renderDestinationsTable(destinations);
  _renderBookingsTable(bookings, destinations);
  _updateStats(destinations, bookings);

  // Bind de navegación y formularios
  _bindNavigation();
  _bindLogout();
  _bindCreateDestForm(planId, destinations.length);
  _bindProfileForm(user, provider);
  _bindPlanButtons(planId);
  _bindDestStatusFilter();
  _bindSidebarMobile();

  // Leer hash de URL para ir a una sección directa
  if (window.location.hash) {
    _goTo(window.location.hash.replace('#', ''));
  }
}


// ════════════════════════════════════════════════════════════════
// CARGA DE DATOS
// ════════════════════════════════════════════════════════════════

async function _loadProvider(user) {
  try {
    // Intentar por user_id (cuando exista el endpoint)
    const p = await getProviderById(1); // TODO: buscar por user.id en backend real
    return p;
  } catch {
    return null;
  }
}


// ════════════════════════════════════════════════════════════════
// PINTAR UI DEL PROVEEDOR
// ════════════════════════════════════════════════════════════════

function _fillProviderUI(user, provider, planId) {
  const name = provider?.business_name || user?.name || 'Mi empresa';
  const plan = planId;

  _setText('navProviderName',       name);
  _setText('sidebarProviderName',   name);
  _setText('overviewTitle',         `Hola, ${name} 👋`);
  _setText('profileBusinessName',   name);
  _setText('profileEmail',          user?.email || '');
  _setText('currentPlanName',       plan.toUpperCase());
  _setText('planExpiry',            provider?.plan_expiry || '—');

  // Avatar con iniciales
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  _setText('profileAvatar', initials);

  // Pre-rellenar el form de perfil
  const profileBusinessInput = document.getElementById('profileBusinessInput');
  const profileEmailInput    = document.getElementById('profileEmailInput');
  const profileWhatsappInput = document.getElementById('profileWhatsappInput');
  const profileDescInput     = document.getElementById('profileDescInput');

  if (profileBusinessInput) profileBusinessInput.value = name;
  if (profileEmailInput)    profileEmailInput.value    = user?.email || '';
  if (profileWhatsappInput) profileWhatsappInput.value = provider?.whatsapp || '';
  if (profileDescInput)     profileDescInput.value     = provider?.description_es || '';

  // Badge de plan en sidebar
  const planBadge = document.getElementById('sidebarPlanBadge');
  if (planBadge) {
    planBadge.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    planBadge.className   = `dash-plan-badge ${plan}`;
  }

  // Marcar plan actual en la sección de planes
  ['free', 'premium', 'elite'].forEach(p => {
    const btn = document.getElementById(`${p}Btn`);
    if (!btn) return;
    if (p === plan) {
      btn.textContent = 'Plan actual ✓';
      btn.disabled    = true;
      btn.classList.add('btn-current');
    }
  });
}


// ════════════════════════════════════════════════════════════════
// TABLAS DE DESTINOS
// ════════════════════════════════════════════════════════════════

function _renderDestinationsOverview(destinations) {
  const el = document.getElementById('overviewDestTable');
  if (!el) return;

  if (!destinations.length) {
    el.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gris-texto);padding:2rem">
      Aún no tienes destinos publicados.
      <a href="#" data-section="new-dest" style="color:var(--verde-quetzal);font-weight:700">Crear el primero →</a>
    </td></tr>`;
    return;
  }

  el.innerHTML = destinations.slice(0, 3).map(d => _destRow(d, false)).join('');
  _bindDestRowActions();
}

function _renderDestinationsTable(destinations) {
  const el = document.getElementById('destTable');
  if (!el) return;

  _setText('destTableCount', `${destinations.length} destino${destinations.length !== 1 ? 's' : ''}`);

  if (!destinations.length) {
    el.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--gris-texto);padding:2rem">
      No tienes destinos publicados aún.
    </td></tr>`;
    return;
  }

  el.innerHTML = destinations.map(d => _destRow(d, true)).join('');
  _bindDestRowActions();
}

function _destRow(d, withReviews = true) {
  const img = d.cover_image
    ? `<img class="dest-cell-img" src="${d.cover_image}" alt="${d.title}" />`
    : `<div class="dest-cell-img" style="background:var(--gris-claro);display:flex;align-items:center;justify-content:center">🗺️</div>`;

  return `
    <tr data-dest-id="${d.id}">
      <td>
        <div class="dest-cell">
          ${img}
          <div>
            <div class="dest-cell-name">${d.title}</div>
            <div class="dest-cell-cat">${d.category || ''}</div>
          </div>
        </div>
      </td>
      <td>${d.department || '—'}</td>
      <td>Q${d.price_from ?? '—'}</td>
      <td>★ ${d.rating_avg ?? '—'}</td>
      ${withReviews ? `<td>${d.reviews_count ?? 0}</td>` : ''}
      <td>${_statusBadge(d.status)}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn" data-dest-action="view"   data-id="${d.id}">Ver</button>
          <button class="table-btn" data-dest-action="edit"   data-id="${d.id}">Editar</button>
          <button class="table-btn ${d.status === 'active' ? 'warning' : 'primary'}"
                  data-dest-action="toggle" data-id="${d.id}" data-status="${d.status}">
            ${d.status === 'active' ? 'Pausar' : 'Activar'}
          </button>
        </div>
      </td>
    </tr>`;
}

function _bindDestRowActions() {
  document.querySelectorAll('[data-dest-action]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const action = btn.dataset.destAction;
      const id     = btn.dataset.id;
      const status = btn.dataset.status;

      switch (action) {
        case 'view':
          window.open(`destination.html?id=${id}`, '_blank');
          break;
        case 'edit':
          // TODO con backend: abrir modal de edición con los datos del destino
          showToast('El editor de destinos estará disponible con el backend conectado. 🚧', 'info');
          break;
        case 'toggle':
          // TODO con backend: PATCH /destinations/:id { status: 'inactive'|'active' }
          const newStatus = status === 'active' ? 'pausado' : 'activado';
          showToast(`Destino ${newStatus}. Esta acción se guardará cuando el backend esté conectado. 🚧`, 'warning');
          break;
      }
    });
  });
}


// ════════════════════════════════════════════════════════════════
// TABLA DE RESERVAS
// ════════════════════════════════════════════════════════════════

function _renderBookingsTable(bookings, destinations) {
  const el = document.getElementById('bookingsTable');
  if (!el) return;

  if (!bookings.length) {
    el.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--gris-texto);padding:2rem">
      No tienes reservas aún. Cuando un turista reserve, aparecerá aquí.
    </td></tr>`;
    return;
  }

  el.innerHTML = bookings.map(b => {
    const dest = destinations.find(d => d.id === b.destination_id);
    return `
      <tr>
        <td>#${b.id}</td>
        <td>${dest?.title || `Destino #${b.destination_id}`}</td>
        <td>Turista #${b.user_id}</td>
        <td>${b.date_requested || '—'}</td>
        <td style="text-align:center">${b.people_count}</td>
        <td>Q${b.total_amount ?? ((dest?.price_from || 0) * b.people_count)}</td>
        <td>${_bookingStatusBadge(b.status)}</td>
        <td>
          <div class="table-actions">
            ${b.status === 'pending'
              ? `<button class="table-btn primary" data-booking-action="confirm" data-id="${b.id}">Confirmar</button>
                 <button class="table-btn danger"  data-booking-action="cancel"  data-id="${b.id}">Cancelar</button>`
              : '—'
            }
          </div>
        </td>
      </tr>`;
  }).join('');

  // Bind acciones de reserva
  document.querySelectorAll('[data-booking-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bookingAction;
      const id     = btn.dataset.id;
      // TODO con backend: PATCH /bookings/:id { status: 'confirmed'|'cancelled' }
      showToast(
        action === 'confirm'
          ? `Reserva #${id} confirmada. Se notificará al turista. 🚧 (Requiere backend)`
          : `Reserva #${id} cancelada. 🚧 (Requiere backend)`,
        action === 'confirm' ? 'success' : 'warning'
      );
    });
  });
}


// ════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════

function _updateStats(destinations, bookings) {
  const activeCount   = destinations.filter(d => d.status === 'active').length;
  const bookingCount  = bookings.length;
  const confirmedBkgs = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const totalViews    = destinations.reduce((s, d) => s + (d.views_count || 0), 0);
  const avgRating     = destinations.length
    ? (destinations.reduce((s, d) => s + (d.rating_avg || 0), 0) / destinations.length).toFixed(1)
    : '—';

  _setText('statDestinations', activeCount);
  _setText('statBookings',     bookingCount);
  _setText('statViews',        totalViews || '—');
  _setText('statRating',       avgRating);
}


// ════════════════════════════════════════════════════════════════
// FORMULARIO: CREAR DESTINO
// ════════════════════════════════════════════════════════════════

const PLAN_LIMITS = {
  free:    1,
  premium: 5,
  elite:   Infinity,
};

function _bindCreateDestForm(planId, currentCount) {
  const form = document.getElementById('createDestForm');
  const btn  = document.getElementById('createDestBtn');
  if (!form) return;

  const limit = PLAN_LIMITS[planId] ?? 1;

  // Bloquear si ya llegó al límite
  if (currentCount >= limit) {
    if (btn) {
      btn.textContent = `Límite de tu plan alcanzado (${currentCount}/${limit})`;
      btn.disabled    = true;
    }
    const notice = document.createElement('div');
    notice.className = 'info-notice';
    notice.innerHTML = `
      <p>⚠️ Tu plan <strong>${planId.toUpperCase()}</strong> permite máximo <strong>${limit}</strong> destino${limit !== 1 ? 's' : ''}.
      <a href="#" data-section="plans" style="color:var(--verde-quetzal)">Upgradea tu plan →</a></p>`;
    form.insertAdjacentElement('beforebegin', notice);
    notice.querySelector('[data-section]')?.addEventListener('click', (e) => {
      e.preventDefault();
      _goTo('plans');
    });
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn) { btn.textContent = 'Publicando...'; btn.disabled = true; }

    // Validación básica de campos obligatorios
    const title    = document.getElementById('newDestTitle')?.value.trim();
    const category = document.getElementById('newDestCategory')?.value;
    const dept     = document.getElementById('newDestDept')?.value;
    const price    = document.getElementById('newDestPrice')?.value;
    const desc     = document.getElementById('newDestDesc')?.value.trim();

    if (!title || !category || !dept || !price || !desc) {
      showToast('Completa todos los campos obligatorios.', 'warning');
      if (btn) { btn.textContent = 'Publicar destino'; btn.disabled = false; }
      return;
    }

    // Simular envío (con backend: POST /destinations)
    await new Promise(r => setTimeout(r, 1200));

    showToast('¡Destino enviado! Estará visible tras la aprobación del admin. 🎉', 'success');
    if (btn) { btn.textContent = 'Publicar destino'; btn.disabled = false; }
    form.reset();
    _goTo('destinations');
  });
}


// ════════════════════════════════════════════════════════════════
// FORMULARIO: PERFIL
// ════════════════════════════════════════════════════════════════

function _bindProfileForm(user, provider) {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }

    const updatedName = document.getElementById('profileBusinessInput')?.value.trim();
    const updatedDesc = document.getElementById('profileDescInput')?.value.trim();
    const updatedWa   = document.getElementById('profileWhatsappInput')?.value.trim();

    // Guardar cambios en localStorage mientras no hay backend
    const session = JSON.parse(localStorage.getItem('qr_user') || '{}');
    if (updatedName) session.name = updatedName;
    localStorage.setItem('qr_user', JSON.stringify(session));

    // TODO con backend: PATCH /providers/:id { business_name, description_es, whatsapp }
    await new Promise(r => setTimeout(r, 800));

    showToast('Perfil actualizado correctamente ✓', 'success');
    _setText('sidebarProviderName', updatedName);
    _setText('navProviderName',     updatedName);

    if (btn) { btn.textContent = 'Guardar cambios'; btn.disabled = false; }
  });
}


// ════════════════════════════════════════════════════════════════
// PLANES
// ════════════════════════════════════════════════════════════════

function _bindPlanButtons(currentPlan) {
  ['premium', 'elite'].forEach(plan => {
    const btn = document.getElementById(`${plan}Btn`);
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', () => {
      // TODO con backend: redirigir a pasarela de pago
      showToast(`Pasarela de pago para plan ${plan.toUpperCase()} disponible próximamente. 💳`, 'info');
    });
  });
}


// ════════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE SECCIONES
// ════════════════════════════════════════════════════════════════

function _goTo(sectionId) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dash-nav-item').forEach(b => b.classList.remove('active'));

  const section = document.getElementById(`section-${sectionId}`);
  if (section) section.classList.add('active');

  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(b => {
    if (b.classList.contains('dash-nav-item')) b.classList.add('active');
  });

  document.getElementById('dashSidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', `#${sectionId}`);
}

function _bindNavigation() {
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      _goTo(btn.dataset.section);
    });
  });
}

function _bindLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
  document.getElementById('sidebarLogout')?.addEventListener('click', logoutUser);
}

function _bindSidebarMobile() {
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('dashSidebar')?.classList.toggle('open');
  });
}

function _bindDestStatusFilter() {
  document.getElementById('destStatusFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    document.querySelectorAll('#destTable tr').forEach(row => {
      if (!val) { row.style.display = ''; return; }
      const text = row.textContent;
      const match = {
        active:   'Activo',
        inactive: 'Pausado',
        pending:  'Pendiente',
      }[val];
      row.style.display = (!match || text.includes(match)) ? '' : 'none';
    });
  });
}


// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function _statusBadge(status) {
  const map    = { active:'status-active', pending:'status-pending', inactive:'status-inactive' };
  const labels = { active:'Activo', pending:'Pendiente', inactive:'Pausado' };
  return `<span class="status-badge ${map[status]||''}">${labels[status]||status}</span>`;
}

function _bookingStatusBadge(status) {
  const map    = { pending:'status-pending', confirmed:'status-confirmed', cancelled:'status-cancelled', completed:'status-active' };
  const labels = { pending:'Pendiente', confirmed:'Confirmada', cancelled:'Cancelada', completed:'Completada' };
  return `<span class="status-badge ${map[status]||''}">${labels[status]||status}</span>`;
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}


// ════════════════════════════════════════════════════════════════
// ARRANCAR
// ════════════════════════════════════════════════════════════════
init();

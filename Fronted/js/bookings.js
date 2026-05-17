/* ============================================================
   QUETZAL ROUTES — bookings.js  (Frontend)
   Conecta el formulario de reserva de destination.html con api.js.
   Maneja: contador de personas, resumen de precio,
   modal de confirmación y envío real de la reserva.
   ============================================================ */

import { createBooking }     from './api.js';
import { getCurrentUser }    from './auth.js';
import { showToast }         from './ui.js';


// ════════════════════════════════════════════════════════════════
// ESTADO interno del formulario
// ════════════════════════════════════════════════════════════════
const _state = {
  destId:         null,
  pricePerPerson: 0,
  maxPeople:      20,
  people:         2,
  date:           '',
  FEE_RATE:       0.10,   // 10% de comisión / cargo de servicio
};


// ════════════════════════════════════════════════════════════════
// INICIALIZAR — llamar desde destination-page.js pasando el destino
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa toda la lógica del formulario de reserva.
 * @param {object} dest  — objeto destino de db.json
 */
export function initBookingForm(dest) {
  _state.destId         = dest.id;
  _state.pricePerPerson = dest.price_from ?? 0;
  _state.maxPeople      = dest.max_people  ?? 20;
  _state.people         = Math.min(2, _state.maxPeople);

  _setDateMin();
  _updateSummary();
  _bindPeopleCounter();
  _bindDateInput();
  _bindBookingBtn(dest);
  _bindModalClose();
  _bindConfirmBtn(dest);
}


// ════════════════════════════════════════════════════════════════
// PRIVADOS
// ════════════════════════════════════════════════════════════════

/** Fija la fecha mínima a hoy */
function _setDateMin() {
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
}

/** Recalcula y pinta el resumen de precio */
function _updateSummary() {
  const subtotal = _state.pricePerPerson * _state.people;
  const fee      = Math.round(subtotal * _state.FEE_RATE);
  const total    = subtotal + fee;

  _setText('peopleCount',    _state.people);
  _setText('summaryPeople',  _state.people);
  _setText('summarySubtotal',`Q${subtotal}`);
  _setText('summaryFee',     `Q${fee}`);
  _setText('summaryTotal',   `Q${total}`);

  // Actualizar label del precio en la card: "Q150 × 2 personas"
  const priceLabel = document.querySelector('#bookingSummary .booking-summary-row:first-child span');
  if (priceLabel) {
    priceLabel.textContent = `Q${_state.pricePerPerson} × ${_state.people} persona${_state.people > 1 ? 's' : ''}`;
  }
}

/** Botones + y − del contador de personas */
function _bindPeopleCounter() {
  document.getElementById('peopleMinus')?.addEventListener('click', () => {
    if (_state.people > 1) {
      _state.people--;
      _updateSummary();
    }
  });

  document.getElementById('peoplePlus')?.addEventListener('click', () => {
    if (_state.people < _state.maxPeople) {
      _state.people++;
      _updateSummary();
    } else {
      showToast(`Máximo ${_state.maxPeople} personas por reserva.`, 'warning');
    }
  });
}

/** Escucha cambios en el input de fecha */
function _bindDateInput() {
  document.getElementById('bookingDate')?.addEventListener('change', (e) => {
    _state.date = e.target.value;
    e.target.classList.remove('error');
  });
}

/** Botón principal "Reservar ahora" — valida y abre el modal */
function _bindBookingBtn(dest) {
  document.getElementById('bookingBtn')?.addEventListener('click', () => {
    const dateInput = document.getElementById('bookingDate');
    _state.date = dateInput?.value || '';

    if (!_state.date) {
      dateInput?.classList.add('error');
      dateInput?.focus();
      showToast('Selecciona una fecha para continuar.', 'warning');
      return;
    }
    dateInput?.classList.remove('error');

    // Verificar si el usuario está autenticado
    const user = getCurrentUser();
    if (!user) {
      showToast('Debes iniciar sesión para hacer una reserva.', 'info');
      setTimeout(() => {
        sessionStorage.setItem('qr_redirect_after_login', window.location.href);
        window.location.href = 'login.html';
      }, 1500);
      return;
    }

    _fillConfirmModal(dest);
    _openModal('bookingModal');
  });
}

/** Rellena los datos del modal de confirmación */
function _fillConfirmModal(dest) {
  const subtotal = _state.pricePerPerson * _state.people;
  const fee      = Math.round(subtotal * _state.FEE_RATE);
  const total    = subtotal + fee;

  const dateFormatted = new Date(_state.date + 'T12:00:00').toLocaleDateString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  _setText('confirmDestName', dest.title);
  _setText('confirmDate',     dateFormatted);
  _setText('confirmPeople',   `${_state.people} persona${_state.people > 1 ? 's' : ''}`);
  _setText('confirmTotal',    `Q${total} GTQ`);
}

/** Cierre del modal — overlay y botones */
function _bindModalClose() {
  ['modalClose', 'modalClosBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => _closeModal('bookingModal'));
  });

  document.getElementById('bookingModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) _closeModal('bookingModal');
  });
}

/** Botón "Confirmar reserva" dentro del modal */
function _bindConfirmBtn(dest) {
  const confirmBtn = document.getElementById('confirmBookingBtn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    const user = getCurrentUser();
    if (!user) return;

    confirmBtn.textContent = 'Enviando...';
    confirmBtn.disabled    = true;

    try {
      const subtotal = _state.pricePerPerson * _state.people;
      const fee      = Math.round(subtotal * _state.FEE_RATE);
      const total    = subtotal + fee;

      const bookingData = {
        destination_id:    _state.destId,
        user_id:           user.id,
        date_requested:    _state.date,
        people_count:      _state.people,
        total_amount:      total,
        commission_amount: fee,
        net_to_provider:   subtotal,
        status:            'pending',
        notes:             '',
      };

      await createBooking(bookingData);

      _closeModal('bookingModal');
      showToast('¡Reserva enviada! El proveedor la confirmará pronto. 🎉', 'success');

    } catch (err) {
      console.error('[bookings.js] Error al crear reserva:', err);
      showToast('Ocurrió un error al enviar la reserva. Intenta de nuevo.', 'error');
    } finally {
      confirmBtn.textContent = 'Confirmar reserva';
      confirmBtn.disabled    = false;
    }
  });
}

function _openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

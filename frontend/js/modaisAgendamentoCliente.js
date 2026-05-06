/* ══════════════════════════════════════════════════════════════════════════
    MODAL AGENDAR HORÁRIO  ·  modalAgendarHorario.js
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── CONSTANTES ────────────────────────────────────────────────────────── */
const PT_DAYS   = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const PT_MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const PT_MONTHS_SHORT = [
    'Jan','Fev','Mar','Abr','Mai','Jun',
    'Jul','Ago','Set','Out','Nov','Dez'
];
const ALL_TIMES = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '14:00','14:30','15:00','15:30','16:00','16:30',
    '17:00','17:30'
];

/* ─── ESTADO GLOBAL ─────────────────────────────────────────────────────── */
const state = {
    service:      null,
    selectedDate: null,
    selectedTime: null,
    weekStart:    null,
};

/* ══════════════════════════════════════════════════════════════════════════
    MODAIS
   ══════════════════════════════════════════════════════════════════════════ */
const Modal = {
    open(id) {
        document.getElementById(id).classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    close(id) {
        document.getElementById(id).classList.remove('active');
        // Só libera o scroll quando nenhum modal estiver aberto
        const anyOpen = document.querySelector('.modal-overlay.active');
        if (!anyOpen) document.body.style.overflow = '';
    },
    /** Fecha ao clicar no overlay (fora do modal) */
    bindOverlayClose(overlayId) {
        document.getElementById(overlayId).addEventListener('click', e => {
            if (e.target.id === overlayId) Modal.close(overlayId);
        });
    },
};

/* ══════════════════════════════════════════════════════════════════════════
    AGENDAR HORÁRIO
   ══════════════════════════════════════════════════════════════════════════ */
function openAgendarModal(service) {
    state.service      = service;
    state.selectedDate = null;
    state.selectedTime = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    state.weekStart = sunday;
    document.getElementById('modal-nome-servico').textContent = service.nome;
    document.getElementById('times-section').style.display   = 'none';
    document.getElementById('times-grid').innerHTML           = '';
    document.getElementById('modal-confirm-btn').disabled     = true;
    _renderCalendar();
    Modal.open('modal-agendar-overlay');
}

function closeAgendarModal() {
    Modal.close('modal-agendar-overlay');
}

/* ─── CALENDÁRIO ────────────────────────────────────────────────────────── */
function _renderCalendar() {
    const mid = new Date(state.weekStart);
    mid.setDate(mid.getDate() + 3);
    document.getElementById('cal-month-label').textContent =
        `${PT_MONTHS[mid.getMonth()]} ${mid.getFullYear()}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(state.weekStart);
        d.setDate(state.weekStart.getDate() + i);
        return d;
    });

    const grid = document.getElementById('calendar-days');
    grid.innerHTML = days.map(d => {
        const isDisabled = d < today;
        const isSelected = state.selectedDate &&
            d.toDateString() === state.selectedDate.toDateString();
        const classes = ['day-cell', isDisabled && 'disabled', isSelected && 'selected']
            .filter(Boolean).join(' ');
        return `
            <button class="${classes}"
                data-date="${d.toISOString().split('T')[0]}"
                ${isDisabled ? 'disabled' : ''}>
                <span class="day-name">${PT_DAYS[d.getDay()]}</span>
                <span class="day-number">${d.getDate()}</span>
                <span class="day-month">${PT_MONTHS_SHORT[d.getMonth()]}</span>
            </button>`;
    }).join('');

    grid.querySelectorAll('.day-cell:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async () => {
            const dateIso = btn.dataset.date;
            
            state.selectedDate = new Date(dateIso + 'T12:00:00');
            state.selectedTime = null;
            
            _renderCalendar();
            _updateConfirmBtn();
            
            await _loadAndRenderTimes(dateIso);
        });
    });
}

/* ─── HORÁRIOS ──────────────────────────────────────────────────────────── */
async function _loadAndRenderTimes(dateIso) {
    const grid = document.getElementById('times-grid');
    const section = document.getElementById('times-section');

    section.style.display = 'flex';
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #717182;">Buscando horários disponíveis...</p>';

    try {
        const response = await fetch(`http://localhost:3000/api/public/availability?date=${dateIso}&service_id=${state.service.id}`);
        const result = await response.json();

        if (result.success) {
            _renderTimesGrid(result.data.available_slots); 
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #E0456A;">Erro ao buscar horários.</p>';
        }
    } catch (error) {
        console.error('Erro de conexão ao buscar horários:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #E0456A;">Erro de conexão com o servidor.</p>';
    }
}

function _renderTimesGrid(availableTimes) {
    const grid = document.getElementById('times-grid');

    if (!availableTimes || availableTimes.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #717182;">Não há horários disponíveis para esta data.</p>';
        return;
    }

    grid.innerHTML = availableTimes.map(t => `
        <button class="time-btn ${state.selectedTime === t ? 'selected' : ''}"
            data-time="${t}">${t}</button>
    `).join('');

    grid.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedTime = btn.dataset.time;
            _renderTimesGrid(availableTimes);
            _updateConfirmBtn();
        });
    });
}

/* ─── BOTÃO CONFIRMAR ───────────────────────────────────────────────────── */
function _updateConfirmBtn() {
    document.getElementById('modal-confirm-btn').disabled =
        !(state.selectedDate && state.selectedTime);
}

/* ══════════════════════════════════════════════════════════════════════════
    MODAL 2 · DADOS DE CONTATO
   ══════════════════════════════════════════════════════════════════════════ */
function openDadosModal() {
    // Limpa o formulário antes de abrir
    FIELD_RULES.forEach(({ inputId, errorId }) => {
        document.getElementById(inputId).value = '';
        _clearFieldError(inputId, errorId);
    });

    Modal.open('modal-dados-overlay');
    document.getElementById('input-nome').focus();
}

function closeDadosModal() {
    Modal.close('modal-dados-overlay');
}

/* ─── MÁSCARA DE TELEFONE ───────────────────────────────────────────────── */
function _maskTelefone(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    e.target.value = v;
}

/* ─── VALIDAÇÃO ─────────────────────────────────────────────────────────── */
const FIELD_RULES = [
    {
        inputId:  'input-nome',
        errorId:  'error-nome',
        prepare:  v => v.trim(),
        rules: [
            { test: v => v.length > 0,              msg: 'Este campo é obrigatório.'                     },
            { test: v => v.length >= 3,             msg: 'O nome deve ter pelo menos 3 caracteres.'      },
            { test: v => /^[a-zA-ZÀ-ÿ\s]+$/.test(v), msg: 'O nome deve conter apenas letras.'           },
        ],
    },
    {
        inputId:  'input-email',
        errorId:  'error-email',
        prepare:  v => v.trim(),
        rules: [
            { test: v => v.length > 0,                              msg: 'Este campo é obrigatório.'                                  },
            { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),     msg: 'Informe um e-mail válido (exemplo: nome@email.com).'        },
        ],
    },
    {
        inputId:  'input-telefone',
        errorId:  'error-telefone',
        prepare:  v => v.replace(/\D/g, ''),
        rules: [
            { test: v => v.length > 0,   msg: 'Este campo é obrigatório.'                          },
            { test: v => v.length >= 10, msg: 'Por favor, informe um número de telefone válido.'   },
        ],
    },
];

function _setFieldError(inputId, errorId, msg) {
    document.getElementById(inputId).classList.add('error');
    const el = document.getElementById(errorId);
    el.textContent = msg;
    el.classList.add('visible');
}
function _clearFieldError(inputId, errorId) {
    document.getElementById(inputId).classList.remove('error');
    const el = document.getElementById(errorId);
    el.textContent = '';
    el.classList.remove('visible');
}
function _validarCampo({ inputId, errorId, prepare, rules }) {
    const raw   = document.getElementById(inputId).value;
    const value = prepare(raw);

    for (const { test, msg } of rules) {
        if (!test(value)) {
            _setFieldError(inputId, errorId, msg);
            return false;
        }
    }
    _clearFieldError(inputId, errorId);
    return true;
}

function _validarDados() {
    const results = FIELD_RULES.map(_validarCampo);
    return results.every(Boolean);
}

function _bindRealtimeValidation() {
    FIELD_RULES.forEach(fieldDef => {
        const input = document.getElementById(fieldDef.inputId);
        input.addEventListener('blur', () => _validarCampo(fieldDef));
        input.addEventListener('input', () => _clearFieldError(fieldDef.inputId, fieldDef.errorId));
    });
}

/* ─── CONFIRMAR DADOS ───────────────────────────────────────────────────── */
async function _onConfirmarDados() {
    if (!_validarDados()) return;

    // Extrai e formata a data para o padrão YYYY-MM-DD
    const dataAgendamentoIso = new Date(state.selectedDate.getTime() - (state.selectedDate.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0];

    const payload = {
        client_name:  document.getElementById('input-nome').value.trim(),
        client_email: document.getElementById('input-email').value.trim(),
        client_phone: document.getElementById('input-telefone').value.trim(),
        service_id:       state.service.id,
        appointment_date: dataAgendamentoIso, 
        appointment_time: state.selectedTime
    };

    const btn = document.getElementById('modal-dados-confirm-btn');
    const textoOriginal = btn.textContent;
    
    try {
        // Feedback visual de carregamento
        btn.textContent = 'AGENDANDO...';
        btn.disabled = true;

        const response = await fetch('http://localhost:3000/api/public/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.success) {
            closeDadosModal();
            closeAgendarModal();
            openConfirmadoModal();
        } else {
            alert(`Não foi possível agendar: ${result.error}`);
        }
    } catch (error) {
        console.error('Erro de conexão com o servidor:', error);
        alert('Erro de conexão. Tente novamente mais tarde.');
    } finally {
        // Restaura o botão ao estado original caso haja erro
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

/* ══════════════════════════════════════════════════════════════════════════
    CONFIRMADO
   ══════════════════════════════════════════════════════════════════════════ */
function openConfirmadoModal() {
    document.getElementById('conf-data').textContent    = `${state.selectedDate.toLocaleDateString('pt-BR')} - ${state.selectedTime}`;
    document.getElementById('conf-servico').textContent = state.service.nome;
    document.getElementById('conf-valor').textContent   = state.service.valor;
    Modal.open('modal-confirmado-overlay');
}

function closeConfirmadoModal() {
    Modal.close('modal-confirmado-overlay');
}

/* ══════════════════════════════════════════════════════════════════════════
    INICIALIZAÇÃO
   ══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // ── Modal Agendar ──────────────────────────────────────────────────────
    document.getElementById('modal-close-btn')
        .addEventListener('click', closeAgendarModal);
    Modal.bindOverlayClose('modal-agendar-overlay');

    document.getElementById('cal-prev').addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisSunday = new Date(today);
        thisSunday.setDate(today.getDate() - today.getDay());

        const prev = new Date(state.weekStart);
        prev.setDate(prev.getDate() - 7);
        if (prev >= thisSunday) {
            state.weekStart = prev;
            _renderCalendar();
        }
    });

    document.getElementById('cal-next').addEventListener('click', () => {
        state.weekStart = new Date(state.weekStart);
        state.weekStart.setDate(state.weekStart.getDate() + 7);
        _renderCalendar();
    });

    document.getElementById('modal-confirm-btn')
        .addEventListener('click', () => openDadosModal());

    // ── Modal Dados ────────────────────────────────────────────────────────
    document.getElementById('modal-dados-close-btn')
        .addEventListener('click', closeDadosModal);
    Modal.bindOverlayClose('modal-dados-overlay');

    document.getElementById('modal-dados-confirm-btn')
        .addEventListener('click', _onConfirmarDados);
    document.getElementById('input-telefone')
        .addEventListener('input', _maskTelefone);

    _bindRealtimeValidation();

    // ── Modal Confirmado ───────────────────────────────────────────────────
    document.getElementById('btn-ok-confirmado')
        .addEventListener('click', closeConfirmadoModal);
    Modal.bindOverlayClose('modal-confirmado-overlay');
});
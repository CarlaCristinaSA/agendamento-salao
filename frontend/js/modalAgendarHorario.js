/* ══════════════════════════════════════════════════════════════════════════
    MODAL AGENDAR HORÁRIO
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
    GERAL
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
        btn.addEventListener('click', () => {
            state.selectedDate = new Date(btn.dataset.date + 'T12:00:00');
            state.selectedTime = null;
            _renderCalendar();
            _renderTimes();
            _updateConfirmBtn();
        });
    });
}

/* ─── HORÁRIOS ──────────────────────────────────────────────────────────── */
function _renderTimes() {
    const grid = document.getElementById('times-grid');
    document.getElementById('times-section').style.display = 'flex';
    grid.innerHTML = ALL_TIMES.map(t => `
        <button class="time-btn ${state.selectedTime === t ? 'selected' : ''}"
            data-time="${t}">${t}</button>
    `).join('');
    grid.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedTime = btn.dataset.time;
            _renderTimes();
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
    DADOS DE CONTATO
══════════════════════════════════════════════════════════════════════════ */
function openDadosModal() {
    ['input-nome', 'input-email', 'input-telefone'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.querySelectorAll('.field-input').forEach(i => i.classList.remove('error'));
    document.querySelectorAll('.error-msg').forEach(e => {
        e.textContent = '';
        e.classList.remove('visible');
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
function _setFieldError(inputId, errorId, msg) {
    document.getElementById(inputId).classList.add('error');
    const el = document.getElementById(errorId);
    el.textContent = msg;
    el.classList.add('visible');
}

function _validarDados() {
    const nome     = document.getElementById('input-nome').value;
    const email    = document.getElementById('input-email').value.trim();
    const telefone = document.getElementById('input-telefone').value.replace(/\D/g, '');
    let ok = true;
    document.querySelectorAll('.field-input').forEach(i => i.classList.remove('error'));
    document.querySelectorAll('.error-msg').forEach(e => {
        e.textContent = '';
        e.classList.remove('visible');
    });

    if (nome.trim().length === 0) {
        _setFieldError('input-nome', 'error-nome', 'O nome é obrigatório e não pode ficar em branco.');
        ok = false;
    } else if (nome.trim().length < 3) {
        _setFieldError('input-nome', 'error-nome', 'Por favor, digite um nome válido (mínimo de 3 letras).');
        ok = false;
    }
    if (email.length === 0) {
        _setFieldError('input-email', 'error-email', 'O e-mail é obrigatório.');
        ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        _setFieldError('input-email', 'error-email', 'Formato inválido. Use o padrão: seu@email.com');
        ok = false;
    }
    if (telefone.length === 0) {
        _setFieldError('input-telefone', 'error-telefone', 'O telefone é obrigatório.');
        ok = false;
    } else if (telefone.length < 10) {
        _setFieldError('input-telefone', 'error-telefone', 'Telefone inválido. Insira o DDD + número.');
        ok = false;
    }
    return ok;
}

/* ─── CONFIRMAR DADOS ───────────────────────────────────────────────────── */
function _onConfirmarDados() {
    if (!_validarDados()) return;

    const dados = {
        nome:     document.getElementById('input-nome').value.trim(),
        email:    document.getElementById('input-email').value.trim(),
        telefone: document.getElementById('input-telefone').value.trim(),
    };
    // INTEGRAÇÃO: chamar aqui o endpoint de criação de agendamento (Back-end)
    console.log('Dados do cliente prontos para o banco:', dados);
    closeDadosModal();
    closeAgendarModal();
    openConfirmadoModal();
}

/* ══════════════════════════════════════════════════════════════════════════
    POP-UP CONFIRMADO (SUCESSO)
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
    //Modal Agendar 
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
    //Modal Dados 
    document.getElementById('modal-dados-close-btn')
        .addEventListener('click', closeDadosModal);
    Modal.bindOverlayClose('modal-dados-overlay');
    document.getElementById('modal-dados-confirm-btn')
        .addEventListener('click', _onConfirmarDados);
    document.getElementById('input-telefone')
        .addEventListener('input', _maskTelefone);
    //Modal Confirmado
    document.getElementById('btn-ok-confirmado')
        .addEventListener('click', closeConfirmadoModal);
    Modal.bindOverlayClose('modal-confirmado-overlay');
});
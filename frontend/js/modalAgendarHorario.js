/* ══════════════════════════════════════════════════════════════════════════
    MODAL AGENDAR HORÁRIO
   ══════════════════════════════════════════════════════════════════════════ */

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

const state = {
    service:      null,
    selectedDate: null,
    selectedTime: null,
    weekStart:    null,
};

/* ─── ABRIR / FECHAR ────────────────────────────────────────────────────── */
function openAgendarModal(service) {
    state.service = service;
    state.selectedDate = null;
    state.selectedTime = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    state.weekStart = sunday;

    document.getElementById('modal-nome-servico').textContent = service.nome;
    document.getElementById('times-section').style.display = 'none';
    document.getElementById('times-grid').innerHTML = '';
    document.getElementById('modal-confirm-btn').disabled = true;

    _renderCalendar();

    document.getElementById('modal-agendar-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAgendarModal() {
    document.getElementById('modal-agendar-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

/* ─── CALENDÁRIO (apenas 7 dias) ────────────────────────────────────────── */
function _renderCalendar() {
    const mid = new Date(state.weekStart);
    mid.setDate(mid.getDate() + 3);
    document.getElementById('cal-month-label').textContent =
        `${PT_MONTHS[mid.getMonth()]} ${mid.getFullYear()}`;
    const grid  = document.getElementById('calendar-days');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(state.weekStart);
        d.setDate(state.weekStart.getDate() + i);
        return d;
    });

    grid.innerHTML = days.map(d => {
        const isDisabled = d < today;
        const isSelected = state.selectedDate &&
            d.toDateString() === state.selectedDate.toDateString();

        const classes = ['day-cell', isDisabled ? 'disabled' : '', isSelected ? 'selected' : '']
            .filter(Boolean).join(' ');

        return `
            <button class="${classes}"
                data-date="${d.toISOString().split('T')[0]}"
                ${isDisabled ? 'disabled' : ''}>
                <span class="day-name">${PT_DAYS[d.getDay()]}</span>
                <span class="day-number">${d.getDate()}</span>
                <span class="day-month">${PT_MONTHS_SHORT[d.getMonth()]}</span>
            </button>
        `;
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
    const section = document.getElementById('times-section');
    const grid    = document.getElementById('times-grid');
    section.style.display = 'flex';

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

function _onConfirm() {
    closeAgendarModal();
    openDadosModal({
        servico: state.service,
        data:    state.selectedDate.toLocaleDateString('pt-BR'),
        horario: state.selectedTime,
    });
}

/* ─── EVENTOS FIXOS ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-close-btn')
        .addEventListener('click', closeAgendarModal);

    document.getElementById('modal-agendar-overlay')
        .addEventListener('click', e => {
            if (e.target.id === 'modal-agendar-overlay') closeAgendarModal();
        });

    // Semana anterior
    document.getElementById('cal-prev').addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const prev = new Date(state.weekStart);
        prev.setDate(prev.getDate() - 7);
        // Não permite voltar para semanas no passado
        const thisSunday = new Date(today);
        thisSunday.setDate(today.getDate() - today.getDay());
        if (prev >= thisSunday) {
            state.weekStart = prev;
            _renderCalendar();
        }
    });

    // Próxima semana
    document.getElementById('cal-next').addEventListener('click', () => {
        const next = new Date(state.weekStart);
        next.setDate(next.getDate() + 7);
        state.weekStart = next;
        _renderCalendar();
    });

    document.getElementById('modal-confirm-btn')
        .addEventListener('click', _onConfirm);
});


/* ══════════════════════════════════════════════════════════════════════════
    MODAL DADOS DE CONTATO
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── ABRIR / FECHAR ────────────────────────────────────────────────────── */
function openDadosModal(agendamento) {
    document.getElementById('input-nome').value      = '';
    document.getElementById('input-email').value     = '';
    document.getElementById('input-telefone').value  = '';
    document.getElementById('modal-dados-overlay').classList.add('active');
}

function openDadosModal(agendamento) {
    document.getElementById('input-nome').value      = '';
    document.getElementById('input-email').value     = '';
    document.getElementById('input-telefone').value  = '';
    document.querySelectorAll('.field-input').forEach(i => i.classList.remove('error'));
    document.getElementById('modal-dados-overlay').classList.add('active');
    document.getElementById('input-nome').focus();
}

/* ─── MÁSCARA DE TELEFONE ───────────────────────────────────────────────── */
function _maskTelefone(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6)      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    e.target.value = v;
}

/* ─── VALIDAÇÃO ─────────────────────────────────────────────────────────── */
function _validarDados() {
    const nome     = document.getElementById('input-nome');
    const email    = document.getElementById('input-email');
    const telefone = document.getElementById('input-telefone');
    let ok = true;
    [nome, email, telefone].forEach(i => i.classList.remove('error'));
    return ok;
}

/* ─── EVENTOS FIXOS ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-dados-close-btn')
        .addEventListener('click', closeDadosModal);
    document.getElementById('modal-dados-overlay')
        .addEventListener('click', e => {
            if (e.target.id === 'modal-dados-overlay') closeDadosModal();
        });
    document.getElementById('input-telefone')
        .addEventListener('input', _maskTelefone);
});
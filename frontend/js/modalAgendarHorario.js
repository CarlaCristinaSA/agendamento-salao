
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
    // INTEGRAÇÃO: chamar aqui o endpoint de criação de agendamento.
    // Dados disponíveis:
    //   state.service      → { nome, duracao, valor }
    //   state.selectedDate → Date
    //   state.selectedTime → string "HH:MM"
    console.log('Agendamento:', {
        servico: state.service,
        data:    state.selectedDate.toLocaleDateString('pt-BR'),
        horario: state.selectedTime,
    });
    closeAgendarModal();
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



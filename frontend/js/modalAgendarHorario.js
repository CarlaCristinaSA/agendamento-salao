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

    // _renderCalendar(); será chamado mais pra frente

    document.getElementById('modal-agendar-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAgendarModal() {
    document.getElementById('modal-agendar-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

/* ─── EVENTOS FIXOS ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-close-btn')
        .addEventListener('click', closeAgendarModal);

    document.getElementById('modal-agendar-overlay')
        .addEventListener('click', e => {
            if (e.target.id === 'modal-agendar-overlay') closeAgendarModal();
        });
});

/* ─── CALENDÁRIO  ──────────────────────────────────────────────────── */
function _renderCalendar() {
    const mid = new Date(state.weekStart);
    mid.setDate(mid.getDate() + 3);
    document.getElementById('cal-month-label').textContent =
        `${PT_MONTHS[mid.getMonth()]} ${mid.getFullYear()}`;
}
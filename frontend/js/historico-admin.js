'use strict';

const URL_API          = 'http://localhost:3000/api';
const LIMITE_POR_PAGINA = 100;
const REDIRECT_LOGIN   = '/frontend/pages/shared/autenticar-usuario.html';

let abaAtual = 'passados';
let mapaDuracaoServicos = {};

const estadoHistorico = {
    passados:   [],
    cancelados: [],
};

function _obterToken() {
    return sessionStorage.getItem('salao_token') || localStorage.getItem('salao_token') || null;
}

function _exigirToken() {
    const token = _obterToken();
    if (!token) {
        window.location.href = REDIRECT_LOGIN;
        return null;
    }
    return token;
}

function _formatarData(dataISO) {
    if (!dataISO) return 'N/A';
    const [ano, mes, dia] = String(dataISO).split('T')[0].split('-');
    if (!ano || !mes || !dia) return 'N/A';
    return `${dia}/${mes}/${ano}`;
}

function _formatarValor(valor) {
    const num = parseFloat(valor);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function _escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

function _ehCancelado(ag) {
    const status = String(ag.status || '').toLowerCase();
    return status === 'cancelled' || status === 'cancelado';
}

function _ehPassado(ag) {
    if (_ehCancelado(ag)) return false;

    const agora     = new Date();
    const dataLimpa = String(ag.appointment_date).split('T')[0];
    const horaLimpa = String(ag.appointment_time || '00:00').substring(0, 5);
    const inicio    = new Date(`${dataLimpa}T${horaLimpa}:00`);
    const duracao   = Number(mapaDuracaoServicos[ag.service_id]) || 0;
    const fim       = duracao > 0 ? new Date(inicio.getTime() + duracao * 60_000) : inicio;

    return fim <= agora;
}

function _cardPassadoHTML(ag) {
    const data  = _formatarData(ag.appointment_date);
    const hora  = String(ag.appointment_time || '').substring(0, 5);
    const valor = _formatarValor(ag.price);

    return `
    <article class="card card--history">
        <div class="card__header">
            <h3 class="card__title">${_escapeHtml(ag.service_name || 'Serviço')}</h3>
            <span class="badge badge--concluido">CONCLUÍDO</span>
        </div>
        <div class="card__body">
            <div class="info-row">
                <div class="info-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 8.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" stroke="white" stroke-width="1.5"/>
                        <path d="M3 15.75c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Cliente</span>
                    <span class="info-value">${_escapeHtml(ag.client_name || 'N/A')}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6 1.5v3M12 1.5v3M14.25 3H3.75c-.83 0-1.5.67-1.5 1.5V15c0 .83.67 1.5 1.5 1.5h10.5c.83 0 1.5-.67 1.5-1.5V4.5c0-.83-.67-1.5-1.5-1.5ZM2.25 7.5h13.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Data e Hora</span>
                    <span class="info-value">${data} — ${hora}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 1.5v15M12.75 3.75H7.15c-1.4 0-2.5 1.1-2.5 2.6 0 1.4 1.1 2.6 2.5 2.6h3.75c1.4 0 2.6 1.1 2.6 2.6 0 1.4-1.2 2.6-2.6 2.6H4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Valor</span>
                    <span class="info-value valor">${valor}</span>
                </div>
            </div>
        </div>
    </article>`;
}

function _cardCanceladoHTML(ag) {
    const data  = _formatarData(ag.appointment_date);
    const hora  = String(ag.appointment_time || '').substring(0, 5);
    const valor = _formatarValor(ag.price);

    return `
    <article class="card card--history card--cancelado">
        <div class="card__header">
            <h3 class="card__title">${_escapeHtml(ag.service_name || 'Serviço')}</h3>
            <span class="badge badge--cancelado">CANCELADO</span>
        </div>
        <div class="card__body">
            <div class="info-row">
                <div class="info-icon info-icon--pink">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 8.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" stroke="white" stroke-width="1.5"/>
                        <path d="M3 15.75c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Cliente</span>
                    <span class="info-value">${_escapeHtml(ag.client_name || 'N/A')}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon info-icon--pink">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6 1.5v3M12 1.5v3M14.25 3H3.75c-.83 0-1.5.67-1.5 1.5V15c0 .83.67 1.5 1.5 1.5h10.5c.83 0 1.5-.67 1.5-1.5V4.5c0-.83-.67-1.5-1.5-1.5ZM2.25 7.5h13.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Data e Hora Original</span>
                    <span class="info-value">${data} — ${hora}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon info-icon--pink">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 1.5v15M12.75 3.75H7.15c-1.4 0-2.5 1.1-2.5 2.6 0 1.4 1.1 2.6 2.5 2.6h3.75c1.4 0 2.6 1.1 2.6 2.6 0 1.4-1.2 2.6-2.6 2.6H4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="info-text">
                    <span class="info-label">Valor</span>
                    <span class="info-value valor">${valor}</span>
                </div>
            </div>
        </div>
    </article>`;
}

function _ordenarPorDataDesc(lista) {
    return [...lista].sort((a, b) => {
        const dataA = String(a.appointment_date).split('T')[0];
        const dataB = String(b.appointment_date).split('T')[0];
        const horaA = String(a.appointment_time || '00:00').substring(0, 5);
        const horaB = String(b.appointment_time || '00:00').substring(0, 5);

        const dtA = new Date(`${dataA}T${horaA}:00`);
        const dtB = new Date(`${dataB}T${horaB}:00`);
        return dtB - dtA;
    });
}

function renderizarAbaAtual() {
    const container = document.getElementById('cards-historico-admin');
    const lista     = estadoHistorico[abaAtual];

    if (lista.length === 0) {
        container.innerHTML = `<p class="empty-message">${
            abaAtual === 'passados'
                ? 'Nenhum agendamento passado ainda.'
                : 'Nenhum cancelamento registrado.'
        }</p>`;
        return;
    }

    container.innerHTML = _ordenarPorDataDesc(lista)
        .map(abaAtual === 'passados' ? _cardPassadoHTML : _cardCanceladoHTML)
        .join('');
}

function atualizarContagens() {
    document.getElementById('contagem-passados').textContent   = estadoHistorico.passados.length;
    document.getElementById('contagem-cancelados').textContent = estadoHistorico.cancelados.length;
}

function _alternarSecaoCancelamentos(aba) {
    const secao = document.getElementById('secao-cancelamentos');
    if (secao) secao.style.display = aba === 'cancelados' ? '' : 'none';
}

window.selecionarAba = function selecionarAba(aba) {
    abaAtual = aba;

    document.getElementById('aba-passados').classList.toggle('ativo', aba === 'passados');
    document.getElementById('aba-cancelados').classList.toggle('ativo', aba === 'cancelados');
    document.getElementById('aba-passados').setAttribute('aria-selected', aba === 'passados');
    document.getElementById('aba-cancelados').setAttribute('aria-selected', aba === 'cancelados');

    renderizarAbaAtual();
    _alternarSecaoCancelamentos(aba);

    if (aba === 'cancelados' && window.NotifCancelamentoAdmin) {
        window.NotifCancelamentoAdmin.atualizar();
    }

    if (history.replaceState) {
        history.replaceState(null, '', `#${aba}`);
    }
};

async function _buscarTodosAgendamentos(token) {
    const url1 = `${URL_API}/admin/appointments?page=1&limit=${LIMITE_POR_PAGINA}`;
    const resp1 = await fetch(url1, { headers: { Authorization: `Bearer ${token}` } });

    if (resp1.status === 401 || resp1.status === 403) {
        sessionStorage.removeItem('salao_token');
        sessionStorage.removeItem('salao_admin_nome');
        sessionStorage.removeItem('salao_user_role');
        localStorage.removeItem('salao_token');
        window.location.href = REDIRECT_LOGIN;
        return [];
    }

    const json1 = await resp1.json();
    if (!resp1.ok || !json1.success) {
        throw new Error(json1.error || 'Erro ao buscar agendamentos');
    }

    let todos         = Array.isArray(json1.data) ? [...json1.data] : [];
    const totalPaginas = json1.pagination?.total_pages || 1;

    if (totalPaginas > 1) {
        const paginas = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);
        const respostas = await Promise.all(
            paginas.map(p =>
                fetch(`${URL_API}/admin/appointments?page=${p}&limit=${LIMITE_POR_PAGINA}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(r => r.json())
            )
        );
        for (const r of respostas) {
            if (r.success && Array.isArray(r.data)) todos = todos.concat(r.data);
        }
    }

    return todos;
}

async function _carregarDuracaoServicos(token) {
    try {
        const resp   = await fetch(`${URL_API}/services`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await resp.json();
        if (resp.ok && result.success && Array.isArray(result.data)) {
            mapaDuracaoServicos = Object.fromEntries(
                result.data.map(s => [s.id, Number(s.duration_minutes) || 0])
            );
        }
    } catch (erro) {
        console.error('Erro ao carregar duração dos serviços:', erro);
    }
}

async function carregarHistoricoAdmin() {
    const token = _exigirToken();
    if (!token) return;

    const container = document.getElementById('cards-historico-admin');
    container.innerHTML = '<p class="empty-message">Carregando histórico...</p>';

    try {
        const [todos] = await Promise.all([
            _buscarTodosAgendamentos(token),
            _carregarDuracaoServicos(token),
        ]);

        estadoHistorico.passados   = todos.filter(_ehPassado);
        estadoHistorico.cancelados = todos.filter(_ehCancelado);

        atualizarContagens();
        renderizarAbaAtual();
    } catch (erro) {
        console.error('Erro ao carregar histórico:', erro);
        container.innerHTML = '<p class="empty-message">Erro ao carregar histórico. Tente recarregar a página.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'cancelados' || hash === 'passados') {
        abaAtual = hash;
        document.getElementById('aba-passados').classList.toggle('ativo', abaAtual === 'passados');
        document.getElementById('aba-cancelados').classList.toggle('ativo', abaAtual === 'cancelados');
        document.getElementById('aba-passados').setAttribute('aria-selected', abaAtual === 'passados');
        document.getElementById('aba-cancelados').setAttribute('aria-selected', abaAtual === 'cancelados');
    }

    _alternarSecaoCancelamentos(abaAtual);

    await carregarHistoricoAdmin();

    if (abaAtual === 'cancelados' && window.NotifCancelamentoAdmin) {
        window.NotifCancelamentoAdmin.atualizar();
    }
});
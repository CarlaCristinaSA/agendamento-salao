'use strict';

const API_BASE_URL = 'http://localhost:3000/api';

// ─── ESTADO ──────────────────────────────────────────────────────────────────
let tokenGlobal = null;

const state = {
  upcoming: [],
  history:  [],
  cancelId: null,
};

// ─── SVGs ────────────────────────────────────────────────────────────────────
const SVG = {
  calendar: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 1.5V4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 1.5V4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.25 7.5H15.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  dollar: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1.5V16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.75 3.75H7.125C6.42881 3.75 5.76113 4.02656 5.26884 4.51884C4.77656 5.01113 4.5 5.67881 4.5 6.375C4.5 7.07119 4.77656 7.73887 5.26884 8.23116C5.76113 8.72344 6.42881 9 7.125 9H10.875C11.5712 9 12.2389 9.27656 12.7312 9.76884C13.2234 10.2611 13.5 10.9288 13.5 11.625C13.5 12.3212 13.2234 12.9889 12.7312 13.4812C12.2389 13.9734 11.5712 14.25 10.875 14.25H4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  check: `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#cc1)">
        <path d="M12.7172 5.8332C12.9836 7.14063 12.7937 8.49987 12.1793 9.68425C11.5648 10.8686 10.5629 11.8066 9.34057 12.3416C8.11826 12.8767 6.74947 12.9766 5.46244 12.6246C4.17542 12.2726 3.04796 11.49 2.2681 10.4074C1.48823 9.32471 1.10309 8.00743 1.17691 6.67518C1.25072 5.34293 1.77903 4.07626 2.67373 3.08639C3.56843 2.09652 4.77544 1.44329 6.09347 1.23564C7.41151 1.02798 8.76089 1.27846 9.9166 1.94529" stroke="white" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5.25 6.41683L7 8.16683L12.8333 2.3335" stroke="white" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <defs><clipPath id="cc1"><rect width="14" height="14" fill="white"/></clipPath></defs>
    </svg>`,

  x: `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 3.5L3.5 10.5" stroke="#6B7280" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.5 3.5L10.5 10.5" stroke="#6B7280" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
};

// ─── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

function getAuthToken() {
  return sessionStorage.getItem('salao_token') || null;
}

function redirectToLogin() {
  sessionStorage.removeItem('salao_token');
  sessionStorage.removeItem('salao_admin_nome');
  sessionStorage.removeItem('salao_user_role');
  window.location.href = '/frontend/pages/shared/autenticar-usuario.html';
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiRequest(path, { method = 'GET', body = null } = {}) {
  if (!tokenGlobal) tokenGlobal = getAuthToken();

  if (!tokenGlobal) {
    throw Object.assign(new Error('Token JWT não encontrado. Faça login novamente.'), { status: 401 });
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenGlobal}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const errMsg = json.error || json.message || `Erro HTTP ${response.status}`;
    throw Object.assign(new Error(errMsg), { status: response.status, payload: json });
  }

  return json;
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

function formatarData(dataISO) {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function formatarValor(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function badgeHTML(displayStatus) {
  switch (displayStatus) {
    case 'Pendente':
      return `<span class="badge badge--pendente">${SVG.check} PENDENTE</span>`;
    case 'Concluído':
      return `<span class="badge badge--concluido">${SVG.check} CONCLUÍDO</span>`;
    case 'Cancelado':
      return `<span class="badge badge--cancelado">${SVG.x} CANCELADO</span>`;
    default:
      return `<span class="badge badge--cancelado">${SVG.x} ${displayStatus.toUpperCase()}</span>`;
  }
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function cardHTML(ag, isFuture) {
  const dataFormatada  = formatarData(ag.appointment_date);
  const valorFormatado = formatarValor(ag.price);

  // Botão de cancelar: só aparece em futuros com permissão do backend
  const cancelBtn = (isFuture && ag.can_cancel)
    ? `<button class="btn-cancel"
              data-id="${ag.id}"
              data-servico="${ag.service_name.replace(/"/g, '&quot;')}">
        CANCELAR AGENDAMENTO
      </button>`
    : '';

  return `
    <div class="card${isFuture ? '' : ' card--history'}">
      <div class="card__header">
        <h3 class="card__title">${ag.service_name}</h3>
        ${badgeHTML(ag.display_status)}
      </div>
      <div class="card__body">
        <div class="info-row">
          <div class="info-icon">${SVG.calendar}</div>
          <div class="info-text">
            <span class="info-label">Data e Hora</span>
            <span class="info-value">${dataFormatada} — ${ag.appointment_time}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">${SVG.dollar}</div>
          <div class="info-text">
            <span class="info-label">Valor</span>
            <span class="info-value valor">${valorFormatado}</span>
          </div>
        </div>
      </div>
      ${cancelBtn}
    </div>`;
}

// ─── LOADING STATE ────────────────────────────────────────────────────────────
function showLoading() {
  const placeholder = `
    <div class="empty-message" style="opacity:0.5;">Carregando...</div>`;
  document.getElementById('cards-embreve').innerHTML   = placeholder;
  document.getElementById('cards-historico').innerHTML = placeholder;
}

// ─── RENDERIZAÇÃO ─────────────────────────────────────────────────────────────
function renderCards() {
  const containerEmBreve   = document.getElementById('cards-embreve');
  const containerHistorico = document.getElementById('cards-historico');

  // "Em Breve"
  containerEmBreve.innerHTML = state.upcoming.length === 0
    ? '<p class="empty-message">Você não possui agendamentos futuros.</p>'
    : state.upcoming.map(a => cardHTML(a, true)).join('');

  // "Histórico"
  containerHistorico.innerHTML = state.history.length === 0
    ? '<p class="empty-message">Seu histórico está vazio.</p>'
    : state.history.map(a => cardHTML(a, false)).join('');

  containerEmBreve.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () =>
      handleCancelClick(Number(btn.dataset.id), btn.dataset.servico)
    );
  });
}

// ─── CARREGAR AGENDAMENTOS ────────────────────────────────────────────────────
async function carregarAgendamentos() {
  showLoading();

  try {
    const result = await apiRequest('/client/appointments');

    // Validação da estrutura de resposta
    if (!result.success || !result.data || !Array.isArray(result.data.upcoming) || !Array.isArray(result.data.history)) {
      throw new Error('Formato de resposta inesperado da API.');
    }

    state.upcoming = result.data.upcoming;
    state.history  = result.data.history;

    console.log('✅ Agendamentos carregados:', {
      upcoming: state.upcoming.length,
      history:  state.history.length,
    });

    renderCards();
  } catch (err) {
    console.error('❌ Erro ao carregar agendamentos:', err);

    if (err.status === 401 || err.status === 403) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      redirectToLogin();
      return;
    }

    const msg = '<p class="empty-message">Erro ao carregar agendamentos. Tente novamente mais tarde.</p>';
    document.getElementById('cards-embreve').innerHTML   = msg;
    document.getElementById('cards-historico').innerHTML = msg;
  }
}

// ─── OVERLAY / MODAL ──────────────────────────────────────────────────────────
function openOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ─── CANCELAMENTO ─────────────────────────────────────────────────────────────
function handleCancelClick(id, servico) {
  const ag = state.upcoming.find(a => a.id === id);

  if (!ag) {
    console.error('Agendamento não encontrado no estado local:', id);
    return;
  }

  if (!ag.can_cancel) {
    openOverlay('overlay-atencao');
    return;
  }

  state.cancelId = id;
  document.getElementById('modal-servico-nome').textContent = servico;
  openOverlay('overlay-confirmar');
}

async function cancelarAgendamento(id) {
  try {
    const result = await apiRequest(`/client/appointments/${id}/cancel`, { method: 'PATCH' });

    if (result.success) {
      console.log('✅ Agendamento cancelado:', id);
      return { ok: true };
    }

    throw new Error(result.error || 'Erro ao cancelar agendamento.');
  } catch (err) {
    console.error('❌ Erro ao cancelar agendamento:', err);

    if (err.status === 422) {
      return { ok: false, reason: 'less_than_24h' };
    }

    if (err.status === 401 || err.status === 403) {
      return { ok: false, reason: 'auth' };
    }

    if (err.status === 409) {
      return { ok: false, reason: 'already_cancelled' };
    }

    return { ok: false, reason: 'generic', message: err.message };
  }
}

// ─── EVENT LISTENERS DOS MODAIS ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

  // ── Autenticação ──────────────────────────────────────────────────────────
  tokenGlobal = getAuthToken();

  if (!tokenGlobal) {
    console.warn('⚠️ Token não encontrado. Redirecionando para login...');
    alert('Você precisa estar logado para acessar esta página.');
    redirectToLogin();
    return;
  }

  // ── Navbar toggle (mobile) ────────────────────────────────────────────────
  const navToggle = document.getElementById('navbar-toggle');
  const navMenu   = document.getElementById('navbar-nav');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ── Modal: botão "NÃO" ────────────────────────────────────────────────────
  document.getElementById('btn-nao').addEventListener('click', () => {
    closeOverlay('overlay-confirmar');
    state.cancelId = null;
  });

  // ── Modal: botão "SIM, CANCELAR" ──────────────────────────────────────────
  document.getElementById('btn-sim-cancelar').addEventListener('click', async () => {
    if (state.cancelId === null) return;

    const btn = document.getElementById('btn-sim-cancelar');
    const originalText = btn.textContent;
    btn.disabled    = true;
    btn.textContent = 'CANCELANDO...';

    try {
      const res = await cancelarAgendamento(state.cancelId);

      if (res.ok) {
        closeOverlay('overlay-confirmar');
        state.cancelId = null;
        await carregarAgendamentos();
        openOverlay('overlay-sucesso');
        return;
      }

      // Tratamento por tipo de falha
      closeOverlay('overlay-confirmar');

      if (res.reason === 'less_than_24h') {
        openOverlay('overlay-atencao');
      } else if (res.reason === 'auth') {
        alert('Sessão expirada. Por favor, faça login novamente.');
        redirectToLogin();
      } else if (res.reason === 'already_cancelled') {
        alert('Este agendamento já foi cancelado.');
        state.cancelId = null;
        await carregarAgendamentos();
      } else {
        alert(res.message || 'Não foi possível cancelar o agendamento. Tente novamente.');
        state.cancelId = null;
      }
    } finally {
      btn.disabled    = false;
      btn.textContent = originalText;
    }
  });

  // ── Modal: botão "OK" (sucesso) ───────────────────────────────────────────
  document.getElementById('btn-ok-sucesso').addEventListener('click', () => {
    closeOverlay('overlay-sucesso');
  });

  // ── Modal: botão "ENTENDI" (atenção) ─────────────────────────────────────
  document.getElementById('btn-entendi').addEventListener('click', () => {
    closeOverlay('overlay-atencao');
  });

  // ── Fechar overlay ao clicar no backdrop ──────────────────────────────────
  ['overlay-confirmar', 'overlay-sucesso', 'overlay-atencao'].forEach(id => {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === this) closeOverlay(id);
      });
    }
  });

  // ── Fechar overlays com ESC ───────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['overlay-confirmar', 'overlay-sucesso', 'overlay-atencao'].forEach(closeOverlay);
    }
  });

  // ── Carrega os agendamentos ───────────────────────────────────────────────
  console.log('🔄 Carregando agendamentos...');
  await carregarAgendamentos();
});

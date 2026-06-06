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
      <path d="M6 1.5V4.5" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 1.5V4.5" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.25 7.5H15.75" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  clock: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 4.5V9L11.25 11.25" stroke="var(--pink-main)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
};

document.addEventListener('DOMContentLoaded', () => {
  // Lógica do menu mobile
  const navToggle = document.getElementById('navbar-toggle');
  const navMenu = document.getElementById('navbar-nav');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }
});

// ─── FUNÇÕES DE RENDERIZAÇÃO ─────────────────────────────────────────────────
function renderizarCards(agendamentos, containerId, isUpcoming) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // Limpar loading

  if (!agendamentos || agendamentos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum agendamento encontrado.</p>
      </div>`;
    return;
  }

  agendamentos.forEach(item => {
    // Formatação de datas e status simulada (integração backend futura)
    const dataObj = new Date(item.data);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const statusClass = `status--${item.status.toLowerCase()}`;
    
    // Construção do HTML do card
    const card = document.createElement('div');
    card.className = 'card';
    
    let cancelBtnHTML = '';
    if (isUpcoming && item.status === 'Confirmado') {
      cancelBtnHTML = `<button class="btn-cancel" onclick="abrirConfirmacaoCancelamento(${item.id})">Cancelar</button>`;
    }

    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="service-name">${item.servico}</h3>
          <p class="service-pro">com ${item.profissional}</p>
        </div>
        <span class="card-status ${statusClass}">${item.status}</span>
      </div>
      <div class="card-body">
        <div class="info-row">
          ${SVG.calendar}
          <span>${dataFormatada}</span>
        </div>
        <div class="info-row">
          ${SVG.clock}
          <span>${item.horario}</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="service-price">R$ ${item.valor.toFixed(2)}</span>
        ${cancelBtnHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

async function carregarAgendamentos() {
  // Simulando requisição à API para renderizar os dados
  try {
    // Dados mocados temporários para validar o frontend
    state.upcoming = [
      { id: 1, servico: 'Corte Feminino', profissional: 'Maria', status: 'Confirmado', data: '2026-06-15T09:00:00Z', horario: '09:00', valor: 80.00 }
    ];
    state.history = [
      { id: 2, servico: 'Manicure', profissional: 'Cláudia', status: 'Concluido', data: '2026-05-10T14:00:00Z', horario: '14:00', valor: 45.00 },
      { id: 3, servico: 'Limpeza de Pele', profissional: 'Ana', status: 'Cancelado', data: '2026-04-22T10:00:00Z', horario: '10:00', valor: 120.00 }
    ];

    renderizarCards(state.upcoming, 'grid-upcoming', true);
    renderizarCards(state.history, 'grid-history', false);

  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    document.getElementById('grid-upcoming').innerHTML = '<div class="empty-state"><p>Erro ao carregar os dados.</p></div>';
    document.getElementById('grid-history').innerHTML = '<div class="empty-state"><p>Erro ao carregar os dados.</p></div>';
  }
}

// Iniciar carregamento assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', carregarAgendamentos);

// ─── CONTROLADORES DE MODAL ──────────────────────────────────────────────────
function openOverlay(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeOverlay(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

window.abrirConfirmacaoCancelamento = function(id) {
  const item = state.upcoming.find(x => x.id === id);
  if (!item) return;

  const agora = new Date();
  const dataAgendada = new Date(item.data);
  const diferencaHoras = (dataAgendada - agora) / (1000 * 60 * 60);

  if (diferencaHoras < 24) {
    openOverlay('overlay-atencao');
  } else {
    state.cancelId = id;
    openOverlay('overlay-confirmar');
  }
};

// ── Modal: botão "Voltar" (cancelamento) ──────────────────────────────────
  document.getElementById('btn-fechar-confirmar').addEventListener('click', () => {
    closeOverlay('overlay-confirmar');
    state.cancelId = null;
  });

  // ── Modal: botão "Sim, cancelar" (submissão backend simulada) ──────────────
  document.getElementById('btn-sim-cancelar').addEventListener('click', async function () {
    if (!state.cancelId) return;

    const btn = this;
    const originalText = btn.textContent;
    
    btn.disabled    = true;
    btn.textContent = 'Cancelando...';

    try {
      // Simulação da chamada DELETE /api/client/appointments/:id
      // const response = await fetch(`${API_BASE_URL}/client/appointments/${state.cancelId}`, { method: 'DELETE', ... });
      
      const res = { success: true }; // Simulação de sucesso da API

      closeOverlay('overlay-confirmar');

      if (res.success) {
        openOverlay('overlay-sucesso');
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
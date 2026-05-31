'use strict';

// ESTADO DA APLICAÇÃO
const originalData = {
  nome: 'Maria Silva Santos',
  telefone: '(11) 98765-4321',
  email: 'maria.santos@email.com',
};

let currentData = { ...originalData };
let hasUnsavedChanges = false;

// REFERÊNCIAS DOM
const inputNome      = document.getElementById('input-nome');
const inputTelefone  = document.getElementById('input-telefone');
const inputEmail     = document.getElementById('input-email');

const errorNome      = document.getElementById('error-nome');
const errorTelefone  = document.getElementById('error-telefone');
const errorEmail     = document.getElementById('error-email');

const btnSave        = document.getElementById('btn-save');
const btnDiscard     = document.getElementById('btn-discard');
const btnSignout     = document.getElementById('btn-signout');
const btnOpenSenha   = document.getElementById('btn-open-alterar-senha');

// Modais
const modals = {
  alterarSenha:       document.getElementById('modal-alterar-senha'),
  sucessoSenha:       document.getElementById('modal-sucesso-senha'),
  sucessoDados:       document.getElementById('modal-sucesso-dados'),
  confirmarSalvar:    document.getElementById('modal-confirmar-salvar'),
  confirmarDescartar: document.getElementById('modal-confirmar-descartar'),
  confirmarSair:      document.getElementById('modal-confirmar-sair'),
  erro:               document.getElementById('modal-erro'),
};

// Campos senha
const inputSenhaAtual      = document.getElementById('input-senha-atual');
const inputNovaSenha       = document.getElementById('input-nova-senha');
const inputConfirmarSenha  = document.getElementById('input-confirmar-senha');

const errorSenhaAtual      = document.getElementById('error-senha-atual');
const errorNovaSenha       = document.getElementById('error-nova-senha');
const errorConfirmarSenha  = document.getElementById('error-confirmar-senha');

// Editar Campos
document.querySelectorAll('.field-group').forEach(group => {
  const editBtn = group.querySelector('.edit-btn');
  const input   = group.querySelector('.field-input');
  if (!editBtn || !input) return;

  editBtn.addEventListener('click', () => {
    const isLocked = input.disabled;
    if (isLocked) {
      input.disabled = false;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
      editBtn.classList.add('active');
      editBtn.setAttribute('aria-label', editBtn.getAttribute('aria-label').replace('Editar', 'Bloqueando'));
    } else {
      input.disabled = true;
      editBtn.classList.remove('active');
      editBtn.setAttribute('aria-label', editBtn.getAttribute('aria-label').replace('Bloqueando', 'Editar'));
    }
  });
});

// UTILITÁRIOS DE MODAL
function openModal(modal) {
  modal.classList.add('active');
  const focusable = modal.querySelector('button, input');
  if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeModal(modal) {
  modal.classList.remove('active');
}

Object.values(modals).forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Object.values(modals).forEach(m => closeModal(m));
  }
});
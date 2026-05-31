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

// MÁSCARA DE TELEFONE
function applyPhoneMask(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2)  return `(${digits}`;
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

inputTelefone.addEventListener('input', (e) => {
  const raw = e.target.value;
  const cursor = e.target.selectionStart;
  const masked = applyPhoneMask(raw);
  e.target.value = masked;
  const diff = masked.length - raw.length;
  e.target.setSelectionRange(cursor + diff, cursor + diff);
  onFieldChange();
});

// Notar Alterações
function onFieldChange() {
  const nome     = inputNome.value.trim();
  const telefone = inputTelefone.value.trim();
  const email    = inputEmail.value.trim().toLowerCase();

  const changed =
    nome     !== originalData.nome     ||
    telefone !== originalData.telefone ||
    email    !== originalData.email;

  hasUnsavedChanges = changed;
  btnSave.disabled = !changed;
  btnSave.setAttribute('aria-disabled', String(!changed));
}

inputNome.addEventListener('input', onFieldChange);
inputEmail.addEventListener('input', onFieldChange);

// Higienização: do email
inputEmail.addEventListener('blur', () => {
  inputEmail.value = inputEmail.value.toLowerCase();
});

// VALIDAÇÕES DOS CAMPOS PRINCIPAIS
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('visible');
  const input = document.getElementById(el.id.replace('error-', 'input-'));
  if (input) input.classList.add('error');
}

function clearError(el) {
  el.textContent = '';
  el.classList.remove('visible');
  const input = document.getElementById(el.id.replace('error-', 'input-'));
  if (input) input.classList.remove('error');
}

function clearAllMainErrors() {
  clearError(errorNome);
  clearError(errorTelefone);
  clearError(errorEmail);
}

// Validação enquanto digita
inputNome.addEventListener('blur', () => validateNome(inputNome.value));
inputTelefone.addEventListener('blur', () => validateTelefone(inputTelefone.value));
inputEmail.addEventListener('blur', () => validateEmail(inputEmail.value));

function validateNome(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    showError(errorNome, 'O nome não pode ficar em branco.');
    return false;
  }
  // Contar só letras pra validar a quantidade no nome
  const lettersOnly = trimmed.replace(/\s/g, '');
  if (lettersOnly.length < 3) {
    showError(errorNome, 'O nome deve ter pelo menos 3 letras.');
    return false;
  }
  clearError(errorNome);
  return true;
}

function validateTelefone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    showError(errorTelefone, 'Formato de telefone inválido. Ex: (XX) 9XXXX-XXXX');
    return false;
  }
  clearError(errorTelefone);
  return true;
}

function validateEmail(value) {
  const lower = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lower)) {
    showError(errorEmail, 'Formato de e-mail inválido. Ex: usuario@dominio.com');
    return false;
  }
  clearError(errorEmail);
  return true;
}

function validateAllFields() {
  const vNome     = validateNome(inputNome.value);
  const vTelefone = validateTelefone(inputTelefone.value);
  const vEmail    = validateEmail(inputEmail.value);
  return vNome && vTelefone && vEmail;
}
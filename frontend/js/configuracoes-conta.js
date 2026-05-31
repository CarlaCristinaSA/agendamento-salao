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

// FLUXO: SALVAR
btnSave.addEventListener('click', () => {
  if (!validateAllFields()) return;
  openModal(modals.confirmarSalvar);
});

document.getElementById('btn-cancelar-salvar').addEventListener('click', () => {
  closeModal(modals.confirmarSalvar);
});

document.getElementById('btn-sim-salvar').addEventListener('click', () => {
  closeModal(modals.confirmarSalvar);
  persistData();
});

function persistData() {
  const nome     = inputNome.value.trim();
  const telefone = inputTelefone.value.trim();
  const email    = inputEmail.value.trim().toLowerCase();

  // Simula latência de rede
  btnSave.disabled = true;
  btnSave.textContent = 'Salvando…';

  setTimeout(() => {
    const success = true;

    btnSave.textContent = 'Salvar';

    if (success) {
      originalData.nome     = nome;
      originalData.telefone = telefone;
      originalData.email    = email;

      inputNome.value     = nome;
      inputEmail.value    = email;

      [inputNome, inputTelefone, inputEmail].forEach(input => {
        input.disabled = true;
      });
      document.querySelectorAll('.field-group .edit-btn').forEach(btn => {
        btn.classList.remove('active');
        const label = btn.getAttribute('aria-label');
        if (label) btn.setAttribute('aria-label', label.replace('Bloqueando', 'Editar'));
      });

      hasUnsavedChanges = false;
      btnSave.disabled  = true;
      btnSave.setAttribute('aria-disabled', 'true');

      openModal(modals.sucessoDados);
    } else {
      openModal(modals.erro);
    }
  }, 800);
}

document.getElementById('btn-ok-dados').addEventListener('click', () => {
  closeModal(modals.sucessoDados);
});

document.getElementById('btn-tentar-novamente').addEventListener('click', () => {
  closeModal(modals.erro);
  persistData();
});

// FLUXO: DESCARTAR
btnDiscard.addEventListener('click', () => {
  if (!hasUnsavedChanges) return;
  openModal(modals.confirmarDescartar);
});

document.getElementById('btn-cancelar-descartar').addEventListener('click', () => {
  closeModal(modals.confirmarDescartar);
});

document.getElementById('btn-sim-descartar').addEventListener('click', () => {
  closeModal(modals.confirmarDescartar);
  discardChanges();
});

function discardChanges() {
  inputNome.value     = originalData.nome;
  inputTelefone.value = originalData.telefone;
  inputEmail.value    = originalData.email;

  [inputNome, inputTelefone, inputEmail].forEach(input => {
    input.disabled = true;
  });
  document.querySelectorAll('.field-group .edit-btn').forEach(btn => {
    btn.classList.remove('active');
    const label = btn.getAttribute('aria-label');
    if (label) btn.setAttribute('aria-label', label.replace('Bloqueando', 'Editar'));
  });

  clearAllMainErrors();
  hasUnsavedChanges = false;
  btnSave.disabled  = true;
  btnSave.setAttribute('aria-disabled', 'true');
}

// FLUXO: SAIR DA CONTA
btnSignout.addEventListener('click', () => {
  openModal(modals.confirmarSair);
});

document.getElementById('btn-cancelar-sair').addEventListener('click', () => {
  closeModal(modals.confirmarSair);
});

document.getElementById('btn-sim-sair').addEventListener('click', () => {
  closeModal(modals.confirmarSair);
  alert('Sessão encerrada. Redirecionando para o login...');
});

// AVISO AO SAIR DA PÁGINA COM ALTERAÇÕES PENDENTES
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// FLUXO: ALTERAR SENHA
btnOpenSenha.addEventListener('click', () => {
  inputSenhaAtual.value     = '';
  inputNovaSenha.value      = '';
  inputConfirmarSenha.value = '';
  clearError(errorSenhaAtual);
  clearError(errorNovaSenha);
  clearError(errorConfirmarSenha);
  openModal(modals.alterarSenha);
});

document.getElementById('btn-cancelar-senha').addEventListener('click', () => {
  closeModal(modals.alterarSenha);
});

document.querySelectorAll('.icon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      btn.classList.add('active');
      btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Mostrar', 'Ocultar'));
    } else {
      input.type = 'password';
      btn.classList.remove('active');
      btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Ocultar', 'Mostrar'));
    }
  });
});

// VALIDAÇÕES DE SENHA
// Senha atual: não pode estar vazia
inputSenhaAtual.addEventListener('blur', () => {
  if (!inputSenhaAtual.value) {
    showError(errorSenhaAtual, 'Informe a senha atual.');
  } else {
    clearError(errorSenhaAtual);
  }
});

// Nova senha: regras de complexidade
inputNovaSenha.addEventListener('input', () => validateNovaSenha());

function validateNovaSenha() {
  const val = inputNovaSenha.value;
  if (!val) {
    clearError(errorNovaSenha);
    return false;
  }
  const rules = [
    { re: /.{8,}/,        msg: 'A senha deve ter pelo menos 8 caracteres.' },
    { re: /[A-Z]/,         msg: 'A senha deve conter pelo menos uma letra maiúscula.' },
    { re: /[a-z]/,         msg: 'A senha deve conter pelo menos uma letra minúscula.' },
    { re: /[0-9]/,         msg: 'A senha deve conter pelo menos um número.' },
    { re: /[@#$%!&*^()\-_+=<>?.]/,msg: 'A senha deve conter pelo menos um caractere especial (@, #, $, %, etc.).' },
  ];

  for (const rule of rules) {
    if (!rule.re.test(val)) {
      showError(errorNovaSenha, rule.msg);
      return false;
    }
  }
  clearError(errorNovaSenha);
  return true;
}

// Confirmar senha: deve ser idêntica à nova
inputConfirmarSenha.addEventListener('input', () => validateConfirmarSenha());

function validateConfirmarSenha() {
  const val = inputConfirmarSenha.value;
  if (!val) {
    clearError(errorConfirmarSenha);
    return false;
  }
  if (val !== inputNovaSenha.value) {
    showError(errorConfirmarSenha, 'As senhas não coincidem.');
    return false;
  }
  clearError(errorConfirmarSenha);
  return true;
}

document.getElementById('btn-confirmar-senha').addEventListener('click', () => {
  let valid = true;

  // Senha atual obrigatória
  if (!inputSenhaAtual.value) {
    showError(errorSenhaAtual, 'Informe a senha atual.');
    valid = false;
  } else {
    clearError(errorSenhaAtual);
  }

  // Nova senha
  if (!inputNovaSenha.value) {
    showError(errorNovaSenha, 'Informe a nova senha.');
    valid = false;
  } else if (!validateNovaSenha()) {
    valid = false;
  }

  // Nova senha não pode ser igual à atual
  if (inputNovaSenha.value && inputSenhaAtual.value && inputNovaSenha.value === inputSenhaAtual.value) {
    showError(errorNovaSenha, 'A nova senha não pode ser igual à senha atual.');
    valid = false;
  }

  // Confirmar senha
  if (!inputConfirmarSenha.value) {
    showError(errorConfirmarSenha, 'Confirme a nova senha.');
    valid = false;
  } else if (!validateConfirmarSenha()) {
    valid = false;
  }

  if (!valid) return;

  // Simula verificação com backend
  closeModal(modals.alterarSenha);

  setTimeout(() => {
    openModal(modals.sucessoSenha);
  }, 200);
});

document.getElementById('btn-ok-senha').addEventListener('click', () => {
  closeModal(modals.sucessoSenha);
});
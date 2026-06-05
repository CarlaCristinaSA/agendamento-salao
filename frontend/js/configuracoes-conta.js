'use strict';

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
// Ajuste a porta/URL conforme o seu ambiente local
const URL_API = 'http://localhost:3000/api';

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
const originalData = {
  nome: '',
  telefone: '',
  email: '',
};

let hasUnsavedChanges = false;
let tokenGlobal = null;
let pendingRetry = null;

// ==========================================
// REFERÊNCIAS DOM
// ==========================================
const inputNome     = document.getElementById('input-nome');
const inputTelefone = document.getElementById('input-telefone');
const inputEmail    = document.getElementById('input-email');

const errorNome     = document.getElementById('error-nome');
const errorTelefone = document.getElementById('error-telefone');
const errorEmail    = document.getElementById('error-email');

const btnSave    = document.getElementById('btn-save');
const btnDiscard = document.getElementById('btn-discard');
const btnSignout = document.getElementById('btn-signout');
const btnOpenSenha = document.getElementById('btn-open-alterar-senha');

const modals = {
  alterarSenha:       document.getElementById('modal-alterar-senha'),
  sucessoSenha:       document.getElementById('modal-sucesso-senha'),
  sucessoDados:       document.getElementById('modal-sucesso-dados'),
  confirmarSalvar:    document.getElementById('modal-confirmar-salvar'),
  confirmarDescartar: document.getElementById('modal-confirmar-descartar'),
  confirmarSair:      document.getElementById('modal-confirmar-sair'),
  erro:               document.getElementById('modal-erro'),
};

const inputSenhaAtual     = document.getElementById('input-senha-atual');
const inputNovaSenha      = document.getElementById('input-nova-senha');
const inputConfirmarSenha = document.getElementById('input-confirmar-senha');

const errorSenhaAtual     = document.getElementById('error-senha-atual');
const errorNovaSenha      = document.getElementById('error-nova-senha');
const errorConfirmarSenha = document.getElementById('error-confirmar-senha');

// ==========================================
// UTILITÁRIOS
// ==========================================
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  const focusable = modal.querySelector('button, input');
  if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
}

function getAuthToken() {
  return (
    localStorage.getItem('tokenGlobal') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('tokenGlobal') ||
    sessionStorage.getItem('token') ||
    null
  );
}

function setAuthToken(token) {
  tokenGlobal = token;
  localStorage.setItem('tokenGlobal', token);
}

async function apiRequest(path, { method = 'GET', body = null } = {}) {
  if (!tokenGlobal) {
    tokenGlobal = getAuthToken();
  }

  if (!tokenGlobal) {
    throw new Error('Token JWT não encontrado. Faça login novamente.');
  }

  const res = await fetch(`${URL_API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenGlobal}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    const errMsg = json.error || json.message || `Erro ${res.status}`;
    const error = new Error(errMsg);
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

// ==========================================
// FEEDBACKS DE ERRO / SUCESSO NOS CAMPOS
// ==========================================
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  const input = document.getElementById(el.id.replace('error-', 'input-'));
  if (input) input.classList.add('error');
}

function clearError(el) {
  if (!el) return;
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

// ==========================================
// MODAIS
// ==========================================
Object.values(modals).forEach(modal => {
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Object.values(modals).forEach(m => closeModal(m));
  }
});

// ==========================================
// MÁSCARA DE TELEFONE
// ==========================================
function applyPhoneMask(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0)  return '';
  if (digits.length <= 2)   return `(${digits}`;
  if (digits.length <= 6)   return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)  return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

function validatePhoneDigits(phoneMasked) {
  const digits = String(phoneMasked).replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

inputTelefone.addEventListener('input', (e) => {
  const raw    = e.target.value;
  const start  = e.target.selectionStart;
  const masked = applyPhoneMask(raw);
  e.target.value = masked;

  const diff = masked.length - raw.length;
  const newPos = Math.max(0, start + diff);
  try {
    e.target.setSelectionRange(newPos, newPos);
  } catch (_) {}

  onProfileInputChange();
});

// ==========================================
// VALIDAÇÕES DOS CAMPOS DE PERFIL
// ==========================================
function validateNome(value) {
  const trimmed = String(value).trim();
  if (!trimmed) {
    showError(errorNome, 'O nome não pode ficar em branco.');
    return false;
  }
  const lettersOnly = trimmed.replace(/\s/g, '');
  if (lettersOnly.length < 3) {
    showError(errorNome, 'O nome deve ter pelo menos 3 letras.');
    return false;
  }
  clearError(errorNome);
  return true;
}

function validateTelefone(value) {
  if (!value || !validatePhoneDigits(value)) {
    showError(errorTelefone, 'Formato de telefone inválido.');
    return false;
  }
  clearError(errorTelefone);
  return true;
}

function validateEmail(value) {
  const lower = String(value).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lower)) {
    showError(errorEmail, 'Formato de e-mail inválido.');
    return false;
  }
  clearError(errorEmail);
  return true;
}

// ==========================================
// LÓGICA DE ESTADO DOS CAMPOS
// ==========================================

function getNormalizedProfileDraft() {
  return {
    nome:     inputNome.value.trim(),
    telefone: inputTelefone.value.trim(),
    email:    inputEmail.value.trim().toLowerCase(),
  };
}

function getProfileChangedFlags(draft) {
  return {
    nomeChanged:     draft.nome     !== originalData.nome,
    telefoneChanged: draft.telefone !== originalData.telefone,
    emailChanged:    draft.email    !== originalData.email,
  };
}

function getChangedAndValid(draft) {
  const flags = getProfileChangedFlags(draft);
  const anyChanged = flags.nomeChanged || flags.telefoneChanged || flags.emailChanged;

  if (!anyChanged) return { anyChanged: false, isValid: false };

  let isValid = true;
  if (flags.nomeChanged     && !validateNome(draft.nome))         isValid = false;
  if (flags.telefoneChanged && !validateTelefone(draft.telefone)) isValid = false;
  if (flags.emailChanged    && !validateEmail(draft.email))       isValid = false;

  return { anyChanged, isValid };
}

function updateSaveEnabledState() {
  const draft = getNormalizedProfileDraft();
  const { anyChanged, isValid } = getChangedAndValid(draft);

  const shouldEnable = anyChanged && isValid;
  btnSave.disabled = !shouldEnable;
  btnSave.setAttribute('aria-disabled', String(!shouldEnable));
  hasUnsavedChanges = anyChanged;
}

inputNome.addEventListener('input', onProfileInputChange);

inputEmail.addEventListener('input', () => {
  inputEmail.value = inputEmail.value.toLowerCase();
  onProfileInputChange();
});

inputNome.addEventListener('blur', ()     => validateNome(inputNome.value));
inputTelefone.addEventListener('blur', () => validateTelefone(inputTelefone.value));
inputEmail.addEventListener('blur', ()    => validateEmail(inputEmail.value));

function onProfileInputChange() {
  updateSaveEnabledState();
}

// ==========================================
// BOTÕES DE EDITAR CAMPO 
// ==========================================
document.querySelectorAll('.field-group').forEach(group => {
  const editBtn = group.querySelector('.edit-btn');
  const input   = group.querySelector('.field-input');
  if (!editBtn || !input) return;

  editBtn.addEventListener('click', () => {
    const isLocked = input.disabled;
    if (isLocked) {
      input.disabled = false;
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
      editBtn.classList.add('active');
      const aria = editBtn.getAttribute('aria-label') || 'Editar';
      editBtn.setAttribute('aria-label', aria.replace('Editar', 'Bloqueando'));
    } else {
      input.disabled = true;
      editBtn.classList.remove('active');
      const aria = editBtn.getAttribute('aria-label') || 'Bloqueando';
      editBtn.setAttribute('aria-label', aria.replace('Bloqueando', 'Editar'));
    }
    onProfileInputChange();
  });
});

// ==========================================
// SALVAR DADOS DE PERFIL
// ==========================================
btnSave.disabled = true;
btnSave.setAttribute('aria-disabled', 'true');

btnSave.addEventListener('click', () => {
  const draft = getNormalizedProfileDraft();
  const { anyChanged, isValid } = getChangedAndValid(draft);
  if (!anyChanged || !isValid) return;
  openModal(modals.confirmarSalvar);
});

document.getElementById('btn-cancelar-salvar').addEventListener('click', () => {
  closeModal(modals.confirmarSalvar);
});

document.getElementById('btn-sim-salvar').addEventListener('click', async () => {
  closeModal(modals.confirmarSalvar);
  await persistProfile();
});

async function persistProfile() {
  const draft = getNormalizedProfileDraft();
  const flags = getProfileChangedFlags(draft);
  if (!(flags.nomeChanged || flags.telefoneChanged || flags.emailChanged)) return;

  btnSave.disabled = true;
  btnSave.setAttribute('aria-disabled', 'true');
  const originalText = btnSave.textContent;
  btnSave.textContent = 'Salvando…';

  try {
    const payload = {
      name:  draft.nome,
      email: draft.email,
      phone: draft.telefone,
    };

    const result = await apiRequest('/auth/me', { method: 'PUT', body: payload });
    const data = result.data;

    originalData.nome     = data.name  || draft.nome;
    originalData.email    = (data.email || draft.email).toLowerCase();
    originalData.telefone = data.phone || draft.telefone;

    inputNome.value     = originalData.nome;
    inputTelefone.value = originalData.telefone;
    inputEmail.value    = originalData.email;

    lockAllProfileFields();

    hasUnsavedChanges = false;
    openModal(modals.sucessoDados);
  } catch (err) {
    const retryDraft = { ...draft };
    pendingRetry = () => persistProfile();

    // Atualiza o subtítulo do modal com o erro retornado pelo backend
    const modalErrorSubtitle = document.querySelector('#modal-erro .modal-subtitle');
    if (modalErrorSubtitle) {
      modalErrorSubtitle.textContent = err.message || 'Não foi possível salvar as alterações no momento. Verifique sua conexão e tente novamente.';
    }

    openModal(modals.erro);
  } finally {
    btnSave.textContent = originalText;
    updateSaveEnabledState();
  }
}

document.getElementById('btn-ok-dados').addEventListener('click', () => {
  closeModal(modals.sucessoDados);
});

document.getElementById('btn-tentar-novamente').addEventListener('click', async () => {
  closeModal(modals.erro);
  if (typeof pendingRetry === 'function') {
    const fn = pendingRetry;
    pendingRetry = null;
    await fn();
  }
});

// ==========================================
// DESCARTAR ALTERAÇÕES
// ==========================================
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

  lockAllProfileFields();
  clearAllMainErrors();
  hasUnsavedChanges = false;
  updateSaveEnabledState();
}

function lockAllProfileFields() {
  [inputNome, inputTelefone, inputEmail].forEach(input => {
    input.disabled = true;
  });
  document.querySelectorAll('.field-group .edit-btn').forEach(btn => {
    btn.classList.remove('active');
    const label = btn.getAttribute('aria-label') || '';
    btn.setAttribute('aria-label', label.replace('Bloqueando', 'Editar'));
  });
}

// ==========================================
// SAIR DA CONTA
// ==========================================
btnSignout.addEventListener('click', () => {
  openModal(modals.confirmarSair);
});

document.getElementById('btn-cancelar-sair').addEventListener('click', () => {
  closeModal(modals.confirmarSair);
});

document.getElementById('btn-sim-sair').addEventListener('click', async () => {
  closeModal(modals.confirmarSair);

  try {
    if (!tokenGlobal) tokenGlobal = getAuthToken();
    if (tokenGlobal) {
      await fetch(`${URL_API}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenGlobal}` },
      });
    }
  } catch (_) {
  }

  localStorage.removeItem('tokenGlobal');
  localStorage.removeItem('token');
  sessionStorage.removeItem('tokenGlobal');
  sessionStorage.removeItem('token');
  window.location.href = '/';
});

// ==========================================
// AVISO AO SAIR COM ALTERAÇÕES PENDENTES
// ==========================================
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ==========================================
// FLUXO ALTERAR SENHA
// ==========================================
btnOpenSenha.addEventListener('click', () => {
  inputSenhaAtual.value = '';
  inputNovaSenha.value  = '';
  inputConfirmarSenha.value = '';
  clearError(errorSenhaAtual);
  clearError(errorNovaSenha);
  clearError(errorConfirmarSenha);

  openModal(modals.alterarSenha);
});

document.getElementById('btn-cancelar-senha').addEventListener('click', () => {
  closeModal(modals.alterarSenha);
  inputSenhaAtual.value = '';
  inputNovaSenha.value  = '';
  inputConfirmarSenha.value = '';
  clearError(errorSenhaAtual);
  clearError(errorNovaSenha);
  clearError(errorConfirmarSenha);
});

document.querySelectorAll('.icon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.classList.toggle('active', isHidden);

    const aria = btn.getAttribute('aria-label') || '';
    btn.setAttribute(
      'aria-label',
      isHidden ? aria.replace('Mostrar', 'Ocultar') : aria.replace('Ocultar', 'Mostrar')
    );
  });
});

function passwordStrongRules(value) {
  const rules = [
    { re: /.{8,}/,                  msg: 'A senha deve conter pelo menos 8 caracteres.' },
    { re: /[A-Z]/,                  msg: 'A senha deve conter pelo menos uma letra maiúscula.' },
    { re: /[a-z]/,                  msg: 'A senha deve conter pelo menos uma letra minúscula.' },
    { re: /\d/,                     msg: 'A senha deve conter pelo menos um número.' },
    { re: /[@#$%!&*^()\-_+=<>?.]/, msg: 'A senha deve conter pelo menos um caractere especial (@, #, $, %, etc.).' },
  ];

  for (const rule of rules) {
    if (!rule.re.test(value)) return rule.msg;
  }
  return null;
}

inputNovaSenha.addEventListener('input', () => {
  if (!inputNovaSenha.value) {
    clearError(errorNovaSenha);
    return;
  }
  const msg = passwordStrongRules(inputNovaSenha.value);
  if (msg) showError(errorNovaSenha, msg);
  else clearError(errorNovaSenha);
});

inputConfirmarSenha.addEventListener('input', () => {
  if (!inputConfirmarSenha.value) {
    clearError(errorConfirmarSenha);
    return;
  }
  if (inputConfirmarSenha.value !== inputNovaSenha.value) {
    showError(errorConfirmarSenha, 'As senhas não coincidem.');
  } else {
    clearError(errorConfirmarSenha);
  }
});

inputSenhaAtual.addEventListener('blur', () => {
  if (!inputSenhaAtual.value) showError(errorSenhaAtual, 'Informe a senha atual.');
  else clearError(errorSenhaAtual);
});

document.getElementById('btn-confirmar-senha').addEventListener('click', async () => {
  let valid = true;

  if (!inputSenhaAtual.value) {
    showError(errorSenhaAtual, 'Informe a senha atual.');
    valid = false;
  } else {
    clearError(errorSenhaAtual);
  }

  if (!inputNovaSenha.value) {
    showError(errorNovaSenha, 'Informe a nova senha.');
    valid = false;
  } else {
    const msg = passwordStrongRules(inputNovaSenha.value);
    if (msg) {
      showError(errorNovaSenha, msg);
      valid = false;
    } else {
      clearError(errorNovaSenha);
    }
  }

  if (!inputConfirmarSenha.value) {
    showError(errorConfirmarSenha, 'Confirme a nova senha.');
    valid = false;
  } else if (inputConfirmarSenha.value !== inputNovaSenha.value) {
    showError(errorConfirmarSenha, 'As senhas não coincidem.');
    valid = false;
  } else {
    clearError(errorConfirmarSenha);
  }

  if (valid && inputNovaSenha.value === inputSenhaAtual.value) {
    showError(errorNovaSenha, 'A nova senha não pode ser igual à senha atual.');
    valid = false;
  }

  if (!valid) return;

  const senhaPayload = {
    currentPassword:    inputSenhaAtual.value,
    newPassword:        inputNovaSenha.value,
    confirmNewPassword: inputConfirmarSenha.value,
  };

  const btn = document.getElementById('btn-confirmar-senha');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await apiRequest('/auth/me/password', { method: 'PUT', body: senhaPayload });

    inputSenhaAtual.value     = '';
    inputNovaSenha.value      = '';
    inputConfirmarSenha.value = '';

    closeModal(modals.alterarSenha);
    openModal(modals.sucessoSenha);
  } catch (err) {
    pendingRetry = async () => {
      await apiRequest('/auth/me/password', { method: 'PUT', body: senhaPayload });
      closeModal(modals.alterarSenha);
      openModal(modals.sucessoSenha);
    };

    // Atualiza o subtítulo do modal com o erro retornado pelo backend (ex: senha atual incorreta)
    const modalErrorSubtitle = document.querySelector('#modal-erro .modal-subtitle');
    if (modalErrorSubtitle) {
      modalErrorSubtitle.textContent = err.message || 'Não foi possível alterar a senha. Verifique sua conexão e tente novamente.';
    }

    closeModal(modals.alterarSenha);
    openModal(modals.erro);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

document.getElementById('btn-ok-senha').addEventListener('click', () => {
  closeModal(modals.sucessoSenha);
});

// ==========================================
// INICIALIZAÇÃO — carregar dados do usuário via API
// ==========================================
async function carregarPerfil() {
  inputNome.value     = '';
  inputTelefone.value = '';
  inputEmail.value    = '';
  inputNome.disabled     = true;
  inputTelefone.disabled = true;
  inputEmail.disabled    = true;

  const existing = getAuthToken();
  if (existing) setAuthToken(existing);

  try {
    const result = await apiRequest('/auth/me', { method: 'GET' });
    const data = result.data;

    originalData.nome     = data.name  || '';
    originalData.telefone = data.phone || '';
    originalData.email    = (data.email || '').toLowerCase();
    inputNome.value     = originalData.nome;
    inputTelefone.value = originalData.telefone;
    inputEmail.value    = originalData.email;

    lockAllProfileFields();
    clearAllMainErrors();
    hasUnsavedChanges = false;
    updateSaveEnabledState();
  } catch (err) {
    pendingRetry = carregarPerfil;
    
    // Mostra erro caso o token seja inválido ou o servidor esteja fora
    const modalErrorSubtitle = document.querySelector('#modal-erro .modal-subtitle');
    if (modalErrorSubtitle) {
      modalErrorSubtitle.textContent = err.message || 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.';
    }
    
    openModal(modals.erro);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarPerfil();
});
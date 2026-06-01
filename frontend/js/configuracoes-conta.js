'use strict';

const URL_API = 'http://localhost:3000/api';

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
const originalData = {
  nome: '',
  telefone: '',
  email: '',
};

let currentData = { ...originalData };
let hasUnsavedChanges = false;
let tokenGlobal = null;
let pendingRetry = null;

// ==========================================
// REFERÊNCIAS DOM
// ==========================================
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

// ==========================================
// UTILITÁRIOS
// ==========================================
function openModal(modal) {
  modal.classList.add('active');
  const focusable = modal.querySelector('button, input');
  if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function getAuthToken() {
  // Padrão mais comum: localStorage/tokenGlobal (pode variar no seu sistema)
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

async function apiRequest(path, { method = 'GET', body = null, extraHeaders = {} } = {}) {
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
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    const errMsg = json.error || `Erro ${res.status}`;
    const error = new Error(errMsg);
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

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

// ==========================================
// MODAIS (close overlay / ESC)
// ==========================================
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

// ==========================================
// MÁSCARA + VALIDAÇÕES (HU-012)
// ==========================================
function applyPhoneMask(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validatePhoneDigits(phoneMasked) {
  const digits = String(phoneMasked).replace(/\D/g, '');
  // HU-012: 10 ou 11 dígitos (considerando DDD)
  return digits.length === 10 || digits.length === 11;
}

inputTelefone.addEventListener('input', (e) => {
  const raw = e.target.value;
  const cursor = e.target.selectionStart;
  const masked = applyPhoneMask(raw);
  e.target.value = masked;
  const diff = masked.length - raw.length;
  try {
    e.target.setSelectionRange(cursor + diff, cursor + diff);
  } catch (_) {}

  onProfileInputChange();
});

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

function getNormalizedProfileDraft() {
  return {
    nome: inputNome.value.trim(),
    telefone: inputTelefone.value.trim(),
    email: inputEmail.value.trim().toLowerCase(),
  };
}

function getProfileChangedFlags(draft) {
  return {
    nomeChanged: draft.nome !== originalData.nome,
    telefoneChanged: draft.telefone !== originalData.telefone,
    emailChanged: draft.email !== originalData.email,
  };
}

function validateDraftForChangedFields(draft) {
  const flags = getProfileChangedFlags(draft);

  // HU-012: impedir salvamento caso Nome inválido, Telefone incompleto, Email inválido.
  // Aplicamos isso apenas nos campos modificados, mas como regras são essenciais do perfil,
  // na prática o usuário precisa ter todos válidos se mexer em algo.
  if (flags.nomeChanged) {
    if (!validateNome(draft.nome)) return false;
  }
  if (flags.telefoneChanged) {
    if (!validateTelefone(draft.telefone)) return false;
  }
  if (flags.emailChanged) {
    if (!validateEmail(draft.email)) return false;
  }

  // Se não alterou nenhum, não deve salvar.
  return flags.nomeChanged || flags.telefoneChanged || flags.emailChanged;
}

function updateSaveEnabledState() {
  const draft = getNormalizedProfileDraft();
  const changed = getProfileChangedFlags(draft);
  const anyChanged = changed.nomeChanged || changed.telefoneChanged || changed.emailChanged;

  // Habilitar salvar somente se há alteração real e os campos alterados estão válidos.
  const valid = validateDraftForChangedFields(draft);

  btnSave.disabled = !(anyChanged && valid);
  btnSave.setAttribute('aria-disabled', String(btnSave.disabled));
  hasUnsavedChanges = anyChanged;
}

inputNome.addEventListener('input', onProfileInputChange);
inputEmail.addEventListener('input', () => {
  // Higieniza durante edição: minúsculo antes do envio
  inputEmail.value = inputEmail.value.toLowerCase();
  onProfileInputChange();
});

inputNome.addEventListener('blur', () => validateNome(inputNome.value));
inputTelefone.addEventListener('blur', () => validateTelefone(inputTelefone.value));
inputEmail.addEventListener('blur', () => validateEmail(inputEmail.value));

function onProfileInputChange() {
  // Recalcula estado do botão sem forçar mensagens agressivas.
  updateSaveEnabledState();
}

// ==========================================
// EDITAR CAMPOS
// ==========================================
document.querySelectorAll('.field-group').forEach(group => {
  const editBtn = group.querySelector('.edit-btn');
  const input = group.querySelector('.field-input');
  if (!editBtn || !input) return;

  editBtn.addEventListener('click', () => {
    const isLocked = input.disabled;
    if (isLocked) {
      input.disabled = false;
      input.focus();
      const len = input.value.length;
      try { input.setSelectionRange(len, len); } catch (_) {}
      editBtn.classList.add('active');
      const aria = editBtn.getAttribute('aria-label') || 'Editar';
      editBtn.setAttribute('aria-label', aria.replace('Editar', 'Bloqueando'));
    } else {
      input.disabled = true;
      editBtn.classList.remove('active');
      const aria = editBtn.getAttribute('aria-label') || 'Bloqueando';
      editBtn.setAttribute('aria-label', aria.replace('Bloqueando', 'Editar'));
      // Ao desabilitar, não reverte valor automaticamente (HU-012 só exige Cancelar/Descartar).
    }
    onProfileInputChange();
  });
});

// ==========================================
// SALVAR / DESCARTAR (HU-012)
// ==========================================
btnSave.addEventListener('click', () => {
  const draft = getNormalizedProfileDraft();
  const flags = getProfileChangedFlags(draft);
  const anyChanged = flags.nomeChanged || flags.telefoneChanged || flags.emailChanged;

  if (!anyChanged) return;

  // valida e exibe erros específicos abaixo dos campos
  if (!validateDraftForChangedFields(draft)) return;

  openModal(modals.confirmarSalvar);
});

// Sempre protege contra salvar com estado inválido por mudança de UI
btnSave.disabled = true;
btnSave.setAttribute('aria-disabled', 'true');

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
  const originalText = btnSave.textContent;
  btnSave.textContent = 'Salvando…';

  try {
    const payload = {
      name: draft.nome,
      email: draft.email,
      phone: draft.telefone,
    };

    const result = await apiRequest('/auth/me', { method: 'PUT', body: payload });

    const data = result.data;

    // Atualiza sessão do usuário na tela
    originalData.nome = data.name;
    originalData.email = data.email;
    originalData.telefone = data.phone;

    inputNome.value = originalData.nome;
    inputTelefone.value = originalData.telefone;
    inputEmail.value = originalData.email;

    [inputNome, inputTelefone, inputEmail].forEach(i => { i.disabled = true; });
    document.querySelectorAll('.field-group .edit-btn').forEach(btn => {
      btn.classList.remove('active');
      const label = btn.getAttribute('aria-label');
      if (label) btn.setAttribute('aria-label', label.replace('Bloqueando', 'Editar'));
    });

    hasUnsavedChanges = false;
    btnSave.textContent = originalText;

    // recalcula status
    updateSaveEnabledState();

    openModal(modals.sucessoDados);
  } catch (err) {
    btnSave.textContent = originalText;

    openModal(modals.erro);
    pendingRetry = persistProfile;
  } finally {
    btnSave.textContent = originalText;
    btnSave.disabled = false;
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
  inputNome.value = originalData.nome;
  inputTelefone.value = originalData.telefone;
  inputEmail.value = originalData.email;

  [inputNome, inputTelefone, inputEmail].forEach(input => { input.disabled = true; });
  document.querySelectorAll('.field-group .edit-btn').forEach(btn => {
    btn.classList.remove('active');
    const label = btn.getAttribute('aria-label');
    if (label) btn.setAttribute('aria-label', label.replace('Bloqueando', 'Editar'));
  });

  clearAllMainErrors();
  hasUnsavedChanges = false;
  updateSaveEnabledState();
}

// ==========================================
// SAIR DA CONTA (best-effort)
// ==========================================
btnSignout.addEventListener('click', () => {
  openModal(modals.confirmarSair);
});

document.getElementById('btn-cancelar-sair').addEventListener('click', () => {
  closeModal(modals.confirmarSair);
});

document.getElementById('btn-sim-sair').addEventListener('click', async () => {
  closeModal(modals.confirmarSair);

  // tenta logout no backend, mas não trava fluxo se falhar.
  try {
    if (!tokenGlobal) tokenGlobal = getAuthToken();
    if (tokenGlobal) {
      await fetch(`${URL_API}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenGlobal}` },
      });
    }
  } catch (_) {}

  localStorage.removeItem('tokenGlobal');
  sessionStorage.removeItem('tokenGlobal');
  // Redirecionamento pode variar no seu app; fallback:
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
  inputNovaSenha.value = '';
  inputConfirmarSenha.value = '';

  clearError(errorSenhaAtual);
  clearError(errorNovaSenha);
  clearError(errorConfirmarSenha);

  closeModal(modals.sucessoSenha);
  openModal(modals.alterarSenha);
});

document.getElementById('btn-cancelar-senha').addEventListener('click', () => {
  closeModal(modals.alterarSenha);
  // HU-012: cancelar limpa modificações não salvas no fluxo de senha
  inputSenhaAtual.value = '';
  inputNovaSenha.value = '';
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
    btn.setAttribute('aria-label', isHidden ? aria.replace('Mostrar', 'Ocultar') : aria.replace('Ocultar', 'Mostrar'));
  });
});

function passwordStrongRules(value) {
  const rules = [
    { re: /^(?=.{8,})/, msg: 'A senha deve conter pelo menos 8 caracteres.' },
    { re: /[A-Z]/, msg: 'A senha deve conter pelo menos uma letra maiúscula.' },
    { re: /[a-z]/, msg: 'A senha deve conter pelo menos uma letra minúscula.' },
    { re: /\d/, msg: 'A senha deve conter pelo menos um número.' },
    { re: /[@#$%!&*^()\-_+=<>?.]/, msg: 'A senha deve conter pelo menos um caractere especial (@, #, $, %, etc.).' },
  ];

  for (const r of rules) {
    if (!r.re.test(value)) {
      return r.msg;
    }
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

  // Obrigatórios (HU-012)
  if (!inputSenhaAtual.value) {
    showError(errorSenhaAtual, 'Informe a senha atual.');
    valid = false;
  } else clearError(errorSenhaAtual);

  if (!inputNovaSenha.value) {
    showError(errorNovaSenha, 'Informe a nova senha.');
    valid = false;
  } else {
    const msg = passwordStrongRules(inputNovaSenha.value);
    if (msg) {
      showError(errorNovaSenha, msg);
      valid = false;
    } else clearError(errorNovaSenha);
  }

  if (!inputConfirmarSenha.value) {
    showError(errorConfirmarSenha, 'Confirme a nova senha.');
    valid = false;
  } else if (inputConfirmarSenha.value !== inputNovaSenha.value) {
    showError(errorConfirmarSenha, 'As senhas não coincidem.');
    valid = false;
  } else clearError(errorConfirmarSenha);

  // Nova != senha atual
  if (valid && inputNovaSenha.value === inputSenhaAtual.value) {
    showError(errorNovaSenha, 'A nova senha não pode ser igual à senha atual.');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('btn-confirmar-senha');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    const payload = {
      currentPassword: inputSenhaAtual.value,
      newPassword: inputNovaSenha.value,
      confirmNewPassword: inputConfirmarSenha.value,
    };

    await apiRequest('/auth/me/password', { method: 'PUT', body: payload });

    closeModal(modals.alterarSenha);
    openModal(modals.sucessoSenha);
  } catch (err) {
    closeModal(modals.alterarSenha);
    // Erro genérico amigável (HU-012)
    openModal(modals.erro);
    pendingRetry = async () => {
      // reexecuta com os valores atuais (ainda no DOM)
      await apiRequest('/auth/me/password', { method: 'PUT', body: {
        currentPassword: inputSenhaAtual.value,
        newPassword: inputNovaSenha.value,
        confirmNewPassword: inputConfirmarSenha.value,
      }});
    };
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

document.getElementById('btn-ok-senha').addEventListener('click', () => {
  closeModal(modals.sucessoSenha);
});

// ==========================================
// INICIALIZAÇÃO: carregar dados do usuário
// ==========================================
async function carregarPerfil() {
  const existing = getAuthToken();
  if (existing) setAuthToken(existing);

  try {
    if (!tokenGlobal) tokenGlobal = getAuthToken();
    const result = await apiRequest('/auth/me', { method: 'GET' });
    const data = result.data;

    originalData.nome = data.name || '';
    originalData.telefone = data.phone || '';
    originalData.email = (data.email || '').toLowerCase();

    inputNome.value = originalData.nome;
    inputTelefone.value = originalData.telefone;
    inputEmail.value = originalData.email;

    currentData = { ...originalData };

    // Travar inicialmente (como no design)
    [inputNome, inputTelefone, inputEmail].forEach(i => { i.disabled = true; });
    document.querySelectorAll('.field-group .edit-btn').forEach(btn => btn.classList.remove('active'));

    clearAllMainErrors();
    hasUnsavedChanges = false;
    updateSaveEnabledState();
  } catch (err) {
    // Sem token / sessão expirada / etc.
    openModal(modals.erro);
    pendingRetry = carregarPerfil;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarPerfil();
});


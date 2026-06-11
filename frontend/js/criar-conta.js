'use strict';

// URL da sua API
const URL_API = 'http://localhost:3000/api';
const LOGIN_URL = '/frontend/pages/shared/autenticar-usuario.html';

// ============================================================
// REFERÊNCIAS DOM
// ============================================================
const inputNome = document.getElementById('input-nome');
const inputEmail = document.getElementById('input-email');
const inputTelefone = document.getElementById('input-telefone');
const inputSenha = document.getElementById('input-senha');
const inputConfirmarSenha = document.getElementById('input-confirmar-senha');

const errorNome = document.getElementById('error-nome');
const errorEmail = document.getElementById('error-email');
const errorTelefone = document.getElementById('error-telefone');
const errorSenha = document.getElementById('error-senha');
const errorConfirmarSenha = document.getElementById('error-confirmar-senha');

const btnCriarConta = document.getElementById('btn-criar-conta');
const linkEntrar = document.getElementById('link-entrar');
const modalSucesso = document.getElementById('modal-sucesso');
const btnOkSucesso = document.getElementById('btn-ok-sucesso');

// ============================================================
// UTILITÁRIOS DE MODAL
// ============================================================
function openModal(modal) {
    modal.classList.add('active');
    const focusable = modal.querySelector('button');
    if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Fecha modal ao clicar no overlay
modalSucesso.addEventListener('click', (e) => {
    if (e.target === modalSucesso) closeModal(modalSucesso);
});

// Fecha modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(modalSucesso);
});

// ============================================================
// UTILITÁRIOS DE ERRO
// ============================================================
function showError(el, msg) {
    el.textContent = msg;
    el.classList.add('visible');
    const inputId = el.id.replace('error-', 'input-');
    const input = document.getElementById(inputId);
    if (input) input.classList.add('error');
}

function clearError(el) {
    el.textContent = '';
    el.classList.remove('visible');
    const inputId = el.id.replace('error-', 'input-');
    const input = document.getElementById(inputId);
    if (input) input.classList.remove('error');
}

// ============================================================
// MÁSCARA DE TELEFONE
// ============================================================
function applyPhoneMask(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2)    return `(${digits}`;
    if (digits.length <= 6)    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

inputTelefone.addEventListener('input', (e) => {
    const raw        = e.target.value;
    const cursor = e.target.selectionStart;
    const masked = applyPhoneMask(raw);
    e.target.value = masked;
    const diff = masked.length - raw.length;
    e.target.setSelectionRange(cursor + diff, cursor + diff);
});

// ============================================================
// ÍCONE DE OLHINHO (mostrar/ocultar senha)
// ============================================================
document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input        = document.getElementById(targetId);
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

// ============================================================
// HIGIENIZAÇÃO DE E-MAIL
// ============================================================
inputEmail.addEventListener('blur', () => {
    inputEmail.value = inputEmail.value.toLowerCase();
});

// ============================================================
// VALIDAÇÕES INDIVIDUAIS
// ============================================================

/* Nome: não pode ser vazio nem somente espaços; não pode conter números; mínimo 3 letras. */
function validateNome(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        showError(errorNome, 'O nome não pode ficar em branco.');
        return false;
    }

    if (/\d/.test(trimmed)) {
        showError(errorNome, 'O nome não pode conter números.');
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

/* E-mail: formato válido (com @ e domínio). */
function validateEmail(value) {
    const lower            = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!lower) {
        showError(errorEmail, 'O e-mail não pode ficar em branco.');
        return false;
    }

    if (!emailRegex.test(lower)) {
        showError(errorEmail, 'Formato de e-mail inválido. Ex: usuario@dominio.com');
        return false;
    }

    clearError(errorEmail);
    return true;
}

/* Telefone: 10 ou 11 dígitos numéricos (considerando DDD). */
function validateTelefone(value) {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        showError(errorTelefone, 'O telefone não pode ficar em branco.');
        return false;
    }

    if (digits.length < 10 || digits.length > 11) {
        showError(errorTelefone, 'Formato de telefone inválido. Ex: (XX) 9XXXX-XXXX');
        return false;
    }

    clearError(errorTelefone);
    return true;
}

/*
 * Senha: mínimo 8 caracteres, ao menos uma maiúscula, uma minúscula,
 * um número e um caractere especial.
 * (Regras herdadas de HU-012 / configuracoes-conta.js)
 */
function validateSenha(value) {
    if (!value) {
        showError(errorSenha, 'Informe uma senha.');
        return false;
    }

    const rules = [
        { re: /.{8,}/, msg: 'A senha deve ter pelo menos 8 caracteres.' },
        { re: /[A-Z]/, msg: 'A senha deve conter pelo menos uma letra maiúscula.' },
        { re: /[a-z]/, msg: 'A senha deve conter pelo menos uma letra minúscula.' },
        { re: /[0-9]/, msg: 'A senha deve conter pelo menos um número.' },
        { re: /[@#$%!&*^()\-_+=<>?.]/, msg: 'A senha deve conter pelo menos um caractere especial (@, #, $, %, etc.).' },
    ];

    for (const rule of rules) {
        if (!rule.re.test(value)) {
            showError(errorSenha, rule.msg);
            return false;
        }
    }

    clearError(errorSenha);
    return true;
}

/* Confirmar senha: deve ser idêntica à senha. */
function validateConfirmarSenha(value) {
    if (!value) {
        showError(errorConfirmarSenha, 'Confirme sua senha.');
        return false;
    }

    if (value !== inputSenha.value) {
        showError(errorConfirmarSenha, 'As senhas não coincidem.');
        return false;
    }

    clearError(errorConfirmarSenha);
    return true;
}

// ============================================================
// VALIDAÇÃO AO SAIR DO CAMPO (blur)
// ============================================================
inputNome.addEventListener('blur',         () => validateNome(inputNome.value));
inputEmail.addEventListener('blur',        () => validateEmail(inputEmail.value));
inputTelefone.addEventListener('blur',     () => validateTelefone(inputTelefone.value));
inputSenha.addEventListener('blur',        () => validateSenha(inputSenha.value));
inputConfirmarSenha.addEventListener('blur', () => validateConfirmarSenha(inputConfirmarSenha.value));

// Revalida "confirmar senha" em tempo real sempre que "senha" muda
inputSenha.addEventListener('input', () => {
    if (inputConfirmarSenha.value) {
        validateConfirmarSenha(inputConfirmarSenha.value);
    }
});

// Revalida "confirmar senha" enquanto digita
inputConfirmarSenha.addEventListener('input', () => {
    if (inputConfirmarSenha.value) {
        validateConfirmarSenha(inputConfirmarSenha.value);
    }
});

// Exibe feedback de senha enquanto digita (após primeira interação)
inputSenha.addEventListener('input', () => {
    if (inputSenha.value) {
        validateSenha(inputSenha.value);
    } else {
        clearError(errorSenha);
    }
});

// ============================================================
// VALIDAÇÃO COMPLETA DO FORMULÁRIO
// ============================================================
function validateAllFields() {
    const vNome           = validateNome(inputNome.value);
    const vEmail          = validateEmail(inputEmail.value);
    const vTelefone       = validateTelefone(inputTelefone.value);
    const vSenha          = validateSenha(inputSenha.value);
    const vConfirmarSenha = validateConfirmarSenha(inputConfirmarSenha.value);
    return vNome && vEmail && vTelefone && vSenha && vConfirmarSenha;
}

// ============================================================
// FLUXO: CRIAR CONTA (Integrado com a API)
// ============================================================
btnCriarConta.addEventListener('click', () => {
    if (!validateAllFields()) {
        // Foca o primeiro campo com erro
        const firstError = document.querySelector('.field-input.error');
        if (firstError) firstError.focus();
        return;
    }

    submitForm();
});

async function submitForm() {
    btnCriarConta.disabled    = true;
    btnCriarConta.textContent = 'Criando…';

    // Prepara os dados extraindo os valores dos inputs
    const name = inputNome.value.trim();
    const email = inputEmail.value.trim();
    // Pega apenas os números do telefone para salvar no banco
    const phone = inputTelefone.value.replace(/\D/g, ''); 
    const password = inputSenha.value;
    
    // Captura a confirmação da senha
    const confirmPassword = inputConfirmarSenha.value;

    try {
        const resposta = await fetch(`${URL_API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password, confirmPassword })
        });

        const json = await resposta.json();

        if (resposta.ok && json.success) {
            openModal(modalSucesso);
        } else {
            const erroApi = json.error || 'Não foi possível criar a conta.';
            const erroLower = erroApi.toLowerCase();

            // Mapeamento de erros do backend direto no input correspondente
            if (erroLower.includes('email') || erroLower.includes('e-mail') || erroLower.includes('cadastrado')) {
                showError(errorEmail, erroApi);
                inputEmail.focus();
            } else if (erroLower.includes('telefone') || erroLower.includes('phone')) {
                showError(errorTelefone, erroApi);
                inputTelefone.focus();
            } else if (erroLower.includes('senha') || erroLower.includes('password') || erroLower.includes('confirmação')) {
                // Feedback visual se o erro for na senha
                showError(errorConfirmarSenha, erroApi);
                inputConfirmarSenha.focus();
            } else {
                alert(erroApi); // Feedback visual genérico se a API retornar algo inesperado
            }
        }
    } catch (erro) {
        console.error("Falha na conexão:", erro);
        alert('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
        btnCriarConta.disabled    = false;
        btnCriarConta.textContent = 'CRIAR CONTA';
    }
}

// ============================================================
// FLUXO: OK NO MODAL DE SUCESSO → redireciona para login
// ============================================================
btnOkSucesso.addEventListener('click', () => {
    closeModal(modalSucesso);
    window.location.href = LOGIN_URL;
});

// ============================================================
// LINK "ENTRAR"
// ============================================================
linkEntrar.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = LOGIN_URL;
});
'use strict';

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
            btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Mostrar', 'Ocultar'));
        } else {
            input.type = 'password';
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

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

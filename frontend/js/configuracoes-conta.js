'use strict';

// ====================================================
// ESTADO DA APLICAÇÃO
// ====================================================
const originalData = {
  nome: 'Maria Silva Santos',
  telefone: '(11) 98765-4321',
  email: 'maria.santos@email.com',
};

let currentData = { ...originalData };
let hasUnsavedChanges = false;

// ====================================================
// REFERÊNCIAS DOM
// ====================================================
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
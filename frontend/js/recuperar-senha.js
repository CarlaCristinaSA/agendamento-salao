/* ─── RECUPERAR SENHA ────────────────── */
'use strict';

(function () {
  // Constante da API
  const URL_API = 'http://localhost:3000/api';
  const LOGIN_URL = '/frontend/pages/shared/autenticar-usuario.html';
  
  let emailUsuario = '';

  /* ── Utilitários DOM ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /* ── Navegação entre telas ── */
  function goToScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ── Modal ── */
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
  }

  document.getElementById('modal-sucesso')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-sucesso');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal('modal-sucesso');
  });

  /* ── Funções de erro ── */
  function showError(errorEl, inputEl, msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    if (inputEl) inputEl.classList.add('error');
  }

  function clearError(errorEl, inputEl) {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    if (inputEl) inputEl.classList.remove('error');
  }

  /* ── Validação de e-mail ── */
  function validateEmail(value) {
    const lower = String(value).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower);
  }

  /* ── Validação de senha forte ── */
  function passwordStrongRules(value) {
    const rules = [
      { re: /.{8,}/,                   msg: 'A senha deve conter pelo menos 8 caracteres.' },
      { re: /[A-Z]/,                   msg: 'A senha deve conter pelo menos uma letra maiúscula.' },
      { re: /[a-z]/,                   msg: 'A senha deve conter pelo menos uma letra minúscula.' },
      { re: /\d/,                      msg: 'A senha deve conter pelo menos um número.' },
      { re: /[@#$%!&*^()\-_+=<>?.]/, msg: 'A senha deve conter pelo menos um caractere especial (@, #, $, %, etc.).' },
    ];
    for (const rule of rules) {
      if (!rule.re.test(value)) return rule.msg;
    }
    return null;
  }

  /* ════════════════════════════════════════════════════════
     TELA 1
  ════════════════════════════════════════════════════════ */
  const emailInput   = document.getElementById('email-input');
  const errorEmailT1 = document.getElementById('error-email-t1');
  const btnContinuar = document.getElementById('btn-continuar');

  emailInput?.addEventListener('input', () => {
    clearError(errorEmailT1, emailInput);
  });

  emailInput?.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (!val) {
      showError(errorEmailT1, emailInput, 'Informe o seu e-mail.');
    } else if (!validateEmail(val)) {
      showError(errorEmailT1, emailInput, 'Formato de e-mail inválido.');
    } else {
      clearError(errorEmailT1, emailInput);
    }
  });

  btnContinuar?.addEventListener('click', async () => {
    const val = emailInput.value.trim();
    if (!val) {
      showError(errorEmailT1, emailInput, 'Informe o seu e-mail.');
      emailInput.focus();
      return;
    }
    if (!validateEmail(val)) {
      showError(errorEmailT1, emailInput, 'Formato de e-mail inválido.');
      emailInput.focus();
      return;
    }
    
    clearError(errorEmailT1, emailInput);

    // Efeito de Carregamento
    const textoOriginal = btnContinuar.textContent;
    btnContinuar.disabled = true;
    btnContinuar.textContent = 'Enviando...';

    try {
      const resposta = await fetch(`${URL_API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val })
      });

      const json = await resposta.json();

      if (resposta.ok && json.success) {
        // Salva o e-mail validado para usar no último passo
        emailUsuario = val;
        
        // Avança para a tela do código OTP
        goToScreen('tela-2');
        setTimeout(() => {
          document.querySelector('#otp-row .otp-input')?.focus();
        }, 100);
      } else {
        showError(errorEmailT1, emailInput, json.error || 'Não foi possível solicitar a recuperação.');
      }
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      showError(errorEmailT1, emailInput, 'Falha ao conectar com o servidor.');
    } finally {
      btnContinuar.disabled = false;
      btnContinuar.textContent = textoOriginal;
    }
  });

  /* ════════════════════════════════════════════════════════
     TELA 2
  ════════════════════════════════════════════════════════ */
  const otpInputs = [...document.querySelectorAll('.otp-input')];
  const errorOtp  = document.getElementById('error-otp');
  const btnVerificar = document.getElementById('btn-verificar');

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[val.length - 1] : '';

      e.target.classList.remove('error');
      clearError(errorOtp, null);

      if (e.target.value) {
        e.target.classList.add('filled');
        if (index < otpInputs.length - 1) otpInputs[index + 1].focus();
      } else {
        e.target.classList.remove('filled');
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
        otpInputs[index - 1].value = '';
        otpInputs[index - 1].classList.remove('filled', 'error');
      }
    });

    input.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);
      pasted.split('').forEach((char, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = char;
          otpInputs[i].classList.add('filled');
          otpInputs[i].classList.remove('error');
        }
      });
      clearError(errorOtp, null);
      const nextFocus = otpInputs[pasted.length] ?? otpInputs[otpInputs.length - 1];
      nextFocus.focus();
    });
  });

  btnVerificar?.addEventListener('click', () => {
    const code = otpInputs.map(i => i.value).join('');
    if (code.length < 6) {
      otpInputs.forEach(i => {
        if (!i.value) i.classList.add('error');
      });
      showError(errorOtp, null, 'Preencha todos os 6 dígitos do código.');
      return;
    }
    clearError(errorOtp, null);
    goToScreen('tela-3');
    setTimeout(() => document.getElementById('nova-senha')?.focus(), 100);
  });

  /* Reenviar com timer */
  const btnReenviar = document.getElementById('btn-reenviar');
  btnReenviar?.addEventListener('click', async () => {
    otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
    clearError(errorOtp, null);
    otpInputs[0]?.focus();
    
    if (emailUsuario) {
      try {
        // Dispara uma nova requisição em segundo plano para reenviar o e-mail
        await fetch(`${URL_API}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailUsuario })
        });
      } catch (err) {
        console.error("Erro ao reenviar:", err);
      }
    }
    startReenviarTimer(btnReenviar);
  });

  function startReenviarTimer(btn) {
    let seconds = 30;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor  = 'default';
    const original = btn.textContent;
    const tick = setInterval(() => {
      seconds--;
      btn.textContent = `Reenviar em ${seconds}s`;
      if (seconds <= 0) {
        clearInterval(tick);
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor  = '';
        btn.textContent = original;
      }
    }, 1000);
  }

  document.getElementById('btn-tentar-novamente')?.addEventListener('click', () => {
    otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
    clearError(errorOtp, null);
    goToScreen('tela-1');
  });

  /* ════════════════════════════════════════════════════════
     TELA 3
  ════════════════════════════════════════════════════════ */
  const inputNovaSenha      = document.getElementById('nova-senha');
  const inputConfirmarSenha = document.getElementById('confirmar-senha');
  const errorNovaSenha      = document.getElementById('error-nova-senha');
  const errorConfirmarSenha = document.getElementById('error-confirmar-senha');
  const btnConcluir         = document.getElementById('btn-concluir');

  /* Olhinho */
  document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const inputEl  = document.getElementById(targetId);
      if (!inputEl) return;
      const isHidden = inputEl.type === 'password';
      inputEl.type = isHidden ? 'text' : 'password';
      btn.classList.toggle('active', isHidden);
      btn.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
    });
  });

  /* Validação em tempo real */
  inputNovaSenha?.addEventListener('input', () => {
    clearError(errorNovaSenha, inputNovaSenha);
    if (inputConfirmarSenha.value) {
      if (inputConfirmarSenha.value !== inputNovaSenha.value) {
        showError(errorConfirmarSenha, inputConfirmarSenha, 'As senhas não coincidem.');
      } else {
        clearError(errorConfirmarSenha, inputConfirmarSenha);
      }
    }
  });

  inputNovaSenha?.addEventListener('blur', () => {
    if (!inputNovaSenha.value) {
      showError(errorNovaSenha, inputNovaSenha, 'Informe a nova senha.');
      return;
    }
    const msg = passwordStrongRules(inputNovaSenha.value);
    if (msg) showError(errorNovaSenha, inputNovaSenha, msg);
    else clearError(errorNovaSenha, inputNovaSenha);
  });

  inputConfirmarSenha?.addEventListener('input', () => {
    if (!inputConfirmarSenha.value) {
      clearError(errorConfirmarSenha, inputConfirmarSenha);
      return;
    }
    if (inputConfirmarSenha.value !== inputNovaSenha.value) {
      showError(errorConfirmarSenha, inputConfirmarSenha, 'As senhas não coincidem.');
    } else {
      clearError(errorConfirmarSenha, inputConfirmarSenha);
    }
  });

  inputConfirmarSenha?.addEventListener('blur', () => {
    if (!inputConfirmarSenha.value) {
      showError(errorConfirmarSenha, inputConfirmarSenha, 'Confirme a nova senha.');
    } else if (inputConfirmarSenha.value !== inputNovaSenha.value) {
      showError(errorConfirmarSenha, inputConfirmarSenha, 'As senhas não coincidem.');
    } else {
      clearError(errorConfirmarSenha, inputConfirmarSenha);
    }
  });

  /* Concluir — Envio Final para o Backend */
  btnConcluir?.addEventListener('click', async () => {
    let valid = true;

    if (!inputNovaSenha.value) {
      showError(errorNovaSenha, inputNovaSenha, 'Informe a nova senha.');
      valid = false;
    } else {
      const msg = passwordStrongRules(inputNovaSenha.value);
      if (msg) {
        showError(errorNovaSenha, inputNovaSenha, msg);
        valid = false;
      } else {
        clearError(errorNovaSenha, inputNovaSenha);
      }
    }

    if (!inputConfirmarSenha.value) {
      showError(errorConfirmarSenha, inputConfirmarSenha, 'Confirme a nova senha.');
      valid = false;
    } else if (inputConfirmarSenha.value !== inputNovaSenha.value) {
      showError(errorConfirmarSenha, inputConfirmarSenha, 'As senhas não coincidem.');
      valid = false;
    } else {
      clearError(errorConfirmarSenha, inputConfirmarSenha);
    }

    if (!valid) return;

    // Captura o código digitado na tela 2
    const codigoOtp = otpInputs.map(i => i.value).join('');

    // Feedback visual de carregamento
    const textoOriginal = btnConcluir.textContent;
    btnConcluir.disabled = true;
    btnConcluir.textContent = 'Processando...';

    try {
      const resposta = await fetch(`${URL_API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailUsuario,
          code: codigoOtp,
          newPassword: inputNovaSenha.value
        })
      });

      const json = await resposta.json();

      if (resposta.ok && json.success) {
        openModal('modal-sucesso');
      } else {
        // Se o erro for do token/OTP inválido, exibe o erro na tela de nova senha
        showError(errorNovaSenha, inputNovaSenha, json.error || 'Código inválido ou expirado.');
      }
    } catch (erro) {
      console.error("Erro na requisição final:", erro);
      showError(errorNovaSenha, inputNovaSenha, 'Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      btnConcluir.disabled = false;
      btnConcluir.textContent = textoOriginal;
    }
  });

  /* Modal — Fazer Login */
  document.getElementById('btn-fazer-login')?.addEventListener('click', () => {
    closeModal('modal-sucesso');
    window.location.href = LOGIN_URL;
  });

})();
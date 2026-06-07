/* ─── RECUPERAR SENHA — JavaScript ──────────────────────────────────────── */
'use strict';

(function () {

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

  /* ── Funções de erro (mesmo padrão do projeto) ── */
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

  /* ── Validação de senha forte (igual ao projeto de referência) ── */
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
     TELA 1 — ESQUECI MINHA SENHA
  ════════════════════════════════════════════════════════ */
  const emailInput   = document.getElementById('email-input');
  const errorEmailT1 = document.getElementById('error-email-t1');

  // Limpa erro ao digitar
  emailInput?.addEventListener('input', () => {
    clearError(errorEmailT1, emailInput);
  });

  // Valida ao sair do campo
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

  document.getElementById('btn-continuar')?.addEventListener('click', () => {
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
    goToScreen('tela-2');
    setTimeout(() => {
      document.querySelector('#otp-row .otp-input')?.focus();
    }, 100);
  });

  /* ════════════════════════════════════════════════════════
     TELA 2 — VERIFICAR E-MAIL (OTP)
  ════════════════════════════════════════════════════════ */
  const otpInputs = [...document.querySelectorAll('.otp-input')];
  const errorOtp  = document.getElementById('error-otp');

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', e => {
      // Só dígito
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[val.length - 1] : '';

      // Limpa estado de erro ao digitar
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

  document.getElementById('btn-verificar')?.addEventListener('click', () => {
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
  btnReenviar?.addEventListener('click', () => {
    otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
    clearError(errorOtp, null);
    otpInputs[0]?.focus();
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

  /* Tentar novamente — volta para tela 1 */
  document.getElementById('btn-tentar-novamente')?.addEventListener('click', () => {
    otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
    clearError(errorOtp, null);
    goToScreen('tela-1');
  });

  /* ════════════════════════════════════════════════════════
     TELA 3 — NOVA SENHA
  ════════════════════════════════════════════════════════ */
  const inputNovaSenha      = document.getElementById('nova-senha');
  const inputConfirmarSenha = document.getElementById('confirmar-senha');
  const errorNovaSenha      = document.getElementById('error-nova-senha');
  const errorConfirmarSenha = document.getElementById('error-confirmar-senha');

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

  /* Validação em tempo real — nova senha */
  inputNovaSenha?.addEventListener('input', () => {
    clearError(errorNovaSenha, inputNovaSenha);
    // Se confirmar já tem valor, revalida a correspondência também
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

  /* Validação em tempo real — confirmar senha */
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

  /* Concluir */
  document.getElementById('btn-concluir')?.addEventListener('click', () => {
    let valid = true;

    // Valida nova senha
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

    // Valida confirmar senha
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
    openModal('modal-sucesso');
  });

  /* Modal — Fazer Login */
  document.getElementById('btn-fazer-login')?.addEventListener('click', () => {
    closeModal('modal-sucesso');
    // Em produção: window.location.href = '/login';
    goToScreen('tela-1');
    emailInput.value = '';
    clearError(errorEmailT1, emailInput);
  });

})();

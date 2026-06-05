const URL_API = 'http://localhost:3000/api';
const URL_DASHBOARD = './admin/consultar-agendamentos.html';

document.addEventListener('DOMContentLoaded', () => {
    // Se o usuário já tiver uma sessão ativa, manda direto para o Dashboard
    if (sessionStorage.getItem('salao_token')) {
        window.location.href = URL_DASHBOARD;
        return;
    }

    const formLogin = document.getElementById('form-login');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('password');
    const msgErroGeral = document.getElementById('mensagem-erro');
    const btnOlho = document.getElementById('btn-olho');
    
    const btnEntrar = document.getElementById('btn-entrar');
    const btnSpinner = document.getElementById('btn-spinner');
    const textBotao = document.getElementById('text-botao');

    // 1. Alternar visualização da Senha (Ícone do Olho)
    if (btnOlho && inputSenha) {
        btnOlho.addEventListener('click', () => {
            const isPassword = inputSenha.type === 'password';
            inputSenha.type = isPassword ? 'text' : 'password';
            
            const icone = btnOlho.querySelector('i');
            if (icone) {
                icone.classList.toggle('fa-eye', !isPassword);
                icone.classList.toggle('fa-eye-slash', isPassword);
            }
        });
    }

    // 2. Limpar os destaques vermelhos de erro conforme o usuário digita
    inputEmail.addEventListener('input', () => limparErroCampo('grupo-email', 'erro-email'));
    inputSenha.addEventListener('input', () => limparErroCampo('grupo-senha', 'erro-senha'));

    function limparErroCampo(idGrupo, idErro) {
        document.getElementById(idGrupo).classList.remove('campo-invalido');
        document.getElementById(idErro).textContent = '';
        if (msgErroGeral) msgErroGeral.textContent = '';
    }

    function destacarErroCampo(idGrupo, idErro, mensagem) {
        document.getElementById(idGrupo).classList.add('campo-invalido');
        document.getElementById(idErro).textContent = mensagem;
    }

    // 3. Submissão e validação
    if (formLogin) {
        formLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            
            const emailValue = inputEmail.value.trim();
            const passwordValue = inputSenha.value;
            let formularioValido = true;

            // Impedir acesso se o e-mail/login estiver vazio
            if (!emailValue) {
                destacarErroCampo('grupo-email', 'erro-email', 'O campo de login é obrigatório.');
                formularioValido = false;
            }

            // Impedir acesso se a senha estiver vazia
            if (!passwordValue) {
                destacarErroCampo('grupo-senha', 'erro-senha', 'O campo de senha é obrigatório.');
                formularioValido = false;
            }

            if (!formularioValido) return;

            btnEntrar.disabled = true;
            btnSpinner.style.display = 'inline-block';
            textBotao.textContent = 'ENTRANDO...';
            if (msgErroGeral) msgErroGeral.textContent = '';

            try {
                const resposta = await fetch(`${URL_API}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue
                    })
                });

                const json = await resposta.json();
                if (resposta.ok && json.success && json.data?.token) {
                    sessionStorage.setItem('salao_token', json.data.token);
                    sessionStorage.setItem('salao_admin_nome', json.data.user?.name || 'Administrador');
                    
                    window.location.href = URL_DASHBOARD;
                } else {
                    sessionStorage.removeItem('salao_token');
                    msgErroGeral.textContent = 'E-mail ou senha incorretos.';
                }
            } catch (erro) {
                console.error("Falha no servidor:", erro);
                msgErroGeral.textContent = 'Não foi possível conectar ao servidor.';
            } finally {
                btnEntrar.disabled = false;
                btnSpinner.style.display = 'none';
                textBotao.textContent = 'ENTRAR';
            }
        });
    }
});
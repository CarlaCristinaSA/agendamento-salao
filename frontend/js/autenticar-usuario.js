const URL_API = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Se já houver token, redireciona o usuário para o seu respectivo painel
    if (sessionStorage.getItem('salao_token')) {
        const savedRole = sessionStorage.getItem('salao_user_role');
        if (savedRole === 'admin') {
            window.location.href = '../admin/consultar-agendamentos.html';
        } else {
            window.location.href = '../cliente/tela-inicial-cliente.html'; 
        }
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

    if (formLogin) {
        formLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            
            const emailValue = inputEmail.value.trim();
            const passwordValue = inputSenha.value;
            let formularioValido = true;

            // Impedir acesso se o e-mail/login estiver vazio
            if (!emailValue) {
                destacarErroCampo('grupo-email', 'erro-email', 'O campo de e-mail é obrigatório.');
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
                    const userRole = json.data.user?.role;
                    
                    // Armazenar os dados na sessão
                    sessionStorage.setItem('salao_token', json.data.token);
                    sessionStorage.setItem('salao_admin_nome', json.data.user?.name || 'Usuário');
                    sessionStorage.setItem('salao_user_role', userRole);
                    
                    // Redirecionamento dinâmico baseado no papel
                    if (userRole === 'admin') {
                        window.location.href = '../admin/tela-inicial-adm.html';
                    } else {
                        window.location.href = '../cliente/agendamentoCliente.html'; 
                    }
                } else {
                    sessionStorage.removeItem('salao_token');
                    sessionStorage.removeItem('salao_admin_nome');
                    sessionStorage.removeItem('salao_user_role');
                    msgErroGeral.textContent = json.error || 'E-mail ou senha incorretos.';
                }
            } catch (erro) {
                console.error("Falha no servidor:", erro);
                msgErroGeral.textContent = 'Não foi possível conectar ao servidor. Verifique sua internet.';
            } finally {
                btnEntrar.disabled = false;
                btnSpinner.style.display = 'none';
                textBotao.textContent = 'ENTRAR';
            }
        });
    }
});
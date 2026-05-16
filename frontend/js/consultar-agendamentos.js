const URL_API = 'http://localhost:8080';
let tokenGlobal = '';

async function fazerLoginAutomatico() {
    try {
        const resposta = await fetch(`${URL_API}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@admin.com',
                senha: 'admin'
            })
        });

        if (resposta.ok) {
            const dados = await resposta.json();
            tokenGlobal = dados.token;
            console.log("Login automático realizado com sucesso.");            
        } else {
            console.error("Falha ao realizar login automático.");
        }
    } catch (erro) {
        console.error("Erro ao conectar com a API no login:", erro);
    }
}
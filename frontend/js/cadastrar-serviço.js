const URL_API = "http://localhost:3000/api";
let tokenGlobal = null;

const form = document.getElementById("formServico");

// LOGIN AUTOMÁTICO
async function fazerLogin() {
    try {
        const response = await fetch(`${URL_API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@salao.com",
                password: "Admin@123"
            })
        });

        const data = await response.json();

        if (data.success) {
            tokenGlobal = data.data.token;
            console.log("✅ Login realizado!");
        } else {
            alert("Erro ao autenticar");
        }
    } catch (error) {
        console.error("Erro no login:", error);
    }
}

// Normalização do nome
function normalizarNome(nome) {
    return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

// 2. SUBMIT DO FORM
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    let nomeInput = document.getElementById("nome").value;
    let nome = normalizarNome(nomeInput);

    let duracao = document.getElementById("duracao").value;
    let valor = document.getElementById("valor").value;

    // VALIDAÇÕES 

    if (!nome) {
        alert("Nome do serviço é obrigatório");
        return;
    }

    if (!duracao || !Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
        alert("Duração deve ser um número inteiro maior que zero");
        return;
    }

    valor = valor.replace(",", ".");

    if (!valor || isNaN(valor) || Number(valor) <= 0) {
        alert("Valor deve ser numérico e maior que zero");
        return;
    }

    // garante autenticação
    if (!tokenGlobal) {
        alert("Usuário não autenticado");
        return;
    }

    //  CHAMADA AO BACKEND
    try {
        const response = await fetch(`${URL_API}/admin/services`, { // ✅ CORRIGIDO
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenGlobal}`
            },
            body: JSON.stringify({
                name: nomeInput.trim(), // mantém original (backend valida)
                duration_minutes: Number(duracao),
                price: Number(valor)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Erro ao cadastrar serviço");
            return;
        }

        alert("✅ Serviço cadastrado com sucesso!");
        form.reset();

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor");
    }
});

document.addEventListener("DOMContentLoaded", fazerLogin);
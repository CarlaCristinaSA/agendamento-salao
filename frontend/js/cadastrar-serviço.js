const form = document.getElementById("formServico");

// 🔹 Função de normalização (resolve espaços + maiúsc/minúsc)
function normalizarNome(nome) {
    return nome.trim().toLowerCase();
}

form.addEventListener("submit", function (e) {
    e.preventDefault();

    let nomeInput = document.getElementById("nome").value;
    let nome = normalizarNome(nomeInput);

    let duracao = document.getElementById("duracao").value;
    let valor = document.getElementById("valor").value;

    // ===== VALIDAÇÕES =====

    // Nome vazio
    if (!nome) {
        alert("Nome do serviço é obrigatório");
        return;
    }

    // Duração
    if (!duracao) {
        alert("Duração é obrigatória");
        return;
    }

    if (!Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
        alert("Duração deve ser um número inteiro maior que zero");
        return;
    }

    // Valor
    valor = valor.replace(",", "."); // permite decimal BR

    if (!valor) {
        alert("Valor é obrigatório");
        return;
    }

    if (isNaN(valor) || Number(valor) <= 0) {
        alert("Valor deve ser numérico e maior que zero");
        return;
    }

    // ===== DUPLICIDADE (AGORA CORRETA) =====
    let servicos = JSON.parse(localStorage.getItem("servicos")) || [];

    let existe = servicos.some((s) =>
        normalizarNome(s.nome) === nome
    );

    if (existe) {
        alert("Já existe um serviço com esse nome");
        return;
    }

    // ===== SALVAR =====
    const novoServico = {
        nome: nomeInput.trim(), // mantém formato bonito
        duracao: Number(duracao),
        valor: Number(valor),
        status: "ativo",
    };

    servicos.push(novoServico);
    localStorage.setItem("servicos", JSON.stringify(servicos));

    alert("Serviço cadastrado com sucesso!");

    form.reset();
});
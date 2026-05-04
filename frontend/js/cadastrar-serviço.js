const form = document.getElementById("formServico");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    let nome = document.getElementById("nome").value.trim();
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

    if (!Number.isInteger(Number(duracao)) || duracao <= 0) {
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

  // ===== SIMULAÇÃO DE DUPLICIDADE =====
    let servicos = JSON.parse(localStorage.getItem("servicos")) || [];

    let existe = servicos.some(
        (s) => s.nome.toLowerCase() === nome.toLowerCase(),
    );

    if (existe) {
        alert("Já existe um serviço com esse nome");
        return;
    }

  // ===== SALVAR =====
    const novoServico = {
        nome,
        duracao: Number(duracao),
        valor: Number(valor),
        status: "ativo",
    };

    servicos.push(novoServico);
    localStorage.setItem("servicos", JSON.stringify(servicos));

    alert("Serviço cadastrado com sucesso!");

    form.reset();
});

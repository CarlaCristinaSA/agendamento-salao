function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function criarCard(servico, index) {
    const valorFormatado = formatarValor(servico.valor);
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
        <h3>${servico.nome}</h3>
        <div class="info-row">
            <div class="icon-circle"><i class="fa-regular fa-clock"></i></div>
            <div class="info-text">
                <span class="info-label">Duração</span>
                <span class="info-value">${servico.duracao}</span>
            </div>
        </div>
        <div class="info-row">
            <div class="icon-circle"><i class="fa-solid fa-dollar-sign"></i></div>
            <div class="info-text">
                <span class="info-label">Valor</span>
                <span class="info-value valor">${valorFormatado}</span>
            </div>
        </div>
        <button class="select-btn">SELECIONAR SERVIÇO</button>
    `;

    card.querySelector('.select-btn').addEventListener('click', () => {
        openAgendarModal({ ...servico, valor: valorFormatado });
    });

    return card;
}

function renderizarCards(servicos) {
    const container = document.getElementById('services-container');
    container.innerHTML = '';
    servicos.forEach((servico, i) => container.appendChild(criarCard(servico, i)));
}

async function carregarServicosDoBackend() {
    try {
        const response = await fetch('http://localhost:3000/api/public/services');
        const result = await response.json();

        if (result.success) {
            const servicosMapeados = result.data.map(servico => ({
                id: servico.id,
                nome: servico.name,
                duracao: `${servico.duration_minutes} minutos`,
                valor: parseFloat(servico.price)
            }));
            
            renderizarCards(servicosMapeados);
        } else {
            throw new Error("Erro ao listar serviços");
        }
    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        const container = document.getElementById('services-container');
        container.innerHTML = '<p class="empty-message">Nenhum serviço disponível no momento.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarServicosDoBackend();
});
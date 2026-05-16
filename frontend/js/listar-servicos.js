function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function criarCard(servico, index) {
    const valorFormatado = formatarValor(servico.valor);
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
        <div class="topo-card">
            <h3>${servico.nome}</h3>
            <button class="ativar-servico">
                <i class="fa-regular fa-circle-check" style="color: rgb(255, 255, 255);"></i>
                ATIVO
            </button>
        </div>
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
        <button class="select-btn">EDITAR SERVIÇO</button>
    `;

    // Evento de clique para Editar o Serviço
    card.querySelector('.select-btn').addEventListener('click', () => {
        constatarEdicao(servico);
    });

    return card;
}

// Função para manipular a ação de editar (Implemente a abertura do seu modal de edição aqui)
function constatarEdicao(servico) {
    console.log("Editar o serviço:", servico);
    // Exemplo: abrirModalEditar(servico);
}

function renderizarCards(servicos) {
    const container = document.getElementById('services-container');
    container.innerHTML = '';
    
    if (servicos.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum serviço disponível no momento.</p>';
        return;
    }

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
        container.innerHTML = '<p class="empty-message">Erro ao carregar os serviços. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarServicosDoBackend();
    
    // Configuração básica dos botões do Header (opcional)
    document.getElementById('btn-criar-servico').addEventListener('click', () => {
        console.log('Ação de adicionar serviço disparada');
    });

    document.getElementById('btn-filtrar-servico').addEventListener('click', () => {
        console.log('Ação de ordenar disparada');
    });
});
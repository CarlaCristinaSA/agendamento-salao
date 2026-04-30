/* ══════════════════════════════════════════════════════════════════════════
    Arquivo temporário para testes do frontend
   ══════════════════════════════════════════════════════════════════════════ */

const SERVICOS = [
    { id: 101, nome: 'Corte de Cabelo Feminino',   duracao: '60 minutos',  valor: 150.00 },
    { id: 102, nome: 'Escova Progressiva',          duracao: '120 minutos', valor: 350.00 },
    { id: 103, nome: 'Manicure Especializada',      duracao: '45 minutos',  valor: 80.00  },
    { id: 104, nome: 'Pedicure Premium',            duracao: '45 minutos',  valor: 80.00  },
    { id: 105, nome: 'Massagem Capilar Relaxante',  duracao: '30 minutos',  valor: 120.00 },
    { id: 106, nome: 'Coloração Completa',          duracao: '180 minutos', valor: 450.00 },
];

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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => renderizarCards(SERVICOS), 1000);
});
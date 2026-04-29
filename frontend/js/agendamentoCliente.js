document.addEventListener('DOMContentLoaded', () => {
    
    // 1. DADOS FALSOS SIMULANDO O BACK-END
    const servicosDoBancoDeDados = [
        { id: 101, nome: "Corte de Cabelo Feminino", duracao: "60 minutos", valor: 150.00 },
        { id: 102, nome: "Escova Progressiva", duracao: "120 minutos", valor: 350.00 },
        { id: 103, nome: "Manicure Especializada", duracao: "45 minutos", valor: 80.00 },
        { id: 104, nome: "Pedicure Premium", duracao: "45 minutos", valor: 80.00 },
        { id: 105, nome: "Massagem Capilar Relaxante", duracao: "30 minutos", valor: 120.00 },
        { id: 106, nome: "Coloração Completa", duracao: "180 minutos", valor: 450.00 }
    ];
    const container = document.getElementById('services-container');
    
    function renderizarCards(servicos) {
        container.innerHTML = '';
        servicos.forEach((servico, index) => {
            const valorFormatado = servico.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <h3>${servico.nome}</h3>
                
                <div class="info-row">
                    <div class="icon-circle">
                        <i class="fa-regular fa-clock"></i>
                    </div>
                    <div class="info-text">
                        <span class="info-label">Duração</span>
                        <span class="info-value">${servico.duracao}</span>
                    </div>
                </div>
                
                <div class="info-row" style="margin-bottom: 24px;">
                    <div class="icon-circle">
                        <i class="fa-solid fa-dollar-sign"></i>
                    </div>
                    <div class="info-text">
                        <span class="info-label">Valor</span>
                        <span class="info-value price">${valorFormatado}</span>
                    </div>

                </div>
                <button class="select-btn">SELECIONAR SERVIÇO</button>
            `;
            
            container.appendChild(card);
        });
    }

    setTimeout(() => {
        renderizarCards(servicosDoBancoDeDados);
    }, 1000);

});

function selecionarServico(idDoServico) {
    alert(`O usuário clicou no serviço com ID: ${idDoServico}`);
}
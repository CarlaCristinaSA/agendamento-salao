let servicoEmEdicaoId = null;

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function criarCard(servico, index) {
    const valorFormatado = formatarValor(servico.valor);
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const badgeHTML = servico.ativo 
        ? `<button class="ativar-servico"><i class="fa-regular fa-circle-check" style="color: white;"></i> ATIVO</button>`
        : `<button class="ativar-servico badge-inativo"><i class="fa-regular fa-circle-xmark"></i> INATIVO</button>`;

    card.innerHTML = `
        <div class="topo-card">
            <h3>${servico.nome}</h3>
            ${badgeHTML}
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

    card.querySelector('.select-btn').addEventListener('click', () => {
        abrirEdicao(servico);
    });

    return card;
}

function abrirEdicao(servico) {
    servicoEmEdicaoId = servico.id;

    const modal = document.getElementById('modal-servico-overlay');
    const inputNome = document.getElementById('input-nome');
    const inputDuracao = document.getElementById('input-duracao');
    const inputPreco = document.getElementById('input-preco');
    const checkboxStatus = document.getElementById('input-status');
    
    const apenasMinutos = servico.duracao.replace(/[^0-9]/g, '');
    
    inputNome.value = servico.nome;
    inputDuracao.value = apenasMinutos;
    inputPreco.value = servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    checkboxStatus.checked = !!servico.ativo;
    atualizarLabelsStatus(checkboxStatus.checked);

    modal.classList.add('active');
}

function fecharModal() {
    const modal = document.getElementById('modal-servico-overlay');
    modal.classList.remove('active');
    servicoEmEdicaoId = null;
    document.getElementById('form-servico').reset();
}

function actualizarLabelsStatus(isChecked) {
    document.getElementById('label-ativo').classList.toggle('active', isChecked);
    document.getElementById('label-inativo').classList.toggle('active', !isChecked);
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
                valor: parseFloat(servico.price),
                ativo: servico.active
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
    
    const toggleInput = document.getElementById('input-status');

    toggleInput.addEventListener('change', (e) => atualizarLabelsStatus(e.target.checked));
    
    document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);
    document.getElementById('modal-servico-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-servico-overlay') fecharModal();
    });

    document.getElementById('form-servico').addEventListener('submit', async (e) => {
        e.preventDefault();

        let precoTexto = document.getElementById('input-preco').value;
        let precoFloat = parseFloat(precoTexto.replace(/\./g, '').replace(',', '.'));

        const dadosAtualizados = {
            name: document.getElementById('input-nome').value,
            duration_minutes: parseInt(document.getElementById('input-duracao').value),
            price: precoFloat,
            active: toggleInput.checked
        };

        try {
            const response = await fetch(`http://localhost:3000/api/public/services/${servicoEmEdicaoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });

            const resultado = await response.json();

            if (resultado.success) {
                fecharModal();
                carregarServicosDoBackend();
            } else {
                alert("Erro ao atualizar o serviço.");
            }
        } catch (error) {
            console.error("Erro na requisição de atualização:", error);
            alert("Não foi possível conectar ao servidor.");
        }
    });
});
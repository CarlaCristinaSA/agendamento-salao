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

let todosAgendamentos = [];

async function carregarAgendamentos() {
    try {
        const resposta = await fetch(`${URL_API}/agendamentos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenGlobal}`
            }
        });

        if (resposta.ok) {
            todosAgendamentos = await resposta.json();
            preencherCards(todosAgendamentos);
        } else {
            console.error("Erro ao buscar a lista de agendamentos.");
        }
    } catch (erro) {
        console.error("Erro de requisição:", erro);
    }
}

function formatarDataBR(dataString) {
    if (!dataString) return '--/--/----';
    const partes = dataString.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function getStatusConfig(status) {
    const configs = {
        'PENDENTE': { cor: '#F59E0B', texto: 'Pendente' },
        'CONCLUIDO': { cor: '#10B981', texto: 'Concluído' },
        'CANCELADO': { cor: '#EF4444', texto: 'Cancelado' }
    };
    return configs[status?.toUpperCase()] || { cor: 'var(--cinza)', texto: status || 'Indefinido' };
}

function preencherCards(agendamentos) {
    const container = document.getElementById('containerAgendamentos');
    container.innerHTML = '';

    if (!agendamentos || agendamentos.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--cinza); width: 100%; grid-column: 1 / -1; padding: 2rem;">Nenhum agendamento encontrado...</div>';
        return;
    }

    agendamentos.forEach(agendamento => {
        const statusConfig = getStatusConfig(agendamento.status);
        
        const cardHTML = `
            <div class="card" onclick="abrirDetalhamento(${agendamento.id})">
                <h3>${agendamento.cliente?.nome || 'Cliente não informado'}</h3>
                <div class="infos-card">
                    <div class="info">
                        <div class="circulo-icone">
                            <svg width="20" height="20"><use href="#icone-calendario"></use></svg>
                        </div>
                        <div>
                            <span class="rotulo">Data e Hora</span>
                            <strong>${formatarDataBR(agendamento.data)} às ${agendamento.horario}</strong>
                        </div>
                    </div>
                    <div class="info">
                        <div class="circulo-icone" style="background: ${statusConfig.cor}">
                            <svg width="20" height="20"><use href="#icone-relogio"></use></svg>
                        </div>
                        <div>
                            <span class="rotulo">Status</span>
                            <strong style="color: ${statusConfig.cor}">${statusConfig.texto}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

window.onload = async () => {
    await fazerLoginAutomatico();
    await carregarAgendamentos();
};
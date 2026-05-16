const URL_API = 'http://localhost:3000/api';
let tokenGlobal = null;
let agendamentosGlobais = [];

// COMUNICAÇÃO COM O BACKEND
async function fazerLoginAutomático() {
    try {
        const response = await fetch(`${URL_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@salao.com',
                password: 'Admin@123'
            })
        });
        const data = await response.json();
        if (data.success) {
            tokenGlobal = data.data.token;
            return;
        }
        throw new Error(data.error || 'Erro ao autenticar');
    } catch (erro) {
        console.error('Erro no login automático:', erro);
        document.getElementById('containerAgendamentos').innerHTML =
            '<p style="grid-column: 1/-1; text-align: center; color: #999;">Erro ao autenticar para carregar os agendamentos.</p>';
    }
}

async function carregarAgendamentos() {
    if (!tokenGlobal) return;
    try {
        const response = await fetch(`${URL_API}/admin/appointments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenGlobal}`
            }
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Erro ao buscar agendamentos');
        }
        const agendamentos = Array.isArray(result.data) ? result.data : [];
        agendamentosGlobais = agendamentos;
        preencherCards(agendamentos);
    } catch (erro) {
        console.error('Erro:', erro);
        document.getElementById('containerAgendamentos').innerHTML =
            '<p style="grid-column: 1/-1; text-align: center; color: #999;">Erro ao carregar agendamentos</p>';
    }
}

function mapearAgendamento(appt) {
    return {
        nome: appt.client_name,
        telefone: appt.client_phone,
        email: appt.client_email,
        servico: appt.service_name,
        data: appt.appointment_date,
        hora: appt.appointment_time,
        valor: appt.price,
    };
}

function _formatarDataHora(data, hora) {
    if (!data || !hora) return 'N/A';
    const [ano, mes, dia] = String(data).split('-');
    if (!ano || !mes || !dia) return 'N/A';
    return `${dia}/${mes}/${ano} - ${String(hora).substring(0, 5)}`;
}

function _formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));
}

function _escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function preencherCards(agendamentos) {
    const container = document.getElementById('containerAgendamentos');
    
    if (agendamentos.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Nenhum agendamento encontrado</p>';
        return;
    }

    container.innerHTML = agendamentos.map(appt => {
        const dados = mapearAgendamento(appt);
        const dataHora = _formatarDataHora(dados.data, dados.hora);
        const valorFormatado = _formatarValor(dados.valor);

        return `
            <article class="card" onclick="abrirDetalhamento('${_escapeHtml(dados.nome || '')}','${_escapeHtml(dados.telefone || '')}','${_escapeHtml(dados.email || '')}','${_escapeHtml(dados.servico || '')}','${_escapeHtml(dataHora)}','${_escapeHtml(valorFormatado)}')">
                <h3>${_escapeHtml(dados.nome || 'N/A')}</h3>
                <div class="infos-card">
                    <div class="info"><div class="circulo-info"><svg width="18" height="18"><use href="#icone-calendario"/></svg></div><div><span class="rotulo">Data e Hora</span><strong>${_escapeHtml(dataHora)}</strong></div></div>
                    <div class="info"><div class="circulo-info"><svg width="18" height="18"><use href="#icone-relogio"/></svg></div><div><span class="rotulo">Serviço</span><strong>${_escapeHtml(dados.servico || 'N/A')}</strong></div></div>
                    <div class="info"><div class="circulo-info"><svg width="18" height="18"><use href="#icone-cifrao"/></svg></div><div><span class="rotulo">Valor</span><strong>${_escapeHtml(valorFormatado)}</strong></div></div>
                </div>
            </article>
        `;
    }).join('');
}

// Filtro funcional
function _atualizarEstadoBotaoFiltro() {
    const dataEspecifica = document.getElementById('filtroDataEspecifica').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const temFiltro = dataEspecifica || dataInicio || dataFim;
    
    const botaoFiltro = document.querySelector('button[onclick="abrirFiltro()"]');
    if (temFiltro) {
        botaoFiltro.classList.add('ativo');
    } else {
        botaoFiltro.classList.remove('ativo');
    }
}

function _aplicarFiltro() {
    const dataEspecifica = document.getElementById('filtroDataEspecifica').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;

    if (!dataEspecifica && !dataInicio && !dataFim) {
        preencherCards(agendamentosGlobais);
        _atualizarEstadoBotaoFiltro();
        return;
    }

    const agendamentosFiltrados = agendamentosGlobais.filter(appt => {
        const dataAgendamento = appt.appointment_date;

        // Filtro por data específica
        if (dataEspecifica) {
            return dataAgendamento === dataEspecifica;
        }
        // Filtro por intervalo de datas
        if (dataInicio && dataFim) {
            return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
        }
        if (dataInicio) {
            return dataAgendamento >= dataInicio;
        }
        if (dataFim) {
            return dataAgendamento <= dataFim;
        }
        return true;
    });

    preencherCards(agendamentosFiltrados);
    _atualizarEstadoBotaoFiltro();
}

function aplicarFiltro() {
    _aplicarFiltro();
    _fecharModais();
}

function _limparFiltros() {
    ['filtroDataEspecifica','filtroDataInicio','filtroDataFim']
        .forEach(id => document.getElementById(id).value = '');
    preencherCards(agendamentosGlobais);
    _atualizarEstadoBotaoFiltro();
}

function limparFiltros() {
    _limparFiltros();
    _fecharModais();
}

function _selecionarOrdem(tipo) {
    const ativo   = document.getElementById(tipo === 'recente' ? 'ordRecente' : 'ordAntigo');
    const inativo = document.getElementById(tipo === 'recente' ? 'ordAntigo'  : 'ordRecente');

    [ativo, inativo].forEach((el, i) => {
        el.classList.toggle('ativo', i === 0);
        el.querySelector('.icone-ordem').classList.toggle('ativo', i === 0);
        el.querySelector('.check').classList.toggle('oculto', i !== 0);
    });

    setTimeout(_fecharModais, 300);
}

function selecionarOrdem(tipo) {
    _selecionarOrdem(tipo);
}

document.addEventListener('DOMContentLoaded', async () => {
    await fazerLoginAutomático();
    await carregarAgendamentos();
    _atualizarEstadoBotaoFiltro();
});

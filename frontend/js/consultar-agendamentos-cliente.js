const URL_API = "http://localhost:3000/api";
let tokenGlobal = null;
let agendamentosGlobais = [];
let ordenacaoAtual = "recente";

// ─── ÍCONES SVG ──────────────────────────────────────────────────────────────
const SVG = {
    calendar: `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1.5V4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 1.5V4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14.25 3H3.75C2.92 3 2.25 3.67 2.25 4.5V15C2.25 15.83 2.92 16.5 3.75 16.5H14.25C15.08 16.5 15.75 15.83 15.75 15V4.5C15.75 3.67 15.08 3 14.25 3Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.25 7.5H15.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

    dollar: `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1.5V16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.75 3.75H7.125C5.67 3.75 4.5 4.92 4.5 6.375C4.5 7.83 5.67 9 7.125 9H10.875C12.33 9 13.5 10.17 13.5 11.625C13.5 13.08 12.33 14.25 10.875 14.25H4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

    check: `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.72 5.83C12.98 7.14 12.79 8.5 12.18 9.68C11.56 10.87 10.56 11.81 9.34 12.34C8.12 12.88 6.75 12.98 5.46 12.62C4.18 12.27 3.05 11.49 2.27 10.41C1.49 9.32 1.1 8.01 1.18 6.68C1.25 5.34 1.78 4.08 2.67 3.09C3.57 2.1 4.78 1.44 6.09 1.24C7.41 1.03 8.76 1.28 9.92 1.95" stroke="white" stroke-width="1.17" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.25 6.42L7 8.17L12.83 2.33" stroke="white" stroke-width="1.17" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

    x: `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3.5L3.5 10.5" stroke="#6B7280" stroke-width="1.17" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.5 3.5L10.5 10.5" stroke="#6B7280" stroke-width="1.17" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
};

function obterTokenCliente() {
    tokenGlobal = sessionStorage.getItem("salao_token");
    if (!tokenGlobal) {
        window.location.href = "../shared/autenticar-usuario.html";
        return false;
    }
    return true;
}

function _estaAtivo(ag) {
    const status = String(ag.status || "").toLowerCase();

    if (status === "cancelled" || status === "cancelado") return false;

    const agora = new Date();
    const dataLimpa = String(ag.appointment_date).split("T")[0];
    const horaLimpa = String(ag.appointment_time).substring(0, 5);
    const inicio    = new Date(`${dataLimpa}T${horaLimpa}:00`);

    const duracao = Number(ag.duration_minutes) || 0;
    const fim     = duracao > 0
        ? new Date(inicio.getTime() + duracao * 60 * 1000)
        : inicio;

    return fim > agora || inicio > agora;
}

async function carregarAgendamentos() {
    if (!tokenGlobal) return;

    const container = document.getElementById("containerAgendamentos");
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;margin-top:2rem;">Carregando...</p>';

    try {
        const response = await fetch(`${URL_API}/client/appointments`, {
            method: "GET",
            headers: { Authorization: `Bearer ${tokenGlobal}` },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || "Erro ao buscar agendamentos");
        }

        let todos = [];

        if (result.data) {
            if (Array.isArray(result.data)) {
                todos = result.data;
            } else if (typeof result.data === "object") {
                const upcoming = Array.isArray(result.data.upcoming) ? result.data.upcoming : [];
                const history  = Array.isArray(result.data.history)  ? result.data.history  : [];
                const past     = Array.isArray(result.data.past)     ? result.data.past     : [];
                todos = [...upcoming, ...history, ...past];
            }
        }

        agendamentosGlobais = todos.filter(_estaAtivo);

        preencherCards(agendamentosGlobais);
    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);
        container.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;color:#999;margin-top:2rem;">Erro ao carregar agendamentos. Tente novamente.</p>';
    }
}

function _formatarData(dataISO) {
    if (!dataISO) return "N/A";
    const data = String(dataISO).split("T")[0];
    const [ano, mes, dia] = data.split("-");
    if (!ano || !mes || !dia) return "N/A";
    return `${dia}/${mes}/${ano}`;
}

function _formatarValor(valor) {
    if (valor === null || valor === undefined || valor === "") return "N/A";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
}

function badgeHTML(displayStatus) {
    const s = String(displayStatus || "").toLowerCase();
    if (s === "pendente") {
        return `<span class="badge badge--pendente">${SVG.check} PENDENTE</span>`;
    }
    if (s === "concluído" || s === "concluido" || s === "completed") {
        return `<span class="badge badge--concluido">${SVG.check} CONCLUÍDO</span>`;
    }
    if (s === "cancelado" || s === "cancelled") {
        return `<span class="badge badge--cancelado">${SVG.x} CANCELADO</span>`;
    }
    return `<span class="badge badge--pendente">${SVG.check} ${(displayStatus || "ATIVO").toUpperCase()}</span>`;
}

function preencherCards(agendamentos) {
    const container = document.getElementById("containerAgendamentos");
    const lista = _ordenarAgendamentos([...agendamentos]);

    if (lista.length === 0) {
        container.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;color:#999;margin-top:2rem;">Nenhum agendamento futuro encontrado. <a href="agendamentoCliente.html" style="color:#E0456A;font-weight:600;">Que tal agendar agora?</a></p>';
        return;
    }

    container.innerHTML = lista
        .map((ag) => {
            const dataFormatada  = _formatarData(ag.appointment_date);
            const horaFormatada  = String(ag.appointment_time || "").substring(0, 5);
            const valorFormatado = _formatarValor(ag.price);
            const statusDisplay  = ag.display_status || ag.status || "Pendente";

            const cancelBtn = ag.can_cancel
                ? `<button class="btn-cancel" data-id="${ag.id}" data-servico="${String(ag.service_name || "").replace(/"/g, "&quot;")}">CANCELAR AGENDAMENTO</button>`
                : "";

            return `
            <article class="card">
                <div class="card__header">
                    <h3 class="card__title">${ag.service_name || "Serviço"}</h3>
                    ${badgeHTML(statusDisplay)}
                </div>
                <div class="card__body">
                    <div class="info-row">
                        <div class="info-icon">${SVG.calendar}</div>
                        <div class="info-text">
                            <span class="info-label">Data e Hora</span>
                            <span class="info-value">${dataFormatada} — ${horaFormatada}</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-icon">${SVG.dollar}</div>
                        <div class="info-text">
                            <span class="info-label">Valor</span>
                            <span class="info-value valor">${valorFormatado}</span>
                        </div>
                    </div>
                </div>
                ${cancelBtn}
            </article>`;
        })
        .join("");

    container.querySelectorAll(".btn-cancel").forEach((btn) => {
        btn.addEventListener("click", () => {
            prepararCancelamento(Number(btn.dataset.id), btn.dataset.servico);
        });
    });
}

function prepararCancelamento(id, nomeServico) {
    agendamentoSelecionadoId = id;

    document.getElementById("textoConfirmacaoCancelamento").textContent =
        `Tem certeza que deseja cancelar o agendamento de "${nomeServico}"?`;

    Modal.open("modalConfirmarCancelamento");
}

async function cancelarAgendamentoAdmin(idAgendamento) {
    if (!idAgendamento || !tokenGlobal) return;

    try {
        const response = await fetch(
            `${URL_API}/client/appointments/${idAgendamento}/cancel`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${tokenGlobal}` },
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || "Erro ao cancelar agendamento.");
        }

        await carregarAgendamentos();
        fecharModais();
        abrirCancelamentoSucesso();
    } catch (erro) {
        console.error("Erro ao cancelar agendamento:", erro);
        alert("Não foi possível cancelar o agendamento.");
    }
}

function _atualizarEstadoBotaoFiltro() {
    const dataEspecifica = document.getElementById("filtroDataEspecifica").value;
    const dataInicio     = document.getElementById("filtroDataInicio").value;
    const dataFim        = document.getElementById("filtroDataFim").value;
    const temFiltro      = dataEspecifica || dataInicio || dataFim;

    const botao = document.querySelector('button[onclick="abrirFiltro()"]');
    if (botao) botao.classList.toggle("ativo", !!temFiltro);
}

function _aplicarFiltro() {
    const dataEspecifica = document.getElementById("filtroDataEspecifica").value;
    const dataInicio     = document.getElementById("filtroDataInicio").value;
    const dataFim        = document.getElementById("filtroDataFim").value;

    if (!dataEspecifica && !dataInicio && !dataFim) {
        preencherCards(agendamentosGlobais);
        _atualizarEstadoBotaoFiltro();
        return;
    }

    const filtrados = agendamentosGlobais.filter((ag) => {
        const dataAg = String(ag.appointment_date).split("T")[0];
        if (dataEspecifica)           return dataAg === dataEspecifica;
        if (dataInicio && dataFim)    return dataAg >= dataInicio && dataAg <= dataFim;
        if (dataInicio)               return dataAg >= dataInicio;
        if (dataFim)                  return dataAg <= dataFim;
        return true;
    });

    preencherCards(filtrados);
    _atualizarEstadoBotaoFiltro();
}

function aplicarFiltro() {
    _aplicarFiltro();
    fecharModais();
}

function _limparFiltros() {
    ["filtroDataEspecifica", "filtroDataInicio", "filtroDataFim"].forEach(
        (id) => (document.getElementById(id).value = "")
    );
    preencherCards(agendamentosGlobais);
    _atualizarEstadoBotaoFiltro();
}

function limparFiltros() {
    _limparFiltros();
    fecharModais();
}

function _ordenarAgendamentos(agendamentos) {
    return agendamentos.sort((a, b) => {
        const dataA = String(a.appointment_date).split("T")[0];
        const dataB = String(b.appointment_date).split("T")[0];
        const dtA   = new Date(`${dataA}T${String(a.appointment_time).substring(0, 5)}:00`);
        const dtB   = new Date(`${dataB}T${String(b.appointment_time).substring(0, 5)}:00`);
        return ordenacaoAtual === "recente" ? dtA - dtB : dtB - dtA;
    });
}

function _selecionarOrdem(tipo) {
    ordenacaoAtual = tipo;

    const ativo   = document.getElementById(tipo === "recente" ? "ordRecente" : "ordAntigo");
    const inativo = document.getElementById(tipo === "recente" ? "ordAntigo"  : "ordRecente");

    [ativo, inativo].forEach((el, i) => {
        el.classList.toggle("ativo", i === 0);
        el.querySelector(".icone-ordem").classList.toggle("ativo", i === 0);
        el.querySelector(".check").classList.toggle("oculto", i !== 0);
    });

    preencherCards(agendamentosGlobais);
    setTimeout(fecharModais, 300);
}

function selecionarOrdem(tipo) {
    _selecionarOrdem(tipo);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!obterTokenCliente()) return;
    await carregarAgendamentos();
    _atualizarEstadoBotaoFiltro();
});
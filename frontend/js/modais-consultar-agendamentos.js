const Modal = {
  open(id) {
    document.getElementById(id).classList.add("visivel");
    document.getElementById("overlay").classList.add("visivel");
    document.body.style.overflow = "hidden";
  },
  close(id) {
    document.getElementById(id).classList.remove("visivel");
    const anyOpen = document.querySelector(".modal.visivel");
    if (!anyOpen) {
      document.getElementById("overlay").classList.remove("visivel");
      document.body.style.overflow = "";
    }
  },
  bindOverlayClose(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target.id === overlayId) _fecharModais();
      });
    }
  },
};

function _fecharModais(overlay = true) {
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("visivel"));
  if (overlay) {
    document.getElementById("overlay").classList.remove("visivel");
    document.body.style.overflow = "";
  }
}

function fecharModais(overlay = true) {
  _fecharModais(overlay);
}

//MODAL DETALHAMENTO
let agendamentoSelecionadoId = null;
let agendamentoSelecionadoNome = '';
function abrirDetalhamento(id, nome, tel, email, servico, data, valor, status) {
  agendamentoSelecionadoId = id;
  agendamentoSelecionadoNome = nome;

  document.getElementById("det-nome").textContent = nome;
  document.getElementById("det-telefone").textContent = tel;
  document.getElementById("det-email").textContent = email || "Não informado";
  document.getElementById("det-servico").textContent = servico;
  document.getElementById("det-data").textContent = data;
  document.getElementById("det-valor").textContent = valor;

  const btnCancelar = document.getElementById("btnCancelarAgendamento");
  const statusNormalizado = String(status || "").toLowerCase();

  btnCancelar.style.display =
    statusNormalizado === "cancelled" || statusNormalizado === "cancelado"
      ? "none"
      : "block";

  Modal.open("modalDetalhamento");
}

function abrirConfirmacaoCancelamento() {
    document.getElementById("textoConfirmacaoCancelamento").textContent =
        `Tem certeza que deseja cancelar o agendamento de "${agendamentoSelecionadoNome}"?`;

    Modal.close("modalDetalhamento");
    Modal.open("modalConfirmarCancelamento");
}

function confirmarCancelamentoAgendamento() {
  cancelarAgendamentoAdmin(agendamentoSelecionadoId);
}

function abrirCancelamentoSucesso() {
  Modal.open("modalCancelamentoSucesso");
}

function fecharDetalhamento() {
  Modal.close("modalDetalhamento");
}

//MODAL FILTRO
function abrirFiltro() {
  Modal.open("modalFiltro");
}

function fecharFiltro() {
  Modal.close("modalFiltro");
}

//MODAL ORDENAÇÃO
function abrirOrdenacao() {
  Modal.open("modalOrdenacao");
}

function fecharOrdenacao() {
  Modal.close("modalOrdenacao");
}

//MODAL CONFIRMAÇÃO
function abrirConfirmar() {
  Modal.open("modalConfirmar");
}

function fecharConfirmar() {
  Modal.close("modalConfirmar");
}

document.addEventListener("DOMContentLoaded", () => {
  Modal.bindOverlayClose("overlay");
});

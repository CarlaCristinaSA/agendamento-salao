const URL_API = "http://localhost:3000/api";

let tokenGlobal = null;
let servicoSelecionado = null;
let dataSelecionada = null;
let horarioSelecionado = null;
let semanaAtual = new Date();

const servicesContainer = document.getElementById("services-container");

const modalAgendar = document.getElementById("modal-agendar-overlay");
const modalDados = document.getElementById("modal-dados-overlay");
const modalConfirmado = document.getElementById("modal-confirmado-overlay");

const calendarDays = document.getElementById("calendar-days");
const timesGrid = document.getElementById("times-grid");
const timesSection = document.getElementById("times-section");

const confirmHorarioBtn = document.getElementById("modal-confirm-btn");
const confirmDadosBtn = document.getElementById("modal-dados-confirm-btn");

async function fazerLogin() {
  try {
    const response = await fetch(`${URL_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@salao.com",
        password: "Admin@123",
      }),
    });

    const data = await response.json();

    if (data.success) {
      tokenGlobal = data.data.token;
      return true;
    }

    servicesContainer.innerHTML = `<p class="empty-message">Não foi possível autenticar o administrador.</p>`;
    return false;
  } catch (error) {
    console.error("Erro no login:", error);
    servicesContainer.innerHTML = `<p class="empty-message">Erro ao conectar com o servidor.</p>`;
    return false;
  }
}

function formatarValor(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function paraISODate(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function abrirModal(modal) {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function fecharModal(modal) {
  modal.classList.remove("active");

  if (!document.querySelector(".modal-overlay.active")) {
    document.body.style.overflow = "";
  }
}

function mostrarErroCampo(inputId, errorId, mensagem) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);

  input.classList.add("error");
  error.textContent = mensagem;
  error.classList.add("visible");
}

function limparErroCampo(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);

  input.classList.remove("error");
  error.textContent = "";
  error.classList.remove("visible");
}

function mostrarErroGeral(errorId, mensagem) {
  const error = document.getElementById(errorId);
  error.textContent = mensagem;
  error.classList.add("visible");
}

function limparErroGeral(errorId) {
  const error = document.getElementById(errorId);
  error.textContent = "";
  error.classList.remove("visible");
}
function limparFormularioCliente() {
  document.getElementById("input-nome").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("input-telefone").value = "";

  limparErroCampo("input-nome", "error-nome");
  limparErroCampo("input-email", "error-email");
  limparErroCampo("input-telefone", "error-telefone");

  limparErroGeral("error-agendamento");
}

async function carregarServicos() {
  try {
    const response = await fetch(`${URL_API}/admin/services`, {
      headers: {
        Authorization: `Bearer ${tokenGlobal}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      servicesContainer.innerHTML = `<p class="empty-message">Erro ao carregar serviços.</p>`;
      return;
    }

    const servicos = Array.isArray(data.data) ? data.data : [];
    const servicosAtivos = servicos.filter(
      (servico) => servico.status === "active",
    );

    if (servicosAtivos.length === 0) {
      servicesContainer.innerHTML = `<p class="empty-message">Nenhum serviço ativo encontrado.</p>`;
      return;
    }

    servicesContainer.innerHTML = servicosAtivos.map(criarCardServico).join("");

    document.querySelectorAll(".select-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const serviceId = Number(button.dataset.id);
        servicoSelecionado = servicosAtivos.find(
          (servico) => servico.id === serviceId,
        );
        abrirModalAgendamento();
      });
    });
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    servicesContainer.innerHTML = `<p class="empty-message">Erro ao conectar com o servidor.</p>`;
  }
}

function criarCardServico(servico) {
  return `
    <article class="service-card">
      <h3>${servico.name}</h3>

      <div class="info-row">
        <div class="icon-circle">
          <i class="fa-regular fa-clock"></i>
        </div>
        <div class="info-text">
          <span class="info-label">Duração</span>
          <span class="info-value">${servico.duration_minutes} minutos</span>
        </div>
      </div>

      <div class="info-row">
        <div class="icon-circle">
          <span class="money-symbol">$</span>
        </div>
        <div class="info-text">
          <span class="info-label">Valor</span>
          <span class="info-value valor">${formatarValor(servico.price)}</span>
        </div>
      </div>

      <button class="select-btn" data-id="${servico.id}">
        SELECIONAR SERVIÇO
      </button>
    </article>
  `;
}

function abrirModalAgendamento() {
  dataSelecionada = null;
  horarioSelecionado = null;

  document.getElementById("modal-nome-servico").textContent =
    servicoSelecionado.name;

  confirmHorarioBtn.disabled = true;
  timesSection.style.display = "none";
  timesGrid.innerHTML = "";

  limparErroGeral("error-horario");

  renderizarCalendario();
  abrirModal(modalAgendar);
}

function renderizarCalendario() {
  calendarDays.innerHTML = "";

  const inicioSemana = new Date(semanaAtual);
  inicioSemana.setHours(0, 0, 0, 0);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const mesLabel = inicioSemana.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  document.getElementById("cal-month-label").textContent =
    mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + i);

    const dataISO = paraISODate(data);
    const disabled = data < hoje;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    button.disabled = disabled;

    if (disabled) {
      button.classList.add("disabled");
    }

    button.innerHTML = `
      <span class="day-name">${data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
      <span class="day-number">${String(data.getDate()).padStart(2, "0")}</span>
      <span class="day-month">${data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
    `;

    button.addEventListener("click", () => selecionarData(button, dataISO));

    calendarDays.appendChild(button);
  }
}

async function selecionarData(button, dataISO) {
  document.querySelectorAll(".day-cell").forEach((cell) => {
    cell.classList.remove("selected");
  });

  button.classList.add("selected");

  dataSelecionada = dataISO;
  horarioSelecionado = null;
  confirmHorarioBtn.disabled = true;

  await carregarHorariosDisponiveis();
}

async function carregarHorariosDisponiveis() {
  timesGrid.innerHTML = "";
  timesSection.style.display = "flex";
  limparErroGeral("error-horario");

  try {
    const response = await fetch(
      `${URL_API}/admin/availability/slots?service_id=${servicoSelecionado.id}&date=${dataSelecionada}`,
      {
        headers: {
          Authorization: `Bearer ${tokenGlobal}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      mostrarErroGeral(
        "error-horario",
        data.message || "Erro ao carregar horários disponíveis.",
      );
      return;
    }

    const horarios = extrairHorarios(data);

    if (horarios.length === 0) {
      mostrarErroGeral(
        "error-horario",
        "Nenhum horário disponível para esta data.",
      );
      return;
    }

    timesGrid.innerHTML = horarios
      .map(
        (horario) => `
      <button class="time-btn" type="button" data-time="${horario}">
        ${horario}
      </button>
    `,
      )
      .join("");

    document.querySelectorAll(".time-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".time-btn").forEach((item) => {
          item.classList.remove("selected");
        });

        button.classList.add("selected");
        horarioSelecionado = button.dataset.time;
        confirmHorarioBtn.disabled = false;
        limparErroGeral("error-horario");
      });
    });
  } catch (error) {
    console.error("Erro ao carregar horários:", error);
    mostrarErroGeral("error-horario", "Erro ao conectar com o servidor.");
  }
}

function extrairHorarios(data) {
  const lista =
    data.data?.available_slots ||
    data.data?.slots ||
    data.data?.availableSlots ||
    data.available_slots ||
    data.slots ||
    data.availableSlots ||
    [];

  return lista
    .map((item) => {
      if (typeof item === "string") {
        return item.substring(0, 5);
      }

      return (
        item.time ||
        item.start_time ||
        item.appointment_time ||
        ""
      ).substring(0, 5);
    })
    .filter(Boolean);
}

function aplicarMascaraTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digitos
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarDadosCliente() {
  let valido = true;

  const nome = document.getElementById("input-nome").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const telefone = document.getElementById("input-telefone").value.trim();

  const telefoneDigitos = telefone.replace(/\D/g, "");

  limparErroCampo("input-nome", "error-nome");
  limparErroCampo("input-email", "error-email");
  limparErroCampo("input-telefone", "error-telefone");
  limparErroGeral("error-agendamento");

  /* ─── VALIDAÇÃO NOME ───────────────────────────── */

  if (!nome) {
    mostrarErroCampo("input-nome", "error-nome", "Este campo é obrigatório.");

    valido = false;
  } else if (nome.length < 3) {
    mostrarErroCampo(
      "input-nome",
      "error-nome",
      "O nome deve ter pelo menos 3 caracteres.",
    );

    valido = false;
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) {
    mostrarErroCampo(
      "input-nome",
      "error-nome",
      "O nome deve conter apenas letras.",
    );

    valido = false;
  }

  /* ─── VALIDAÇÃO EMAIL (OPCIONAL) ───────────────── */

  if (email && !validarEmail(email)) {
    mostrarErroCampo(
      "input-email",
      "error-email",
      "Informe um e-mail válido ou deixe o campo em branco.",
    );

    valido = false;
  }

  /* ─── VALIDAÇÃO TELEFONE ───────────────────────── */

  if (!telefoneDigitos) {
    mostrarErroCampo(
      "input-telefone",
      "error-telefone",
      "Este campo é obrigatório.",
    );

    valido = false;
  } else if (telefoneDigitos.length !== 10 && telefoneDigitos.length !== 11) {
    mostrarErroCampo(
      "input-telefone",
      "error-telefone",
      "Por favor, informe um número de telefone válido.",
    );

    valido = false;
  }

  return valido;
}

async function confirmarAgendamento() {
  if (!validarDadosCliente()) return;

  if (!servicoSelecionado || !dataSelecionada || !horarioSelecionado) {
    mostrarErroGeral(
      "error-agendamento",
      "Selecione serviço, data e horário antes de confirmar.",
    );
    return;
  }

  const nome = document.getElementById("input-nome").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const telefone = document.getElementById("input-telefone").value.trim();

  const textoOriginal = confirmDadosBtn.textContent;

  try {
    confirmDadosBtn.disabled = true;
    confirmDadosBtn.textContent = "CONFIRMANDO...";

    const payload = {
      client_name: nome,
      client_phone: telefone,
      service_id: servicoSelecionado.id,
      appointment_date: dataSelecionada,
      appointment_time: horarioSelecionado,
    };

    if (email) {
      payload.client_email = email;
    }

    const response = await fetch(`${URL_API}/admin/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGlobal}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarErroGeral(
        "error-agendamento",
        data.message ||
          data.error ||
          "Não foi possível concluir. Verifique se o horário ainda está disponível.",
      );
      return;
    }

    preencherModalConfirmado(nome, telefone);
    fecharModal(modalDados);
    abrirModal(modalConfirmado);
  } catch (error) {
    console.error("Erro ao confirmar agendamento:", error);
    mostrarErroGeral("error-agendamento", "Erro ao conectar com o servidor.");
  } finally {
    confirmDadosBtn.disabled = false;
    confirmDadosBtn.textContent = textoOriginal;
  }
}

function preencherModalConfirmado(nomeCliente, telefoneCliente) {
  document.getElementById("conf-data").textContent =
    `${formatarDataBR(dataSelecionada)} - ${horarioSelecionado}`;

  document.getElementById("conf-servico").textContent = servicoSelecionado.name;
  document.getElementById("conf-cliente").textContent = nomeCliente;
  document.getElementById("conf-telefone").textContent = telefoneCliente;

  document.getElementById("conf-valor").textContent = formatarValor(
    servicoSelecionado.price,
  );
}

function limparFluxo() {
  servicoSelecionado = null;
  dataSelecionada = null;
  horarioSelecionado = null;

  document.getElementById("input-nome").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("input-telefone").value = "";

  confirmHorarioBtn.disabled = true;
  timesSection.style.display = "none";
  timesGrid.innerHTML = "";

  limparErroGeral("error-horario");
  limparErroGeral("error-agendamento");

  limparErroCampo("input-nome", "error-nome");
  limparErroCampo("input-email", "error-email");
  limparErroCampo("input-telefone", "error-telefone");
}

document.addEventListener("DOMContentLoaded", async () => {
  const autenticado = await fazerLogin();

  if (autenticado) {
    await carregarServicos();
  }

  document
    .getElementById("modal-close-btn")
    .addEventListener("click", () => fecharModal(modalAgendar));
  document
    .getElementById("modal-dados-close-btn")
    .addEventListener("click", () => fecharModal(modalDados));

  modalAgendar.addEventListener("click", (event) => {
    if (event.target === modalAgendar) fecharModal(modalAgendar);
  });

  modalDados.addEventListener("click", (event) => {
    if (event.target === modalDados) fecharModal(modalDados);
  });

  modalConfirmado.addEventListener("click", (event) => {
    if (event.target === modalConfirmado) fecharModal(modalConfirmado);
  });

  document.getElementById("cal-prev").addEventListener("click", () => {
    semanaAtual.setDate(semanaAtual.getDate() - 7);
    renderizarCalendario();
  });

  document.getElementById("cal-next").addEventListener("click", () => {
    semanaAtual.setDate(semanaAtual.getDate() + 7);
    renderizarCalendario();
  });

  confirmHorarioBtn.addEventListener("click", () => {
    if (!horarioSelecionado) {
      mostrarErroGeral("error-horario", "Selecione um horário disponível.");
      return;
    }

    limparFormularioCliente();

    fecharModal(modalAgendar);
    abrirModal(modalDados);
  });

  confirmDadosBtn.addEventListener("click", confirmarAgendamento);

  document.getElementById("btn-ok-confirmado").addEventListener("click", () => {
    fecharModal(modalConfirmado);
    limparFluxo();
  });

  document
    .getElementById("input-telefone")
    .addEventListener("input", (event) => {
      event.target.value = aplicarMascaraTelefone(event.target.value);
      limparErroCampo("input-telefone", "error-telefone");
    });

  document.getElementById("input-nome").addEventListener("input", () => {
    limparErroCampo("input-nome", "error-nome");
  });

  document.getElementById("input-email").addEventListener("input", () => {
    limparErroCampo("input-email", "error-email");
  });
});

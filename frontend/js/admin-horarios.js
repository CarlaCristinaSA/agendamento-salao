const URL_API = 'http://localhost:3000/api';
let tokenGlobal = null;
let horariosGlobais = [];
const diasSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

// ==========================================
// 1. COMUNICAÇÃO COM O BACKEND
// ==========================================

async function carregarHorariosDoBanco() {
    try {
        const resLogin = await fetch(`${URL_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@salao.com', password: 'Admin@123' }) 
        });
        const jsonLogin = await resLogin.json();

        if (jsonLogin.success) {
            tokenGlobal = jsonLogin.data.token;
            const resHorarios = await fetch(`${URL_API}/admin/availability`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${tokenGlobal}` }
            });
            const jsonHorarios = await resHorarios.json();

            if (jsonHorarios.success) {
                horariosGlobais = jsonHorarios.data;
            }
        }
    } catch (erro) {
        console.error("Erro na integração:", erro);
    } finally {
        renderizarDiasDaSemana(); 
    }
}

async function limparDiaNoBanco(diaIndex) {
    if (!tokenGlobal) return;
    const turnosAntigos = horariosGlobais.filter(h => h.type === 'day_of_week' && h.day_of_week === diaIndex);
    for (const turno of turnosAntigos) {
        await fetch(`${URL_API}/admin/availability/${turno.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
    }
}

async function salvarIntervaloNoBanco(diaDaSemana, startTime, endTime) {
    if (!tokenGlobal) return;
    await fetch(`${URL_API}/admin/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenGlobal}` },
        body: JSON.stringify({ type: "day_of_week", day_of_week: diaDaSemana, start_time: startTime, end_time: endTime })
    });
}

// ==========================================
// 2. DESENHO DA TELA E DOS MODAIS
// ==========================================

function renderizarDiasDaSemana() {
    const containerDias = document.getElementById('container-dias-semana');
    if (!containerDias) return;

    const dataDeHoje = new Date();
    const domingo = new Date(dataDeHoje);
    domingo.setDate(dataDeHoje.getDate() - dataDeHoje.getDay());

    let cardsDias = "";
    for (let i = 0; i < 7; i++) {
        const data = new Date(domingo);
        data.setDate(domingo.getDate() + i);
        
        const turnos = horariosGlobais.filter(h => h.type === 'day_of_week' && h.day_of_week === i);
        let htmlIntervalos = "";

        if (turnos.length > 0) {
            turnos.sort((a, b) => a.start_time.localeCompare(b.start_time));
            turnos.forEach(t => {
                htmlIntervalos += `<span class="intervalo">${t.start_time.substring(0, 5)} - ${t.end_time.substring(0, 5)}</span>`;
            });
        } else {
            htmlIntervalos = `<span class="intervalo" style="color: #ccc; border-color: #f9f9f9; box-shadow: none;">Fechado</span>`;
        }

        cardsDias += `
            <section class="card-dia" data-dia-index="${i}">
                <div class="dia">
                    <span class="nome-dia">${diasSemana[i]}</span><br>
                    <strong class="numero-dia">${data.getDate()}</strong>
                </div>
                <div class="intervalos-dia">${htmlIntervalos}</div>
            </section>`;
    }
    containerDias.innerHTML = cardsDias;
}

function prepararModalPadrao() {
    const turnos = horariosGlobais.filter(h => h.type === 'day_of_week' && h.day_of_week === 1); 
    const container = document.getElementById('lista-horarios');
    let html = "";

    if (turnos.length > 0) {
        turnos.sort((a, b) => a.start_time.localeCompare(b.start_time));
        turnos.forEach(t => {
            html += `
                <div class="input-time">
                    <input type="time" class="input-intervalo" value="${t.start_time.substring(0,5)}">
                    <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                    <input type="time" class="input-intervalo" value="${t.end_time.substring(0,5)}">
                    <button type="button" class="limpar">X</button>
                </div>`;
        });
    } else {
        html = `
            <div class="input-time">
                <input type="time" class="input-intervalo">
                <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                <input type="time" class="input-intervalo">
                <button type="button" class="limpar">X</button>
            </div>`;
    }
    container.innerHTML = html;
}

function prepararModalSemana() {
    const container = document.getElementById('lista-dias-modal');
    if (!container) return;

    let diasHTML = "";
    for (let i = 0; i < 7; i++) {
        const turnos = horariosGlobais.filter(h => h.type === 'day_of_week' && h.day_of_week === i);
        const isAberto = turnos.length > 0;
        let inputsHTML = "";

        if (isAberto) {
            turnos.sort((a, b) => a.start_time.localeCompare(b.start_time));
            turnos.forEach(t => {
                inputsHTML += `
                    <div class="input-time">
                        <input type="time" class="input-intervalo" value="${t.start_time.substring(0,5)}">
                        <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                        <input type="time" class="input-intervalo" value="${t.end_time.substring(0,5)}">
                        <button type="button" class="limpar">X</button>
                    </div>`;
            });
        } else {
            inputsHTML = `
                <div class="input-time">
                    <input type="time" class="input-intervalo">
                    <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                    <input type="time" class="input-intervalo">
                    <button type="button" class="limpar">X</button>
                </div>`;
        }

        diasHTML += `
            <section class="dia-modal" data-index="${i}">
                <div class="cabecalho-dia-modal">
                    <h2>${diasSemana[i]}</h2>
                    <input type="checkbox" class="toggle" ${isAberto ? 'checked' : ''}>
                </div>
                <div class="container-scroll-horarios">${inputsHTML}</div>
                <div class="add-btn">
                    <img src="../../assets/add-icon.svg" alt="Adicionar">
                    <p>ADICIONAR HORÁRIO</p>
                </div>
            </section>`;
    }
    container.innerHTML = diasHTML;
}

function prepararModalDia(diaIndex, nomeDia, numeroDia) {
    document.getElementById('icone-dia-abrev').textContent = nomeDia.substring(0, 3);
    document.getElementById('icone-dia-num').textContent = numeroDia;
    document.getElementById('titulo-modal-dia').textContent = `Editar ${nomeDia.charAt(0) + nomeDia.slice(1).toLowerCase()}`;
    
    const turnos = horariosGlobais.filter(h => h.type === 'day_of_week' && h.day_of_week === diaIndex);
    
    const toggle = document.querySelector('#modal-horarios-dia .salao-aberto .toggle');
    if (toggle) toggle.checked = turnos.length > 0;

    const container = document.getElementById('lista-horarios-dia');
    let inputsHTML = "";

    if (turnos.length > 0) {
        turnos.sort((a, b) => a.start_time.localeCompare(b.start_time));
        turnos.forEach(t => {
            inputsHTML += `
                <div class="input-time caixa-hora-dia">
                    <div class="grupo-input"><label>INÍCIO</label><input type="time" class="input-intervalo" value="${t.start_time.substring(0,5)}"></div>
                    <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                    <div class="grupo-input"><label>TÉRMINO</label><input type="time" class="input-intervalo" value="${t.end_time.substring(0,5)}"></div>
                    <button type="button" class="limpar">X</button>
                </div>`;
        });
    } else {
        inputsHTML = `
            <div class="input-time caixa-hora-dia">
                <div class="grupo-input"><label>INÍCIO</label><input type="time" class="input-intervalo"></div>
                <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                <div class="grupo-input"><label>TÉRMINO</label><input type="time" class="input-intervalo"></div>
                <button type="button" class="limpar">X</button>
            </div>`;
    }
    container.innerHTML = inputsHTML;
}

// ==========================================
// 3. EVENTOS DE CLIQUE E FORMULÁRIOS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    carregarHorariosDoBanco();

    document.addEventListener('click', (evento) => {
        const el = evento.target;

        // Fechar Modal
        if (el.classList.contains('fechar-modal') || el.id === 'fechar-modal') {
            const m = el.closest('.modal'); if (m) m.classList.remove('aberto'); 
        } else if (el.classList.contains('modal')) el.classList.remove('aberto');

        // Abrir Modal Padrão
        else if (el.id === 'alterar-horario-padrao') {
            prepararModalPadrao();
            document.getElementById('modal-horario-padrao').classList.add('aberto');
        }
        
        // Abrir Modal Semana
        else if (el.id === 'horarios-semana') {
            prepararModalSemana();
            document.getElementById('modal-horarios-semana').classList.add('aberto');
        }

        // Abrir Modal Dia
        else if (el.closest('.card-dia')) {
            const card = el.closest('.card-dia');
            const diaIndex = parseInt(card.getAttribute('data-dia-index'));
            prepararModalDia(diaIndex, card.querySelector('.nome-dia').textContent, card.querySelector('.numero-dia').textContent);
            document.getElementById('modal-horarios-dia').classList.add('aberto');
        }

        // Limpar Linha
        else if (el.classList.contains('limpar')) {
            const linha = el.closest('.input-time'); if (linha) linha.remove();
        }

        // Adicionar Linha
        else if (el.closest('.add-btn')) { 
            const isModalDia = el.closest('#modal-horarios-dia');
            const html = isModalDia ? `
                <div class="input-time caixa-hora-dia">
                    <div class="grupo-input"><label>INÍCIO</label><input type="time" class="input-intervalo"></div>
                    <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                    <div class="grupo-input"><label>TÉRMINO</label><input type="time" class="input-intervalo"></div>
                    <button type="button" class="limpar">X</button>
                </div>` : `
                <div class="input-time">
                    <input type="time" class="input-intervalo">
                    <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                    <input type="time" class="input-intervalo">
                    <button type="button" class="limpar">X</button>
                </div>`;
            
            const scroll = el.closest('.add-btn').parentElement.querySelector('.container-scroll-horarios');
            if (scroll) scroll.insertAdjacentHTML('beforeend', html);
        }
    });

    // --- FORM SUBMIT: MODAL PADRÃO ---
    const formPadrao = document.querySelector('.formulario-horario-padrao form');
    if (formPadrao) {
        formPadrao.addEventListener('submit', async (e) => {
            e.preventDefault();
            const linhas = formPadrao.querySelectorAll('.input-time');
            
            for (let dia = 1; dia <= 5; dia++) { 
                await limparDiaNoBanco(dia);
                for (const linha of linhas) {
                    const inputs = linha.querySelectorAll('.input-intervalo');
                    if (inputs.length === 2 && inputs[0].value && inputs[1].value) {
                        await salvarIntervaloNoBanco(dia, inputs[0].value, inputs[1].value);
                    }
                }
            }
            document.getElementById('modal-horario-padrao').classList.remove('aberto');
            carregarHorariosDoBanco();
        });
    }

    // --- FORM SUBMIT: MODAL SEMANA ---
    const formSemana = document.querySelector('.form-modal-semana');
    if (formSemana) {
        formSemana.addEventListener('submit', async (e) => {
            e.preventDefault();
            const blocosDeDia = formSemana.querySelectorAll('.dia-modal');
            
            for (const bloco of blocosDeDia) {
                const i = parseInt(bloco.getAttribute('data-index'));
                const toggle = bloco.querySelector('.toggle'); 
                
                await limparDiaNoBanco(i);

                if (toggle && toggle.checked) {
                    const linhas = bloco.querySelectorAll('.input-time');
                    for (const linha of linhas) {
                        const inputs = linha.querySelectorAll('.input-intervalo');
                        if (inputs.length === 2 && inputs[0].value && inputs[1].value) {
                            await salvarIntervaloNoBanco(i, inputs[0].value, inputs[1].value);
                        }
                    }
                }
            }
            document.getElementById('modal-horarios-semana').classList.remove('aberto');
            carregarHorariosDoBanco();
        });
    }

    // --- FORM SUBMIT: MODAL DIA ---
    const formDia = document.querySelector('.form-modal-dia');
    if (formDia) {
        formDia.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById('titulo-modal-dia').textContent.toUpperCase();
            let diaIndex = diasSemana.findIndex(d => titulo.includes(d));
            if (diaIndex === -1) { 
                if (titulo.includes("TERÇA")) diaIndex = 2; 
                if (titulo.includes("SÁBADO") || titulo.includes("SABADO")) diaIndex = 6; 
            }

            if (diaIndex !== -1) {
                await limparDiaNoBanco(diaIndex);
                
                const toggle = document.querySelector('#modal-horarios-dia .salao-aberto .toggle');
                
                if (toggle && toggle.checked) {
                    const linhas = formDia.querySelectorAll('.input-time');
                    for (const linha of linhas) {
                        const inputs = linha.querySelectorAll('.input-intervalo');
                        if (inputs.length === 2 && inputs[0].value && inputs[1].value) {
                            await salvarIntervaloNoBanco(diaIndex, inputs[0].value, inputs[1].value);
                        }
                    }
                }
            }
            document.getElementById('modal-horarios-dia').classList.remove('aberto');
            carregarHorariosDoBanco();
        });
    }
});
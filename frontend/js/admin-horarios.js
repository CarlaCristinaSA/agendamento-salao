/*Gerar os cards de dia e colocar os dias corretos da semana atual*/
const diasSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

function renderizarDiasDaSemana() {
    const containerDias = document.getElementById('container-dias-semana');
    const dataDeHoje = new Date();
    const domingoDestaSemana = new Date(dataDeHoje);
    domingoDestaSemana.setDate(dataDeHoje.getDate() - dataDeHoje.getDay());

    let cardsDias = "";
    for (let i = 0; i < 7; i++) {
        const dataDoCartao = new Date(domingoDestaSemana);
        dataDoCartao.setDate(domingoDestaSemana.getDate() + i);
        
        const numeroDoDia = dataDoCartao.getDate();
        const nomeDoDia = diasSemana[i];
        cardsDias += `
            <section class="card-dia">
                <div class="dia">
                    <span class="nome-dia">${nomeDoDia}</span><br>
                    <strong class="numero-dia">${numeroDoDia}</strong>
                </div>
                <div class="intervalos-dia">
                    <span class="intervalo">10:00 - 12:00</span>
                    <span class="intervalo">14:00 - 18:00</span>
                </div>
            </section>
        `;
    }
    containerDias.innerHTML = cardsDias;
}

// Gerar os dias dentro do modal da semana
function renderizarDiasModalSemana() {
    const containerListaDias = document.getElementById('lista-dias-modal');
    if (!containerListaDias) return;

    let dias = "";

    for (let i = 0; i < 7; i++) {

        dias += `
            <section class="dia-modal">
                <div class="cabecalho-dia-modal">
                    <h2>${diasSemana[i]}</h2>
                    <input type="checkbox" class="toggle" checked>
                </div>
                
                <div class="container-scroll-horarios">
                    <div class="input-time">
                        <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                        <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        <button type="button" class="limpar">X</button>
                    </div>
                </div>
                
                <div class="add-btn">
                    <img src="../../assets/add-icon.svg" alt="Adicionar">
                    <p>ADICIONAR HORÁRIO</p>
                </div>
            </section>
        `;
    }

    containerListaDias.innerHTML = dias;
}

/*funcionamento dos modais*/
document.addEventListener('DOMContentLoaded', () => {
    renderizarDiasDaSemana();
    renderizarDiasModalSemana();

    // Abrir os Modais
    const btnAbrirPadrao = document.getElementById('alterar-horario-padrao');
    const modalPadrao = document.getElementById('modal-horario-padrao');
    const btnAbrirSemana = document.getElementById('horarios-semana'); 
    const modalSemana = document.getElementById('modal-horarios-semana');

    if (btnAbrirPadrao && modalPadrao) {
        btnAbrirPadrao.addEventListener('click', () => modalPadrao.classList.add('aberto'));
    }
    if (btnAbrirSemana && modalSemana) {
        btnAbrirSemana.addEventListener('click', () => modalSemana.classList.add('aberto'));
    }

    document.addEventListener('click', (evento) => {
        const elementoClicado = evento.target;

        // Fechar modal
        if (elementoClicado.classList.contains('fechar-modal') || elementoClicado.id === 'fechar-modal') {
            const modalParaFechar = elementoClicado.closest('.modal');
            if (modalParaFechar) modalParaFechar.classList.remove('aberto'); 
        } 
        else if (elementoClicado.classList.contains('modal')) {
            elementoClicado.classList.remove('aberto');
        }

        // Abrir modal do dia específico
        else if (elementoClicado.closest('.card-dia')) {
            const cardClicado = elementoClicado.closest('.card-dia');
            const modalEditarDia = document.getElementById('modal-horarios-dia');

            if (modalEditarDia) {
                // Pega os dados do card
                const nomeDiaOriginal = cardClicado.querySelector('.nome-dia').textContent; 
                const numeroDia = cardClicado.querySelector('.numero-dia').textContent;     
                // Formata os textos
                const abreviacao = nomeDiaOriginal.substring(0, 3); 
                const nomeFormatado = nomeDiaOriginal.charAt(0) + nomeDiaOriginal.slice(1).toLowerCase();
                document.getElementById('icone-dia-abrev').textContent = abreviacao;
                document.getElementById('icone-dia-num').textContent = numeroDia;
                document.getElementById('titulo-modal-dia').textContent = `Editar ${nomeFormatado}`;
                modalEditarDia.classList.add('aberto');
            }
        }

        // Excluir Linha de Horário
        else if (elementoClicado.classList.contains('limpar')) {
            const linhaParaRemover = elementoClicado.closest('.input-time');
            if (linhaParaRemover) linhaParaRemover.remove();
        }

        // Adicionar Nova Linha de Horário
        else if (elementoClicado.closest('.add-btn')) { 
            const botaoAdicionar = elementoClicado.closest('.add-btn');
            const caixaScroll = botaoAdicionar.parentElement.querySelector('.container-scroll-horarios');
            const isModalDia = elementoClicado.closest('#modal-horarios-dia');

            let novaLinha= "";

            if (isModalDia) {
                // Estrutura para o Modal Dia
                novaLinha= `
                    <div class="input-time caixa-hora-dia">
                        <div class="grupo-input">
                            <label>INÍCIO</label>
                            <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        </div>
                        <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                        <div class="grupo-input">
                            <label>TÉRMINO</label>
                            <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        </div>
                        <button type="button" class="limpar">X</button>
                    </div>
                `;
            } else {
                // Estrutura para os outros modais
                novaLinha = `
                    <div class="input-time">
                        <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                        <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                        <button type="button" class="limpar">X</button>
                    </div>
                `;
            }

            // Insere na caixa de rolagem
            if (caixaScroll) {
                caixaScroll.insertAdjacentHTML('beforeend', novaLinha);
            } else {
                botaoAdicionar.insertAdjacentHTML('beforebegin', novaLinha);
            }
        }
    });
});
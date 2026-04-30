//Ajusta o número do dia no card de acordo com a semana atual
const elementosNumeroDia = document.querySelectorAll('.numero-dia');
const dataDeHoje = new Date();
const domingoDestaSemana = new Date(dataDeHoje);
domingoDestaSemana.setDate(dataDeHoje.getDate() - dataDeHoje.getDay()); 

elementosNumeroDia.forEach((elemento, index) => {
    const dataDoCartao = new Date(domingoDestaSemana);
    dataDoCartao.setDate(domingoDestaSemana.getDate() + index);
    elemento.textContent = dataDoCartao.getDate();
});

/*Ações para o modal de editar horário padrão*/
document.addEventListener('DOMContentLoaded', () => {

    const btnAbrirModal = document.getElementById('alterar-horario-padrao');
    const modalPadrao = document.getElementById('modal-horario-padrao');
    const btnFecharModal = document.querySelector('.fechar-modal');
    const btnAdicionar = document.getElementById('add');
    const formulario = document.querySelector('.formulario-horario-padrao form');
    const listaHorarios = document.getElementById('lista-horarios');

    btnAbrirModal.addEventListener('click', () => {
        modalPadrao.style.display = 'flex';
    });

    btnFecharModal.addEventListener('click', () => {
        modalPadrao.style.display = 'none';
    });

    modalPadrao.addEventListener('click', (evento) => {
        if (evento.target === modalPadrao) {
            modalPadrao.style.display = 'none';
        }
    });

    btnAdicionar.addEventListener('click', () => {
        const novaLinhaHTML = `
            <div class="input-time">
                <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                <img src="../../assets/intervalo-separator-icon.svg" alt="separador">
                <input type="text" class="input-intervalo" onfocus="(this.type='time')" onblur="(this.type='text')">
                <button type="button" class="limpar">X</button>
            </div>
        `;
        listaHorarios.insertAdjacentHTML('beforeend', novaLinhaHTML);
    });

    formulario.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('limpar')) {
            const linhaParaRemover = evento.target.closest('.input-time');
            if (linhaParaRemover) {
                linhaParaRemover.remove();
            }
        }
    });

});
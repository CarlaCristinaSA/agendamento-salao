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
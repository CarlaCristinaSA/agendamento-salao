const Modal = {
    open(id) {
        document.getElementById(id).classList.add('visivel');
        document.getElementById('overlay').classList.add('visivel');
        document.body.style.overflow = 'hidden';
    },
    close(id) {
        document.getElementById(id).classList.remove('visivel');
        const anyOpen = document.querySelector('.modal.visivel');
        if (!anyOpen) {
            document.getElementById('overlay').classList.remove('visivel');
            document.body.style.overflow = '';
        }
    },
    bindOverlayClose(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target.id === overlayId) _fecharModais();
            });
        }
    },
};

function _fecharModais(overlay = true) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('visivel'));
    if (overlay) {
        document.getElementById('overlay').classList.remove('visivel');
        document.body.style.overflow = '';
    }
}

function fecharModais(overlay = true) {
    _fecharModais(overlay);
}

//MODAL DETALHAMENTO
function abrirDetalhamento(nome, tel, email, servico, data, valor) {
    document.getElementById('det-nome').textContent     = nome;
    document.getElementById('det-telefone').textContent = tel;
    document.getElementById('det-email').textContent    = email;
    document.getElementById('det-servico').textContent  = servico;
    document.getElementById('det-data').textContent     = data;
    document.getElementById('det-valor').textContent    = valor;
    Modal.open('modalDetalhamento');
}

function fecharDetalhamento() {
    Modal.close('modalDetalhamento');
}

//MODAL FILTRO
function abrirFiltro() {
    Modal.open('modalFiltro');
}

function fecharFiltro() {
    Modal.close('modalFiltro');
}

//MODAL ORDENAÇÃO
function abrirOrdenacao() {
    Modal.open('modalOrdenacao');
}

function fecharOrdenacao() {
    Modal.close('modalOrdenacao');
}

//MODAL CONFIRMAÇÃO
function abrirConfirmar() {
    Modal.open('modalConfirmar');
}

function fecharConfirmar() {
    Modal.close('modalConfirmar');
}

document.addEventListener('DOMContentLoaded', () => {
    Modal.bindOverlayClose('overlay');
});

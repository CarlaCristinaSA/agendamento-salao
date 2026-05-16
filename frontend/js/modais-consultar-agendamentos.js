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
    const elNome = document.getElementById('det-nome') || document.getElementById('detalheNomeCliente');
    const elTel = document.getElementById('det-telefone');
    const elEmail = document.getElementById('det-email');
    const elServico = document.getElementById('det-servico') || document.getElementById('detalheServico');
    const elData = document.getElementById('det-data') || document.getElementById('detalheData');
    const elValor = document.getElementById('det-valor') || document.getElementById('detalheStatus'); // Usando fallback dependendo da sua versão de HTML
    
    if(elNome) elNome.textContent = nome || 'Não informado';
    if(elTel) elTel.textContent = tel || '--';
    if(elEmail) elEmail.textContent = email || '--';
    if(elServico) elServico.textContent = servico || '--';
    if(elData) elData.textContent = data || '--/--/----';
    if(elValor) elValor.textContent = valor || '--';
    
    Modal.open('modalDetalhamento');
}

function fecharDetalhamento() {
    Modal.close('modalDetalhamento');
}

window.addEventListener('DOMContentLoaded', () => {
    Modal.bindOverlayClose('overlay');
});

// ── MODAL ORDENAÇÃO ───────────────────────────────────────
function abrirOrdenacao() {
    Modal.open('modalOrdenacao');
}

function fecharOrdenacao() {
    Modal.close('modalOrdenacao');
}

// ── MODAL CONFIRMAÇÃO ─────────────────────────────────────
function abrirConfirmacao(idAgendamento) {
    Modal.open('modalConfirmar');
}

function fecharConfirmacao() {
    Modal.close('modalConfirmar');
}
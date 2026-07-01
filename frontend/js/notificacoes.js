'use strict';

const NotifCancelamentoAdmin = (() => {
    const URL_API              = 'http://localhost:3000/api';
    const REDIRECT_LOGIN       = '/frontend/pages/shared/autenticar-usuario.html';
    const CHAVE_VISTOS         = 'espacoBeleza_cancelamentos_vistos';
    const INTERVALO_POLLING_MS = 30_000;
    const LIMITE_POR_PAGINA    = 100;
    const LIMITE_TOTAL_EXIBIDO = 15;

    let cancelamentosCache = [];
    let idsConhecidos      = new Set();
    let primeiraCarga      = true;
    let secaoExpandida     = false;

    function _obterToken() {
        return sessionStorage.getItem('salao_token') || localStorage.getItem('salao_token') || null;
    }

    function _exigirToken() {
        const token = _obterToken();
        if (!token) {
            window.location.href = REDIRECT_LOGIN;
            return null;
        }
        return token;
    }

    function _tratarSessaoExpirada() {
        sessionStorage.removeItem('salao_token');
        sessionStorage.removeItem('salao_admin_nome');
        sessionStorage.removeItem('salao_user_role');
        localStorage.removeItem('salao_token');
        window.location.href = REDIRECT_LOGIN;
    }

    function carregarVistos() {
        try {
            return (JSON.parse(localStorage.getItem(CHAVE_VISTOS)) || []).map(String);
        } catch {
            return [];
        }
    }

    function salvarVistos(lista) {
        const unicos = [...new Set(lista.map(String))].slice(-200);
        localStorage.setItem(CHAVE_VISTOS, JSON.stringify(unicos));
    }

    function marcarComoVisto(id) {
        salvarVistos([...carregarVistos(), String(id)]);
    }

    function marcarTodosComoVistos() {
        salvarVistos([...carregarVistos(), ...cancelamentosCache.map(c => String(c.id))]);
    }

    function _montarISO(data, hora) {
        if (!data) return new Date().toISOString();
        const dataLimpa = String(data).split('T')[0];
        const horaLimpa = String(hora || '00:00').substring(0, 5);
        return `${dataLimpa}T${horaLimpa}:00`;
    }

    function tempoRelativo(isoString) {
        const diff = Date.now() - new Date(isoString).getTime();
        const min  = Math.floor(diff / 60_000);
        if (min < 1)  return 'agora';
        if (min < 60) return `${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24)   return `${h}h`;
        const d = Math.floor(h / 24);
        return d === 1 ? '1 dia' : `${d} dias`;
    }

    async function _buscarTodasPaginasCancelamentos(token) {
        const url1  = `${URL_API}/admin/appointments?status=cancelled&sort=desc&page=1&limit=${LIMITE_POR_PAGINA}`;
        const resp1 = await fetch(url1, { headers: { Authorization: `Bearer ${token}` } });

        if (resp1.status === 401 || resp1.status === 403) return { erroAuth: true };

        const json1 = await resp1.json();
        if (!resp1.ok || json1.success === false) return { erroAuth: false, lista: null };

        let lista          = Array.isArray(json1.data) ? [...json1.data] : [];
        const totalPaginas = json1.pagination?.total_pages || 1;

        if (totalPaginas > 1) {
            const paginas   = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);
            const respostas = await Promise.all(
                paginas.map(p =>
                    fetch(
                        `${URL_API}/admin/appointments?status=cancelled&sort=desc&page=${p}&limit=${LIMITE_POR_PAGINA}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ).then(r => {
                        if (r.status === 401 || r.status === 403) return { _auth: true };
                        return r.json();
                    })
                )
            );
            for (const r of respostas) {
                if (r._auth) return { erroAuth: true };
                if (r.success && Array.isArray(r.data)) lista = lista.concat(r.data);
            }
        }

        return { erroAuth: false, lista };
    }

    async function buscarCancelamentos() {
        const token = _exigirToken();
        if (!token) return null;

        try {
            const resultado = await _buscarTodasPaginasCancelamentos(token);

            if (resultado.erroAuth) {
                _tratarSessaoExpirada();
                return null;
            }

            if (!resultado.lista) return null;

            const vistos = carregarVistos();

            return resultado.lista
                .map(ag => ({
                    id:          ag.id,
                    nomeCliente: ag.client_name  || 'Cliente',
                    servico:     ag.service_name || 'Serviço',
                    dataHora:    _montarISO(ag.appointment_date, ag.appointment_time),
                    canceladoEm: ag.created_at || new Date().toISOString(),
                    visto:       vistos.includes(String(ag.id)),
                }))
                .slice(0, LIMITE_TOTAL_EXIBIDO);
        } catch (erro) {
            console.error('Erro ao buscar cancelamentos:', erro);
            return null;
        }
    }

    function atualizarBadge() {
        const naoVistos = cancelamentosCache.filter(c => !c.visto).length;

        const badge = document.getElementById('notif-badge-nav');
        if (badge) {
            if (naoVistos > 0) {
                badge.textContent    = naoVistos > 9 ? '9+' : naoVistos;
                badge.style.display  = 'inline-flex';
            } else {
                badge.style.display  = 'none';
            }
        }

        const toggle = document.querySelector('.navbar__toggle');
        if (toggle) toggle.classList.toggle('has-notif', naoVistos > 0);
    }

    function _montarToastWrapper() {
        let wrapper = document.getElementById('notif-toast-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'notif-toast-wrapper';
            wrapper.id        = 'notif-toast-wrapper';
            document.body.appendChild(wrapper);
        }
        return wrapper;
    }

    function exibirToast(itens) {
        const naoVistos = itens.filter(c => !c.visto);
        if (naoVistos.length === 0) return;

        const wrapper = _montarToastWrapper();
        const nomes   = naoVistos.slice(0, 3).map(c => c.nomeCliente).join(' · ');
        const extra   = naoVistos.length > 3 ? ` e mais ${naoVistos.length - 3}` : '';

        const toast = document.createElement('div');
        toast.className = 'notif-toast';
        toast.innerHTML = `
            <div class="notif-toast__icone">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
                        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 15L11 17L15 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="notif-toast__corpo">
                <div class="notif-toast__titulo">
                    ${naoVistos.length === 1 ? '1 novo cancelamento' : `${naoVistos.length} novos cancelamentos`}
                </div>
                <div class="notif-toast__nomes">${nomes}${extra}</div>
            </div>
            <button class="notif-toast__fechar" aria-label="Fechar notificação">×</button>
        `;

        wrapper.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('entrando')));

        function fecharToast() {
            toast.classList.remove('entrando');
            toast.classList.add('saindo');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }

        toast.querySelector('.notif-toast__fechar').addEventListener('click', fecharToast);
        setTimeout(fecharToast, 6000);
    }

    function renderizarSecao() {
        const container = document.getElementById('secao-cancelamentos');
        if (!container) return;

        if (cancelamentosCache.length === 0) {
            container.innerHTML = '';
            return;
        }

        const naoVistos = cancelamentosCache.filter(c => !c.visto).length;

        container.innerHTML = `
            <div class="cancelamentos-header${secaoExpandida ? ' aberto' : ''}" id="cancelamentos-header" role="button" tabindex="0" aria-expanded="${secaoExpandida}" aria-controls="cancelamentos-collapse">
                <div class="cancelamentos-titulo">
                    <span class="cancelamentos-titulo__dot"></span>
                    <span class="cancelamentos-titulo__texto">Cancelamentos recentes</span>
                    ${naoVistos > 0
                        ? `<span class="cancelamentos-titulo__contagem">${naoVistos} ${naoVistos === 1 ? 'novo' : 'novos'}</span>`
                        : ''}
                </div>
                <div class="cancelamentos-header__acoes">
                    ${naoVistos > 0
                        ? `<button class="cancelamentos-marcar-btn" id="btn-marcar-todos">Marcar todos como vistos</button>`
                        : ''}
                    <span class="cancelamentos-chevron">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 10L12 6" stroke="#717182" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                </div>
            </div>
            <div class="cancelamentos-collapse${secaoExpandida ? ' aberto' : ''}" id="cancelamentos-collapse">
                <div class="cancelamentos-lista" id="cancelamentos-lista"></div>
            </div>
            <div class="cancelamentos-divider"></div>
        `;

        const lista = document.getElementById('cancelamentos-lista');

        cancelamentosCache.forEach(c => {
            const item = document.createElement('div');
            item.className  = `cancelamento-item${c.visto ? ' visto' : ''}`;
            item.dataset.id = c.id;

            const dataFmt = new Date(c.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const horaFmt = new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="cancelamento-icone">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
                            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 16L11 18L15 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="cancelamento-info">
                    <div class="cancelamento-nome">${c.nomeCliente}</div>
                    <div class="cancelamento-detalhe">${c.servico} &nbsp;·&nbsp; ${dataFmt} às ${horaFmt}</div>
                </div>
                <div class="cancelamento-meta">
                    <span class="cancelamento-tempo">${tempoRelativo(c.canceladoEm)}</span>
                    <span class="cancelamento-dot" ${c.visto ? 'style="display:none"' : ''}></span>
                </div>
            `;

            item.addEventListener('click', () => {
                marcarComoVisto(c.id);
                c.visto = true;
                item.classList.add('visto');
                atualizarBadge();

                const nvos   = cancelamentosCache.filter(x => !x.visto).length;
                const contagem = container.querySelector('.cancelamentos-titulo__contagem');
                if (contagem) {
                    nvos > 0
                        ? (contagem.textContent = `${nvos} ${nvos === 1 ? 'novo' : 'novos'}`)
                        : contagem.remove();
                }
                const btnMarcar = document.getElementById('btn-marcar-todos');
                if (btnMarcar && nvos === 0) btnMarcar.remove();
            });

            lista.appendChild(item);
        });

        const btnTodos = document.getElementById('btn-marcar-todos');
        if (btnTodos) {
            btnTodos.addEventListener('click', (evento) => {
                evento.stopPropagation();
                marcarTodosComoVistos();
                cancelamentosCache.forEach(c => (c.visto = true));
                renderizarSecao();
                atualizarBadge();
            });
        }

        const header = document.getElementById('cancelamentos-header');
        function alternarSecao() {
            secaoExpandida = !secaoExpandida;
            header.classList.toggle('aberto', secaoExpandida);
            header.setAttribute('aria-expanded', secaoExpandida);
            document.getElementById('cancelamentos-collapse').classList.toggle('aberto', secaoExpandida);
        }
        header.addEventListener('click', alternarSecao);
        header.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                alternarSecao();
            }
        });
    }

    async function atualizar() {
        const novaLista = await buscarCancelamentos();
        if (novaLista === null) return;

        if (primeiraCarga) {
            cancelamentosCache = novaLista;
            idsConhecidos      = new Set(novaLista.map(c => String(c.id)));
            atualizarBadge();
            renderizarSecao();
            exibirToast(cancelamentosCache);
            primeiraCarga = false;
            return;
        }

        const novos        = novaLista.filter(c => !idsConhecidos.has(String(c.id)));
        cancelamentosCache = novaLista;
        idsConhecidos      = new Set(novaLista.map(c => String(c.id)));

        atualizarBadge();
        renderizarSecao();
        if (novos.length > 0) exibirToast(novos);
    }

    function init() {
        atualizar();
        setInterval(atualizar, INTERVALO_POLLING_MS);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') atualizar();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { marcarComoVisto, marcarTodosComoVistos, atualizar };
})();
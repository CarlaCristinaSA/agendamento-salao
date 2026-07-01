'use strict';

const NotifAdmin = (() => {
    const URL_API              = 'http://localhost:3000/api';
    const REDIRECT_LOGIN       = '/frontend/pages/shared/autenticar-usuario.html';
    const INTERVALO_POLLING_MS = 30_000;
    const LIMITE_POR_PAGINA    = 100;
    const LIMITE_TOTAL_EXIBIDO = 15;

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

    async function _buscarTodasPaginas(token, queryString) {
        const url1  = `${URL_API}/admin/appointments?${queryString}&page=1&limit=${LIMITE_POR_PAGINA}`;
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
                        `${URL_API}/admin/appointments?${queryString}&page=${p}&limit=${LIMITE_POR_PAGINA}`,
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

    function criarCanal(cfg) {
        let cache          = [];
        let idsConhecidos  = new Set();
        let primeiraCarga  = true;
        let secaoExpandida = false;

        function carregarVistos() {
            try {
                return (JSON.parse(localStorage.getItem(cfg.chaveVistos)) || []).map(String);
            } catch {
                return [];
            }
        }

        function salvarVistos(lista) {
            const unicos = [...new Set(lista.map(String))].slice(-200);
            localStorage.setItem(cfg.chaveVistos, JSON.stringify(unicos));
        }

        function marcarComoVisto(id) {
            salvarVistos([...carregarVistos(), String(id)]);
        }

        function marcarTodosComoVistos() {
            salvarVistos([...carregarVistos(), ...cache.map(c => String(c.id))]);
        }

        async function buscar() {
            const token = _exigirToken();
            if (!token) return null;

            try {
                const resultado = await _buscarTodasPaginas(token, cfg.queryString);

                if (resultado.erroAuth) {
                    _tratarSessaoExpirada();
                    return null;
                }
                if (!resultado.lista) return null;

                const vistos = carregarVistos();
                let itens = resultado.lista;
                if (typeof cfg.filtro === 'function') itens = itens.filter(cfg.filtro);

                return itens
                    .map(ag => ({
                        id:          ag.id,
                        nomeCliente: ag.client_name  || 'Cliente',
                        servico:     ag.service_name || 'Serviço',
                        dataHora:    _montarISO(ag.appointment_date, ag.appointment_time),
                        referenciaEm: ag.created_at || new Date().toISOString(),
                        visto:       vistos.includes(String(ag.id)),
                    }))
                    .slice(0, LIMITE_TOTAL_EXIBIDO);
            } catch (erro) {
                console.error(`Erro ao buscar (${cfg.chaveVistos}):`, erro);
                return null;
            }
        }

        function atualizarBadge() {
            const naoVistos = cache.filter(c => !c.visto).length;

            const badge = document.getElementById(cfg.badgeId);
            if (badge) {
                if (naoVistos > 0) {
                    badge.textContent   = naoVistos > 9 ? '9+' : naoVistos;
                    badge.style.display = 'inline-flex';
                } else {
                    badge.style.display = 'none';
                }
            }

            const totalNaoVistoGeral = document.querySelectorAll('.notif-badge')
                .length > 0
                ? Array.from(document.querySelectorAll('.notif-badge'))
                    .some(b => b.style.display !== 'none')
                : false;

            const toggle = document.querySelector('.navbar__toggle');
            if (toggle) toggle.classList.toggle('has-notif', totalNaoVistoGeral);
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
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${cfg.iconeSvg}</svg>
                </div>
                <div class="notif-toast__corpo">
                    <div class="notif-toast__titulo">
                        ${naoVistos.length === 1 ? cfg.tituloToastSingular(naoVistos.length) : cfg.tituloToastPlural(naoVistos.length)}
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

        const ICONE_SINO_BTN = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        function _removerItemComAnimacao(itemEl, aposRemover) {
            itemEl.classList.add('saindo');
            itemEl.addEventListener('transitionend', () => {
                itemEl.remove();
                if (typeof aposRemover === 'function') aposRemover();
            }, { once: true });
            setTimeout(() => {
                if (itemEl.isConnected) {
                    itemEl.remove();
                    if (typeof aposRemover === 'function') aposRemover();
                }
            }, 350);
        }

        function renderizarSecao() {
            const container = document.getElementById(cfg.secaoId);
            if (!container) return;

            const naoVistosLista = cache.filter(c => !c.visto);

            if (naoVistosLista.length === 0) {
                container.innerHTML = '';
                return;
            }

            const naoVistos = naoVistosLista.length;

            container.innerHTML = `
                <div class="cancelamentos-header${secaoExpandida ? ' aberto' : ''}" id="${cfg.secaoId}-header" role="button" tabindex="0" aria-expanded="${secaoExpandida}" aria-controls="${cfg.secaoId}-collapse">
                    <div class="cancelamentos-titulo">
                        <span class="cancelamentos-titulo__dot"></span>
                        <span class="cancelamentos-titulo__texto">${cfg.tituloSecao}</span>
                        <span class="cancelamentos-titulo__contagem">${naoVistos} ${naoVistos === 1 ? 'novo' : 'novos'}</span>
                    </div>
                    <div class="cancelamentos-header__acoes">
                        <button class="cancelamentos-marcar-btn" id="${cfg.secaoId}-marcar-todos">Marcar todos como vistos</button>
                        <span class="cancelamentos-chevron">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6L8 10L12 6" stroke="#717182" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                    </div>
                </div>
                <div class="cancelamentos-collapse${secaoExpandida ? ' aberto' : ''}" id="${cfg.secaoId}-collapse">
                    <div class="cancelamentos-lista" id="${cfg.secaoId}-lista"></div>
                </div>
                <div class="cancelamentos-divider"></div>
            `;

            const lista = document.getElementById(`${cfg.secaoId}-lista`);

            naoVistosLista.forEach(c => {
                const item = document.createElement('div');
                item.className  = 'cancelamento-item';
                item.dataset.id = c.id;

                const dataFmt = new Date(c.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const horaFmt = new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                item.innerHTML = `
                    <div class="cancelamento-icone">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${cfg.iconeSvg}</svg>
                    </div>
                    <div class="cancelamento-info">
                        <div class="cancelamento-nome">${c.nomeCliente}</div>
                        <div class="cancelamento-detalhe">${c.servico} &nbsp;·&nbsp; ${dataFmt} às ${horaFmt}</div>
                    </div>
                    <div class="cancelamento-meta">
                        <span class="cancelamento-tempo">${tempoRelativo(c.referenciaEm)}</span>
                        <button class="cancelamento-marcar-visto-btn" type="button" title="Marcar como visto" aria-label="Marcar como visto">
                            ${ICONE_SINO_BTN}
                        </button>
                    </div>
                `;

                item.querySelector('.cancelamento-marcar-visto-btn').addEventListener('click', (evento) => {
                    evento.stopPropagation();
                    marcarComoVisto(c.id);
                    c.visto = true;
                    atualizarBadge();

                    _removerItemComAnimacao(item, () => {
                        const restantes = cache.filter(x => !x.visto).length;

                        if (restantes === 0) {
                            container.innerHTML = '';
                            return;
                        }

                        const contagem = container.querySelector('.cancelamentos-titulo__contagem');
                        if (contagem) contagem.textContent = `${restantes} ${restantes === 1 ? 'novo' : 'novos'}`;
                    });
                });

                lista.appendChild(item);
            });

            const btnTodos = document.getElementById(`${cfg.secaoId}-marcar-todos`);
            if (btnTodos) {
                btnTodos.addEventListener('click', (evento) => {
                    evento.stopPropagation();
                    marcarTodosComoVistos();
                    cache.forEach(c => (c.visto = true));
                    renderizarSecao();
                    atualizarBadge();
                });
            }

            const header = document.getElementById(`${cfg.secaoId}-header`);
            function alternarSecao() {
                secaoExpandida = !secaoExpandida;
                header.classList.toggle('aberto', secaoExpandida);
                header.setAttribute('aria-expanded', secaoExpandida);
                document.getElementById(`${cfg.secaoId}-collapse`).classList.toggle('aberto', secaoExpandida);
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
            const novaLista = await buscar();
            if (novaLista === null) return;

            if (primeiraCarga) {
                cache         = novaLista;
                idsConhecidos = new Set(novaLista.map(c => String(c.id)));
                atualizarBadge();
                renderizarSecao();
                exibirToast(cache);
                primeiraCarga = false;
                return;
            }

            const novos   = novaLista.filter(c => !idsConhecidos.has(String(c.id)));
            cache         = novaLista;
            idsConhecidos = new Set(novaLista.map(c => String(c.id)));

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
    }

    return { criarCanal };
})();

const ICONE_CALENDARIO_CHECK = `
    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 15L11 17L15 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
`;

const ICONE_SINO = `
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
`;

const NotifCancelamentoAdmin = NotifAdmin.criarCanal({
    chaveVistos:       'espacoBeleza_cancelamentos_vistos',
    queryString:       'status=cancelled&sort=desc',
    badgeId:           'notif-badge-nav',
    secaoId:           'secao-cancelamentos',
    tituloSecao:       'Cancelamentos recentes',
    tituloToastSingular: () => '1 novo cancelamento',
    tituloToastPlural:   (n) => `${n} novos cancelamentos`,
    iconeSvg:          ICONE_CALENDARIO_CHECK,
});

const NotifAgendamentoAdmin = NotifAdmin.criarCanal({
    chaveVistos:       'espacoBeleza_novos_agendamentos_vistos',
    queryString:       'status=confirmed&sort=desc',
    badgeId:           'notif-badge-nav-agendamentos',
    secaoId:           'secao-novos-agendamentos',
    tituloSecao:       'Novos agendamentos',
    tituloToastSingular: () => '1 novo agendamento',
    tituloToastPlural:   (n) => `${n} novos agendamentos`,
    iconeSvg:          ICONE_SINO,
});

window.NotifCancelamentoAdmin = NotifCancelamentoAdmin;
window.NotifAgendamentoAdmin  = NotifAgendamentoAdmin;
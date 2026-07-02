'use strict';

const NotifCliente = (() => {
    const URL_API               = 'http://localhost:3000/api';
    const REDIRECT_LOGIN        = '/frontend/pages/shared/autenticar-usuario.html';
    const INTERVALO_POLLING_MS  = 30_000;
    const JANELA_LEMBRETE_MS    = 24 * 60 * 60 * 1000;

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

    function _ehCancelado(ag) {
        return String(ag.status || '').toLowerCase() === 'cancelled';
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

    async function _buscarMeusAgendamentos(token) {
        const resp = await fetch(`${URL_API}/client/appointments`, { headers: { Authorization: `Bearer ${token}` } });
        if (resp.status === 401 || resp.status === 403) return { erroAuth: true };

        const json = await resp.json();
        if (!resp.ok || json.success === false) return { erroAuth: false, lista: null };

        const upcoming = Array.isArray(json.data?.upcoming) ? json.data.upcoming : [];
        const history  = Array.isArray(json.data?.history)  ? json.data.history  : [];

        return { erroAuth: false, lista: [...upcoming, ...history] };
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

    const ICONE_CANCELADO = `
        <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9L15 15M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    const ICONE_LEMBRETE = `
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    const ICONE_SINO_BTN = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    // ─── FÁBRICA DE CANAL (mesmo padrão usado no admin: badge + seção expansível + toast) ───
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
            const item = cache.find(c => String(c.id) === String(id));
            if (item) item.visto = true;
            atualizarBadge();
        }

        function marcarTodosComoVistos() {
            salvarVistos([...carregarVistos(), ...cache.map(c => String(c.id))]);
        }

        function processarLista(listaBruta) {
            const vistos = carregarVistos();
            return listaBruta
                .filter(cfg.filtro)
                .map(ag => ({
                    id:           ag.id,
                    servico:      ag.service_name || 'Serviço',
                    dataHora:     _montarISO(ag.appointment_date, ag.appointment_time),
                    referenciaEm: ag.updated_at || ag.created_at || new Date().toISOString(),
                    visto:        vistos.includes(String(ag.id)),
                }))
                .slice(0, cfg.limite || 15);
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

            const algumBadgeVisivel = Array.from(document.querySelectorAll('.notif-badge'))
                .some(b => b.style.display !== 'none');
            const toggle = document.querySelector('.navbar__toggle');
            if (toggle) toggle.classList.toggle('has-notif', algumBadgeVisivel);
        }

        function exibirToast(itens) {
            const naoVistos = itens.filter(c => !c.visto);
            if (naoVistos.length === 0) return;

            const wrapper = _montarToastWrapper();

            naoVistos.slice(0, 3).forEach(c => {
                const data = new Date(c.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const hora = new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                const toast = document.createElement('div');
                toast.className = 'notif-toast';
                toast.innerHTML = `
                    <div class="notif-toast__icone">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${cfg.iconeSvg}</svg>
                    </div>
                    <div class="notif-toast__corpo">
                        <div class="notif-toast__titulo"></div>
                        <div class="notif-toast__nomes"></div>
                    </div>
                    <button class="notif-toast__fechar" aria-label="Fechar notificação">×</button>
                `;

                const tituloEl = toast.querySelector('.notif-toast__titulo');
                if (tituloEl) tituloEl.textContent = cfg.tituloToast;

                const nomesEl = toast.querySelector('.notif-toast__nomes');
                if (nomesEl) {
                    nomesEl.textContent = `${c.servico} · ${data}${cfg.mostrarHoraToast ? ` às ${hora}` : ''}`;
                }

                wrapper.appendChild(toast);
                requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('entrando')));

                function fechar() {
                    toast.classList.remove('entrando');
                    toast.classList.add('saindo');
                    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                }
                toast.querySelector('.notif-toast__fechar').addEventListener('click', fechar);
                setTimeout(fechar, 7000);
            });
        }

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
            if (!container) return; // a seção só existe nas páginas onde foi inserida no HTML

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
                        <div class="cancelamento-nome"></div>
                        <div class="cancelamento-detalhe"></div>
                    </div>
                    <div class="cancelamento-meta">
                        <button class="cancelamento-marcar-visto-btn" type="button" title="Marcar como visto" aria-label="Marcar como visto">
                            ${ICONE_SINO_BTN}
                        </button>
                    </div>
                `;

                const nomeEl = item.querySelector('.cancelamento-nome');
                if (nomeEl) nomeEl.textContent = c.servico;

                const detalheEl = item.querySelector('.cancelamento-detalhe');
                if (detalheEl) detalheEl.textContent = `${dataFmt} às ${horaFmt}`;

                item.querySelector('.cancelamento-marcar-visto-btn').addEventListener('click', (evento) => {
                    evento.stopPropagation();
                    marcarComoVisto(c.id);

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

        function processar(listaBruta) {
            const novaLista = processarLista(listaBruta);

            if (primeiraCarga) {
                cache         = novaLista;
                idsConhecidos = new Set(novaLista.map(c => String(c.id)));
                atualizarBadge();
                renderizarSecao();
                if (cfg.notificarNaPrimeiraCarga) exibirToast(cache);
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

        return { processar, marcarComoVisto, marcarTodosComoVistos };
    }

    // Canal 1: cancelamentos feitos pelo admin -> aparece no Histórico
    const CanalCancelamentos = criarCanal({
        chaveVistos:              'espacoBeleza_cliente_cancelamentos_vistos',
        badgeId:                  'notif-badge-historico-cliente',
        secaoId:                  'secao-cancelamentos-cliente',
        tituloSecao:              'Cancelamentos recentes',
        tituloToast:              'Um agendamento seu foi cancelado',
        iconeSvg:                 ICONE_CANCELADO,
        filtro:                   (ag) => _ehCancelado(ag),
        limite:                   15,
        notificarNaPrimeiraCarga: false, // evita alarme falso com cancelamentos antigos na 1ª carga
        mostrarHoraToast:         true,
    });

    // Canal 2: lembretes de agendamentos nas próximas 24h -> aparece em Agendamentos
    const CanalLembretes = criarCanal({
        chaveVistos:              'espacoBeleza_cliente_lembretes_vistos',
        badgeId:                  'notif-badge-agendamentos-cliente',
        secaoId:                  'secao-lembretes-cliente',
        tituloSecao:              'Agendamentos nas próximas 24h',
        tituloToast:              'Você tem um agendamento próximo',
        iconeSvg:                 ICONE_LEMBRETE,
        filtro:                   (ag) => {
            if (_ehCancelado(ag)) return false;
            const inicio = new Date(_montarISO(ag.appointment_date, ag.appointment_time)).getTime();
            const faltam = inicio - Date.now();
            return faltam > 0 && faltam <= JANELA_LEMBRETE_MS;
        },
        limite:                   15,
        notificarNaPrimeiraCarga: true, // faz sentido avisar já na entrada se há algo próximo
        mostrarHoraToast:         true,
    });

    async function atualizar() {
        const token = _exigirToken();
        if (!token) return;

        try {
            const resultado = await _buscarMeusAgendamentos(token);

            if (resultado.erroAuth) {
                _tratarSessaoExpirada();
                return;
            }
            if (!resultado.lista) return;

            CanalCancelamentos.processar(resultado.lista);
            CanalLembretes.processar(resultado.lista);
        } catch (erro) {
            console.error('Erro ao verificar notificações do cliente:', erro);
        }
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

    return { atualizar, marcarCancelamentoComoVisto: CanalCancelamentos.marcarComoVisto };
})();

window.NotifCliente = NotifCliente;
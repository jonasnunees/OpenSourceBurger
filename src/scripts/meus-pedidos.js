/**
 * meus-pedidos.js
 * Lógica da página Meus Pedidos do Open Source Burger.
 *
 * Responsabilidades:
 *  - Verificar autenticação e redirecionar para login se necessário
 *  - Popular a faixa do usuário com o nome da sessão
 *  - Buscar pedidos do Supabase com paginação (10 por vez)
 *  - Renderizar cards de pedidos com data, número, total, status e avaliação
 *  - Exibir estrelas preenchidas para pedidos já avaliados
 *  - Exibir link "Avaliar Pedido" para pedidos finalizados sem avaliação
 *  - Controlar o botão "Mostrar mais" conforme há mais registros
 *  - Realizar logout via Auth.logout()
 *
 * Dependências (ordem de carregamento no HTML):
 *  supabase.js → config.js → auth.js → lucide → common.js → meus-pedidos.js
 *
 * Tabelas Supabase utilizadas:
 *  - pedidos      (id, numero, status, total, criado_em)
 *  - avaliacoes   (pedido_id, nota)
 *
 * Expõe: nada (IIFE sem namespace público necessário nesta página)
 */

(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════
  // CONSTANTES
  // ══════════════════════════════════════════════════════════

  const PAGE_SIZE = 10;

  /** Ícone e rótulo por status */
  const STATUS_CONFIG = {
    finalizado: { icone: "circle-check-big", label: "Pedido Finalizado" },
    em_preparo: { icone: "chef-hat",         label: "Em Preparo"        },
    a_caminho:  { icone: "bike",             label: "A Caminho"         },
    pendente:   { icone: "clock",            label: "Pendente"          },
    cancelado:  { icone: "circle-x",         label: "Cancelado"         },
  };

  // ══════════════════════════════════════════════════════════
  // ESTADO
  // ══════════════════════════════════════════════════════════

  let offset = 0;
  let carregando = false;

  // ══════════════════════════════════════════════════════════
  // SELETORES
  // ══════════════════════════════════════════════════════════

  const accountNameEl  = document.getElementById("account-name");
  const btnLogout      = document.getElementById("btn-logout");
  const loadingEl      = document.getElementById("pedidos-loading");
  const emptyEl        = document.getElementById("pedidos-empty");
  const listaEl        = document.getElementById("pedidos-lista");
  const maisWrapEl     = document.getElementById("pedidos-mais-wrap");
  const btnMais        = document.getElementById("btn-mais-pedidos");

  // ══════════════════════════════════════════════════════════
  // FAIXA DO USUÁRIO
  // ══════════════════════════════════════════════════════════

  function renderUserBanner() {
    const session = Auth.getSession();
    if (!session?.name) return;
    accountNameEl.textContent = session.name.toUpperCase();
  }

  // ══════════════════════════════════════════════════════════
  // FORMATAÇÃO
  // ══════════════════════════════════════════════════════════

  /**
   * Formata data ISO para dd/mm/aaaa.
   * @param {string} isoString
   * @returns {string}
   */
  function formatarData(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    });
  }

  /**
   * Formata valor numérico para moeda brasileira.
   * @param {number} valor
   * @returns {string}
   */
  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style:    "currency",
      currency: "BRL",
    });
  }

  // ══════════════════════════════════════════════════════════
  // RENDERIZAÇÃO
  // ══════════════════════════════════════════════════════════

  /**
   * Gera o HTML das estrelas de avaliação.
   * Preenche as estrelas até a nota, deixa o restante vazio.
   * @param {number} nota - 1 a 5
   * @returns {string}
   */
  function htmlEstrelas(nota) {
    return Array.from({ length: 5 }, (_, i) => {
      const preenchida = i < nota;
      return `<i
        data-lucide="star"
        class="pedido-card__estrela--${preenchida ? "preenchida" : "vazia"}"
        aria-hidden="true"
      ></i>`;
    }).join("");
  }

  /**
   * Gera o HTML da área de avaliação do card.
   * - Pedido finalizado sem avaliação → link "Avaliar Pedido"
   * - Pedido com avaliação → estrelas preenchidas
   * - Demais status → vazio
   *
   * @param {string} status
   * @param {number|null} nota
   * @param {string} pedidoId
   * @returns {string}
   */
  function htmlAvaliacao(status, nota, pedidoId) {
    if (nota !== null && nota !== undefined) {
      return `
        <div class="pedido-card__estrelas" aria-label="Avaliação: ${nota} de 5 estrelas">
          ${htmlEstrelas(nota)}
        </div>`;
    }

    if (status === "finalizado") {
      return `
        <a
          href="avaliar-pedido.html?id=${pedidoId}"
          class="pedido-card__avaliar"
          aria-label="Avaliar pedido número ${pedidoId}"
        >
          Avaliar Pedido
        </a>`;
    }

    return "";
  }

  /**
   * Gera o HTML completo de um card de pedido.
   * @param {{ id, numero, status, total, criado_em, nota }} pedido
   * @returns {string}
   */
  function htmlCard(pedido) {
    const { id, numero, status, total, criado_em, nota } = pedido;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendente;

    return `
      <li class="pedido-card">
        <div class="pedido-card__linha-topo">
          <span class="pedido-card__data">${formatarData(criado_em)}</span>
          <span class="pedido-card__numero">#${numero}</span>
          <span class="pedido-card__total">${formatarMoeda(total)}</span>
        </div>
        <div class="pedido-card__linha-base">
          <span class="pedido-card__status" data-status="${status}">
            <i data-lucide="${cfg.icone}" aria-hidden="true"></i>
            ${cfg.label}
          </span>
          ${htmlAvaliacao(status, nota, id)}
        </div>
      </li>`;
  }

  // ══════════════════════════════════════════════════════════
  // BUSCA DE DADOS
  // ══════════════════════════════════════════════════════════

  /**
   * Busca a próxima página de pedidos do Supabase.
   *
   * Usa LEFT JOIN com avaliacoes para trazer a nota em uma
   * única query, evitando N+1 requests.
   *
   * Ordenação: mais recentes primeiro (criado_em DESC).
   *
   * @returns {Promise<{ pedidos: object[], temMais: boolean }>}
   */
  async function buscarPedidos() {
    const session = Auth.getSession();

    // Busca PAGE_SIZE + 1 para saber se há mais registros
    const { data, error } = await SupabaseClient
      .from("pedidos")
      .select(`
        id,
        numero,
        status,
        total,
        criado_em,
        avaliacoes ( nota )
      `)
      .eq("user_id", session.id)
      .order("criado_em", { ascending: false })
      .range(offset, offset + PAGE_SIZE);

    if (error) throw error;

    // Normaliza a nota: avaliacoes é array de 1 item ou vazio (LEFT JOIN)
    const pedidos = data.slice(0, PAGE_SIZE).map((p) => ({
      ...p,
      nota: p.avaliacoes?.[0]?.nota ?? null,
    }));

    return {
      pedidos,
      temMais: data.length > PAGE_SIZE,
    };
  }

  // ══════════════════════════════════════════════════════════
  // CONTROLE DE UI
  // ══════════════════════════════════════════════════════════

  function mostrarLoading() {
    loadingEl.hidden  = false;
    listaEl.hidden    = true;
    emptyEl.hidden    = true;
    maisWrapEl.hidden = true;
  }

  function ocultarLoading() {
    loadingEl.hidden = true;
  }

  function mostrarVazio() {
    emptyEl.hidden = false;
  }

  function mostrarLista() {
    listaEl.hidden = false;
  }

  // ══════════════════════════════════════════════════════════
  // CARREGAMENTO DE PEDIDOS
  // ══════════════════════════════════════════════════════════

  /**
   * Carrega e renderiza a próxima página de pedidos.
   * Controla o estado de loading e o botão "Mostrar mais".
   */
  async function carregarPedidos() {
    if (carregando) return;
    carregando = true;

    if (offset === 0) mostrarLoading();

    btnMais.disabled = true;

    try {
      const { pedidos, temMais } = await buscarPedidos();

      ocultarLoading();

      if (offset === 0 && pedidos.length === 0) {
        mostrarVazio();
        return;
      }

      // Renderiza os cards e injeta no final da lista
      listaEl.insertAdjacentHTML(
        "beforeend",
        pedidos.map(htmlCard).join("")
      );

      mostrarLista();

      // Reinicia ícones Lucide apenas nos cards novos
      if (typeof lucide !== "undefined") lucide.createIcons();

      offset += pedidos.length;

      // Exibe ou oculta o botão conforme há mais registros
      maisWrapEl.hidden  = !temMais;
      btnMais.disabled   = false;

    } catch (_err) {
      ocultarLoading();

      // Exibe erro somente se a lista ainda estiver vazia
      if (offset === 0) mostrarVazio();
    } finally {
      carregando = false;
    }
  }

  // ══════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════

  function initLogout() {
    btnLogout.addEventListener("click", () => {
      Auth.logout();
    });
  }

  // ══════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════

  async function init() {
    Auth.requireAuth();

    renderUserBanner();
    initLogout();

    btnMais.addEventListener("click", carregarPedidos);

    await carregarPedidos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
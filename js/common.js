/**
 * common.js
 * Centraliza comportamentos compartilhados entre todas as páginas.
 *
 * Responsabilidades:
 * - Drawer de navegação mobile
 * - Links de WhatsApp dinâmicos
 * - Sistema de tabs acessível (WCAG 2.1)
 * - Modal global de horários
 * - Inicialização global do Lucide Icons
 * - Módulo Cart: carrinho persistido com expiração automática
 * - Namespace Store: regras gerais de funcionamento da loja
 *
 * Dependências:
 * - config.js deve ser carregado antes deste arquivo.
 *
 * Ordem de carregamento:
 * - Após config.js e utils/
 * - Antes dos scripts específicos de cada página
 */

// ── Constantes Globais ──────────────────────────────────────────────────────

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_CART_TTL_MS = 4 * 60 * 60 * 1000;

// ── UI ──────────────────────────────────────────────────────────────────────

const UI = (() => {
  // ── Drawer ────────────────────────────────────────────────────────────────

  /**
   * Inicializa o drawer de navegação mobile com suporte a teclado e ARIA.
   *
   * Se os elementos necessários não existirem na página atual,
   * a função é encerrada silenciosamente.
   */
  function initDrawer() {
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("drawer-overlay");
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-drawer-btn");

    if (!drawer || !menuBtn) return;

    function openDrawer() {
      drawer.classList.add("is-open");
      overlay?.classList.add("is-open");
      overlay?.removeAttribute("aria-hidden");

      document.body.style.overflow = "hidden";
      menuBtn.setAttribute("aria-expanded", "true");
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      overlay?.classList.remove("is-open");
      overlay?.setAttribute("aria-hidden", "true");

      document.body.style.overflow = "";
      menuBtn.setAttribute("aria-expanded", "false");
    }

    function closeDrawerWithKeyboard(event) {
      const isEscapeKey = event.key === "Escape";
      const isDrawerOpen = drawer.classList.contains("is-open");

      if (!isEscapeKey || !isDrawerOpen) return;

      closeDrawer();
      menuBtn.focus();
    }

    menuBtn.addEventListener("click", openDrawer);
    overlay?.addEventListener("click", closeDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", closeDrawerWithKeyboard);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  /**
   * Preenche todos os links [data-whatsapp] com número e mensagem do CONFIG.
   *
   * Isso evita repetir o link completo do WhatsApp manualmente em cada página.
   */
  function initWhatsapp() {
    const { numero, whatsappMensagem } = CONFIG.contato;
    const whatsappLinks = document.querySelectorAll("[data-whatsapp]");

    whatsappLinks.forEach((link) => {
      link.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  /**
   * Inicializa o sistema de tabs acessível em qualquer container.
   *
   * Segue o padrão ARIA Tabs com navegação por teclado (WCAG 2.1 SC 2.1.1).
   *
   * Markup esperado:
   * [role="tab"] → botões de aba
   * [role="tabpanel"] → painéis de conteúdo
   * aria-controls → ID do painel que o botão controla
   *
   * @param {string | HTMLElement | Document} [scope=document]
   */
  function initTabs(scope = document) {
    const container = typeof scope === "string" ? document.querySelector(scope) : scope;

    if (!container) return;

    const tabButtons = container.querySelectorAll("[role='tab']");
    const tabPanels = container.querySelectorAll("[role='tabpanel']");

    if (!tabButtons.length) return;

    /**
     * Desativa todas as abas e painéis antes de ativar a aba selecionada.
     */
    function resetTabs() {
      tabButtons.forEach((button) => {
        button.setAttribute("aria-selected", "false");
        button.setAttribute("tabindex", "-1");
      });

      tabPanels.forEach((panel) => {
        panel.classList.remove("is-active");
      });
    }

    /**
     * Ativa uma aba e seu painel correspondente.
     *
     * @param {HTMLElement} selectedButton
     */
    function activateTab(selectedButton) {
      resetTabs();

      selectedButton.setAttribute("aria-selected", "true");
      selectedButton.setAttribute("tabindex", "0");

      const targetId = selectedButton.getAttribute("aria-controls");
      const targetPanel = document.getElementById(targetId);

      targetPanel?.classList.add("is-active");
    }

    /**
     * Move o foco para a próxima aba ou para a aba anterior.
     *
     * @param {HTMLElement} currentButton
     * @param {number} direction
     */
    function moveTabFocus(currentButton, direction) {
      const buttons = [...tabButtons];
      const currentIndex = buttons.indexOf(currentButton);
      const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
      const nextButton = buttons[nextIndex];

      nextButton.focus();
      activateTab(nextButton);
    }

    /**
     * Permite navegar entre abas usando as setas do teclado.
     *
     * @param {KeyboardEvent} event
     * @param {HTMLElement} currentButton
     */
    function handleTabKeyboard(event, currentButton) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveTabFocus(currentButton, 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveTabFocus(currentButton, -1);
      }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button));
      button.addEventListener("keydown", (event) => handleTabKeyboard(event, button));
    });
  }

  // ── Modais Globais ────────────────────────────────────────────────────────

  /**
   * Inicializa o modal de horários em qualquer página que possua o HTML necessário.
   *
   * Se a página atual não tiver o modal ou o botão de abertura,
   * a função apenas encerra sem gerar erro.
   */
  function initModalHorarios() {
    const modal = document.getElementById("hours-modal");
    const openButton = document.getElementById("open-hours-btn") || document.querySelector(".hours-link");

    if (!modal || !openButton) return;

    const okButton = modal.querySelector(".modal-ok");
    const hoursList = document.getElementById("hours-list");

    renderHoursList(hoursList);

    openButton.addEventListener("click", () => openModal(modal));
    okButton?.addEventListener("click", () => closeModal(modal));
  }

  /**
   * Renderiza a lista de horários dentro do modal.
   *
   * @param {HTMLElement | null} hoursList
   */
  function renderHoursList(hoursList) {
    if (!hoursList || !CONFIG.horarios) return;

    hoursList.innerHTML = CONFIG.horarios
      .map(
        (horario) => `
          <li>
            <strong>${horario.dia}</strong>
            <span>${horario.abertura} – ${horario.fechamento}</span>
          </li>
        `
      )
      .join("");

    createLucideIcons();
  }

  /**
   * Abre um modal do tipo dialog com animação.
   *
   * @param {HTMLDialogElement} modal
   */
  function openModal(modal) {
    modal.showModal();

    requestAnimationFrame(() => {
      modal.classList.add("is-open");
    });
  }

  /**
   * Fecha um modal do tipo dialog respeitando a transição CSS.
   *
   * @param {HTMLDialogElement} modal
   */
  function closeModal(modal) {
    modal.classList.remove("is-open");

    modal.addEventListener("transitionend", () => modal.close(), { once: true });
  }

  /**
   * Inicializa os ícones do Lucide quando a biblioteca estiver disponível.
   *
   * Essa função é útil depois de inserir HTML dinâmico na página.
   */
  function createLucideIcons() {
    if (typeof lucide === "undefined") return;

    lucide.createIcons();
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    initDrawer,
    initWhatsapp,
    initTabs,
    initModalHorarios,
    createLucideIcons,
  };
})();

// ── Módulo Cart ─────────────────────────────────────────────────────────────

/**
 * Cart
 * Gerencia o carrinho de compras de forma global e persistente.
 *
 * O carrinho é salvo no localStorage com um timestamp de expiração.
 * Ao ler, verifica se o tempo máximo foi ultrapassado.
 * Se estiver expirado, limpa automaticamente e retorna vazio.
 *
 * Estrutura armazenada:
 * {
 *   expiresAt: number,
 *   items: {
 *     [produtoId]: {
 *       nome,
 *       preco,
 *       qty,
 *       categoriaId,
 *       categoriaNome
 *     }
 *   }
 * }
 *
 * Uso nos scripts de página:
 * Cart.add({ id, nome, preco, categoriaId, categoriaNome })
 * Cart.remove(id)
 * Cart.get()
 * Cart.totalItens()
 * Cart.clear()
 * Cart.syncBadges()
 */
const Cart = (() => {
  const STORAGE_KEY = CONFIG.settings?.cartStorageKey || "osb_cart";

  /**
   * Tempo de vida do carrinho em milissegundos.
   *
   * Se CONFIG.settings.cartTTL não existir, usa o padrão de 4 horas.
   *
   * @returns {number}
   */
  function getTTL() {
    return CONFIG.settings?.cartTTL || DEFAULT_CART_TTL_MS;
  }

  /**
   * Lê o payload bruto do localStorage.
   *
   * @returns {{ expiresAt: number, items: Object } | null}
   */
  function readRawCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o carrinho salvo já expirou.
   *
   * @param {{ expiresAt: number, items: Object } | null} rawCart
   * @returns {boolean}
   */
  function isCartExpired(rawCart) {
    if (!rawCart?.expiresAt) return true;

    return Date.now() > rawCart.expiresAt;
  }

  /**
   * Cria o payload que será persistido no localStorage.
   *
   * A expiração é renovada a partir da última alteração no carrinho.
   *
   * @param {Object} items
   * @returns {{ expiresAt: number, items: Object }}
   */
  function createCartPayload(items) {
    return {
      expiresAt: Date.now() + getTTL(),
      items,
    };
  }

  /**
   * Retorna os itens do carrinho.
   *
   * Se o carrinho tiver expirado, limpa e retorna objeto vazio.
   *
   * @returns {Object}
   */
  function get() {
    const rawCart = readRawCart();

    if (!rawCart) return {};

    if (isCartExpired(rawCart)) {
      clear();
      return {};
    }

    return rawCart.items || {};
  }

  /**
   * Persiste os itens no localStorage, renovando o timestamp de expiração.
   *
   * @param {Object} items
   */
  function save(items) {
    const payload = createCartPayload(items);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    syncBadges();
  }

  /**
   * Cria um item de carrinho a partir dos dados do produto.
   *
   * @param {{ id: string, nome: string, preco: string, categoriaId: string, categoriaNome: string }} produto
   * @returns {{ nome: string, preco: string, qty: number, categoriaId: string, categoriaNome: string }}
   */
  function createCartItem(produto) {
    return {
      nome: produto.nome,
      preco: produto.preco,
      qty: 0,
      categoriaId: produto.categoriaId,
      categoriaNome: produto.categoriaNome,
    };
  }

  /**
   * Adiciona ou incrementa um produto no carrinho.
   *
   * @param {{ id: string, nome: string, preco: string, categoriaId: string, categoriaNome: string }} produto
   */
  function add(produto) {
    const items = get();

    if (!items[produto.id]) {
      items[produto.id] = createCartItem(produto);
    }

    items[produto.id].qty += 1;

    save(items);
  }

  /**
   * Decrementa ou remove um produto do carrinho.
   *
   * Se a quantidade chegar a zero, o item é removido completamente.
   *
   * @param {string} id - ID do produto
   */
  function remove(id) {
    const items = get();

    if (!items[id]) return;

    items[id].qty -= 1;

    if (items[id].qty <= 0) {
      delete items[id];
    }

    save(items);
  }

  /**
   * Zera completamente o carrinho.
   */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    syncBadges();
  }

  /**
   * Retorna o total de itens, somando todas as quantidades.
   *
   * @returns {number}
   */
  function totalItens() {
    return Object.values(get()).reduce((total, item) => total + item.qty, 0);
  }

  /**
   * Atualiza o número visível nos badges do carrinho.
   *
   * @param {number} total
   */
  function updateCartBadges(total) {
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = total;
    });
  }

  /**
   * Atualiza o aria-label dos botões/links do carrinho.
   *
   * Isso melhora a acessibilidade para leitores de tela.
   *
   * @param {number} total
   */
  function updateCartButtonsLabel(total) {
    const itemText = total === 1 ? "item" : "itens";

    document.querySelectorAll(".cart-btn").forEach((button) => {
      button.setAttribute("aria-label", `Ver carrinho (${total} ${itemText})`);
    });
  }

  /**
   * Atualiza a barra "Fechar Pedido".
   *
   * Essa barra aparece somente quando existe pelo menos um item no carrinho.
   *
   * @param {number} total
   */
  function updateOrderBar(total) {
    const orderBar = document.getElementById("order-bar");

    if (!orderBar) return;

    const countElement = orderBar.querySelector(".order-bar-count");

    if (total <= 0) {
      orderBar.classList.remove("is-visible");
      document.body.style.paddingBottom = "";
      return;
    }

    orderBar.classList.add("is-visible");
    document.body.style.paddingBottom = "var(--bottom-bar-height)";

    if (countElement) {
      countElement.textContent = total;
    }
  }

  /**
   * Sincroniza todos os elementos de UI relacionados ao carrinho na página atual:
   *
   * - `.cart-badge` → número de itens
   * - `.cart-btn` → aria-label acessível
   * - `#order-bar` → barra "Fechar Pedido"
   * - `.order-bar-count` → contagem na barra
   *
   * Chamado automaticamente após qualquer mutação e no DOMContentLoaded global.
   */
  function syncBadges() {
    const total = totalItens();

    updateCartBadges(total);
    updateCartButtonsLabel(total);
    updateOrderBar(total);
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    get,
    add,
    remove,
    clear,
    totalItens,
    syncBadges,
  };
})();

// ── Namespace Store ─────────────────────────────────────────────────────────

/**
 * Store
 * Centraliza regras de negócio gerais da loja.
 */
const Store = (() => {
  /**
   * Converte um horário no formato "HH:MM" para minutos.
   *
   * Exemplo:
   * "08:30" → 510
   *
   * @param {string} time
   * @returns {number}
   */
  function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  /**
   * Verifica se um horário atual está dentro do intervalo de funcionamento.
   *
   * Também trata horários que atravessam a meia-noite.
   *
   * Exemplo:
   * abertura: 18:00
   * fechamento: 02:00
   *
   * @param {number} currentMinutes
   * @param {number} openingMinutes
   * @param {number} closingMinutes
   * @returns {boolean}
   */
  function isWithinBusinessHours(currentMinutes, openingMinutes, closingMinutes) {
    const closesAfterMidnight = closingMinutes <= openingMinutes;

    if (!closesAfterMidnight) {
      return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
    }

    return currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
  }

  /**
   * Verifica se o estabelecimento está aberto.
   *
   * Usa o dia atual e os horários definidos em CONFIG.horarios.
   *
   * @returns {boolean}
   */
  function isOpen() {
    const now = new Date();
    const todaySchedule = CONFIG.horarios[now.getDay()];

    if (!todaySchedule) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openingMinutes = parseTimeToMinutes(todaySchedule.abertura);
    const closingMinutes = parseTimeToMinutes(todaySchedule.fechamento);

    return isWithinBusinessHours(currentMinutes, openingMinutes, closingMinutes);
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    isOpen,
  };
})();

// ── Init global ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  UI.initDrawer();
  UI.initWhatsapp();

  // Inicializa o sistema de tabs se houver elementos [role="tab"] na página.
  // Centralizado aqui para evitar repetição nos scripts de cada página.
  UI.initTabs();

  // Inicializa o modal de horários se os elementos necessários existirem.
  UI.initModalHorarios();

  // Sincroniza badges do carrinho em todas as páginas que tenham .cart-badge.
  // Garante que o número de itens seja sempre correto ao navegar entre páginas.
  Cart.syncBadges();

  // Inicialização única e centralizada do Lucide Icons.
  // Scripts de página só devem chamar isso depois de inserir ícones dinamicamente.
  UI.createLucideIcons();
});
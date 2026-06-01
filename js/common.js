/**
 * common.js
 * Centraliza comportamentos compartilhados entre todas as páginas.
 *
 * Responsabilidades:
 *  - Drawer de navegação mobile
 *  - Links de WhatsApp dinâmicos
 *  - Sistema de tabs acessível (WCAG 2.1)
 *  - Inicialização global do Lucide Icons
 *  - Módulo Cart: carrinho persistido com expiração automática
 *
 * Dependências: config.js (deve ser carregado antes).
 * Ordem de carregamento: após config.js e utils/, antes dos scripts de página.
 */

const UI = (() => {
  // ── Drawer ────────────────────────────────────────────────────────────────

  /**
   * Inicializa o drawer de navegação mobile com suporte a teclado e ARIA.
   */
  function initDrawer() {
    const drawer  = document.getElementById("drawer");
    const overlay = document.getElementById("drawer-overlay");
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-drawer-btn");

    if (!drawer || !menuBtn) return;

    const open = () => {
      drawer.classList.add("is-open");
      overlay?.classList.add("is-open");
      overlay?.removeAttribute("aria-hidden");
      document.body.style.overflow = "hidden";
      menuBtn.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      drawer.classList.remove("is-open");
      overlay?.classList.remove("is-open");
      overlay?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      menuBtn.setAttribute("aria-expanded", "false");
    };

    menuBtn.addEventListener("click", open);
    overlay?.addEventListener("click", close);
    closeBtn?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        close();
        menuBtn.focus();
      }
    });
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  /**
   * Preenche todos os links [data-whatsapp] com número e mensagem do CONFIG.
   */
  function initWhatsapp() {
    const { numero, whatsappMensagem } = CONFIG.contato;
    const waLinks = document.querySelectorAll("[data-whatsapp]");
    waLinks.forEach((link) => {
      link.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  /**
   * Inicializa o sistema de tabs acessível em qualquer container.
   * Segue o padrão ARIA Tabs com navegação por teclado (WCAG 2.1 SC 2.1.1).
   *
   * Markup esperado:
   *   [role="tab"]      → botões de aba
   *   [role="tabpanel"] → painéis de conteúdo
   *   aria-controls     → ID do painel que o botão controla
   *
   * @param {string} [scope="document"] - Seletor do container pai (opcional)
   */
  function initTabs(scope = document) {
    const container = typeof scope === "string"
      ? document.querySelector(scope)
      : scope;

    if (!container) return;

    const tabBtns   = container.querySelectorAll("[role='tab']");
    const tabPanels = container.querySelectorAll("[role='tabpanel']");

    if (!tabBtns.length) return;

    /**
     * Ativa uma aba e seu painel correspondente.
     * @param {HTMLElement} selectedBtn
     */
    function activateTab(selectedBtn) {
      tabBtns.forEach((btn) => {
        btn.setAttribute("aria-selected", "false");
        btn.setAttribute("tabindex", "-1");
      });
      tabPanels.forEach((panel) => {
        panel.classList.remove("is-active");
      });

      selectedBtn.setAttribute("aria-selected", "true");
      selectedBtn.setAttribute("tabindex", "0");

      const targetId    = selectedBtn.getAttribute("aria-controls");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("is-active");
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => activateTab(btn));

      // Navegação por setas — padrão WAI-ARIA Tabs
      btn.addEventListener("keydown", (e) => {
        const btnsArray    = [...tabBtns];
        const currentIndex = btnsArray.indexOf(btn);

        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next = (currentIndex + 1) % btnsArray.length;
          btnsArray[next].focus();
          activateTab(btnsArray[next]);
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = (currentIndex - 1 + btnsArray.length) % btnsArray.length;
          btnsArray[prev].focus();
          activateTab(btnsArray[prev]);
        }
      });
    });
  }

  // ── Modais Globais ────────────────────────────────────────────────────────

  /**
   * Inicializa o modal de horários em qualquer página que possua o HTML necessário.
   */
  function initModalHorarios() {
    const modal = document.getElementById('hours-modal');
    const btnOpen = document.getElementById('open-hours-btn') || document.querySelector('.hours-link');
    const btnOk = modal?.querySelector('.modal-ok');
    const lista = document.getElementById('hours-list');

    if (!modal || !btnOpen) return;

    if (lista && CONFIG.horarios) {
      lista.innerHTML = CONFIG.horarios.map(h => `
        <li>
          <span>${h.dia}</span>
          <span><i data-lucide="clock-3"></i> ${h.abertura} – ${h.fechamento}</span>
        </li>
      `).join('');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    btnOpen.addEventListener('click', () => {
      modal.showModal();
      requestAnimationFrame(() => modal.classList.add('is-open'));
    });

    btnOk?.addEventListener('click', () => {
      modal.classList.remove('is-open');
      modal.addEventListener('transitionend', () => modal.close(), { once: true });
    });
  }

  // ── API pública ───────────────────────────────────────────────────────────
  return { initDrawer, initWhatsapp, initTabs, initModalHorarios };
})();

// ── Módulo Cart ───────────────────────────────────────────────────────────────

/**
 * Cart
 * Gerencia o carrinho de compras de forma global e persistente.
 *
 * O carrinho é salvo no localStorage com um timestamp de criação.
 * Ao ler, verifica se o tempo máximo (CONFIG.cartTTL ou padrão de 4h) foi
 * ultrapassado — se sim, limpa automaticamente e retorna vazio.
 *
 * Estrutura armazenada:
 * {
 *   expiresAt: <timestamp ms>,
 *   items: {
 *     [produtoId]: { nome, preco, qty, categoriaId, categoriaNome }
 *   }
 * }
 *
 * Uso nos scripts de página:
 *   Cart.add({ id, nome, preco, categoriaId, categoriaNome })
 *   Cart.remove(id)
 *   Cart.get()           → { [id]: { ... } }
 *   Cart.totalItens()    → number
 *   Cart.clear()
 *   Cart.syncBadges()    → atualiza badges e barra de pedido na página atual
 */
const Cart = (() => {
  const STORAGE_KEY = "osb_cart";

  /**
   * Tempo de vida do carrinho em milissegundos.
   * Lido de CONFIG.cartTTL se disponível, senão usa 4 horas como padrão.
   * @returns {number}
   */
  function getTTL() {
    return (typeof CONFIG !== "undefined" && CONFIG.cartTTL)
      ? CONFIG.cartTTL
      : 4 * 60 * 60 * 1000; // 4 horas
  }

  /**
   * Lê o payload bruto do localStorage.
   * @returns {{ expiresAt: number, items: Object } | null}
   */
  function _readRaw() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  /**
   * Retorna os itens do carrinho.
   * Se o carrinho tiver expirado, limpa e retorna objeto vazio.
   * @returns {Object}
   */
  function get() {
    const raw = _readRaw();
    if (!raw) return {};

    // Verifica expiração
    if (Date.now() > raw.expiresAt) {
      clear();
      return {};
    }

    return raw.items || {};
  }

  /**
   * Persiste os itens no localStorage, renovando o timestamp de expiração.
   * A expiração é sempre contada a partir da ÚLTIMA alteração, não da criação —
   * assim uma sessão ativa nunca expira no meio.
   * @param {Object} items
   */
  function _save(items) {
    const payload = {
      expiresAt: Date.now() + getTTL(),
      items,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    syncBadges();
  }

  /**
   * Adiciona ou incrementa um produto no carrinho.
   * @param {{ id: string, nome: string, preco: string, categoriaId: string, categoriaNome: string }} produto
   */
  function add(produto) {
    const items = get();
    if (!items[produto.id]) {
      items[produto.id] = {
        nome: produto.nome,
        preco: produto.preco,
        qty: 0,
        categoriaId: produto.categoriaId,
        categoriaNome: produto.categoriaNome,
      };
    }
    items[produto.id].qty += 1;
    _save(items);
  }

  /**
   * Decrementa ou remove um produto do carrinho.
   * @param {string} id - ID do produto
   */
  function remove(id) {
    const items = get();
    if (!items[id]) return;
    items[id].qty -= 1;
    if (items[id].qty <= 0) delete items[id];
    _save(items);
  }

  /**
   * Zera completamente o carrinho.
   */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    syncBadges();
  }

  /**
   * Retorna o total de itens (soma de todas as quantidades).
   * @returns {number}
   */
  function totalItens() {
    return Object.values(get()).reduce((acc, item) => acc + item.qty, 0);
  }

  /**
   * Sincroniza todos os elementos de UI relacionados ao carrinho na página atual:
   *  - `.cart-badge`         → número de itens
   *  - `.cart-btn`           → aria-label acessível
   *  - `#order-bar`          → barra "Fechar Pedido" (visível só se items > 0)
   *  - `.order-bar-count`    → contagem na barra
   *
   * Chamado automaticamente após qualquer mutação e no DOMContentLoaded global,
   * garantindo que qualquer página que tenha esses elementos seja atualizada.
   */
  function syncBadges() {
    const total = totalItens();

    // Badge numérico no ícone do carrinho
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = total;
    });

    // aria-label acessível no botão/link do carrinho
    document.querySelectorAll(".cart-btn").forEach((btn) => {
      btn.setAttribute(
        "aria-label",
        `Ver carrinho (${total} ${total === 1 ? "item" : "itens"})`
      );
    });

    // Barra "Fechar Pedido" — exclusiva da página de cardápio
    const bar = document.getElementById("order-bar");
    if (bar) {
      const countEl = bar.querySelector(".order-bar-count");
      if (total > 0) {
        bar.classList.add("is-visible");
        if (countEl) countEl.textContent = total;
        document.body.style.paddingBottom = "var(--bottom-bar-height)";
      } else {
        bar.classList.remove("is-visible");
        document.body.style.paddingBottom = "";
      }
    }
  }

  // ── API pública ───────────────────────────────────────────────────────────
  return { get, add, remove, clear, totalItens, syncBadges };
})();

// ── Namespace Store ───────────────────────────────────────────────────────────

/**
 * Namespace para Regras de Negócio da Loja
 */
const Store = (() => {
  /**
   * Verifica se o estabelecimento está aberto.
   */
  function isOpen() {
    const agora = new Date();
    const hoje = CONFIG.horarios[agora.getDay()];
    if (!hoje) return false;

    const [hAbre, mAbre] = hoje.abertura.split(":").map(Number);
    const [hFecha, mFecha] = hoje.fechamento.split(":").map(Number);

    const agoraMin = agora.getHours() * 60 + agora.getMinutes();
    const abreMin = hAbre * 60 + mAbre;
    let fechaMin = hFecha * 60 + mFecha;

    if (fechaMin <= abreMin) fechaMin += 1440;
    return agoraMin >= abreMin && agoraMin <= fechaMin;
  }

  return { isOpen };
})();

// ── Init global ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  UI.initDrawer();
  UI.initWhatsapp();

  // Inicializa o sistema de tabs se houver elementos [role="tab"] na página.
  // Centralizado aqui para evitar repetição nos scripts de cada página.
  UI.initTabs();

  // Inicializa o modal de horários se os botões estiverem presentes.
  UI.initModalHorarios();

  // Sincroniza badges do carrinho em todas as páginas que tenham .cart-badge.
  // Garante que o número de itens seja sempre correto ao navegar entre páginas,
  // e também verifica e descarta carrinho expirado silenciosamente.
  Cart.syncBadges();

  // Inicialização única e centralizada do Lucide Icons.
  // Os scripts de página NÃO devem chamar lucide.createIcons() no topo —
  // apenas após inserções dinâmicas de ícones no DOM (ex: innerHTML).
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});
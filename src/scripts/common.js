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
 */

// ── Constantes Globais ──────────────────────────────────────────────────────

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_CART_TTL_MS = 4 * 60 * 60 * 1000;

// ── UI ──────────────────────────────────────────────────────────────────────

const UI = (() => {
  // ── Drawer ────────────────────────────────────────────────────────────────

  function initDrawer() {
    const drawer   = document.getElementById("drawer");
    const overlay  = document.getElementById("drawer-overlay");
    const menuBtn  = document.getElementById("menu-btn");
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
      if (event.key !== "Escape" || !drawer.classList.contains("is-open")) return;
      closeDrawer();
      menuBtn.focus();
    }

    menuBtn.addEventListener("click", openDrawer);
    overlay?.addEventListener("click", closeDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", closeDrawerWithKeyboard);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  function initWhatsapp() {
    const { numero, whatsappMensagem } = CONFIG.contato;
    document.querySelectorAll("[data-whatsapp]").forEach((link) => {
      link.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  function initTabs(scope = document) {
    const container = typeof scope === "string" ? document.querySelector(scope) : scope;
    if (!container) return;

    const tabButtons = container.querySelectorAll("[role='tab']");
    const tabPanels  = container.querySelectorAll("[role='tabpanel']");

    if (!tabButtons.length) return;

    function resetTabs() {
      tabButtons.forEach((button) => {
        button.setAttribute("aria-selected", "false");
        button.setAttribute("tabindex", "-1");
      });
      tabPanels.forEach((panel) => panel.classList.remove("is-active"));
    }

    function activateTab(selectedButton) {
      resetTabs();
      selectedButton.setAttribute("aria-selected", "true");
      selectedButton.setAttribute("tabindex", "0");
      const targetPanel = document.getElementById(selectedButton.getAttribute("aria-controls"));
      targetPanel?.classList.add("is-active");
    }

    function moveTabFocus(currentButton, direction) {
      const buttons   = [...tabButtons];
      const nextIndex = (buttons.indexOf(currentButton) + direction + buttons.length) % buttons.length;
      const nextButton = buttons[nextIndex];
      nextButton.focus();
      activateTab(nextButton);
    }

    function handleTabKeyboard(event, currentButton) {
      if (event.key === "ArrowRight") { event.preventDefault(); moveTabFocus(currentButton, 1);  }
      if (event.key === "ArrowLeft")  { event.preventDefault(); moveTabFocus(currentButton, -1); }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button));
      button.addEventListener("keydown", (event) => handleTabKeyboard(event, button));
    });
  }

  // ── Modais Globais ────────────────────────────────────────────────────────

  function initModalHorarios() {
    const modal      = document.getElementById("hours-modal");
    const openButton = document.getElementById("open-hours-btn") || document.querySelector(".hours-link");

    if (!modal || !openButton) return;

    const okButton  = modal.querySelector(".modal-ok");
    const hoursList = document.getElementById("hours-list");

    renderHoursList(hoursList);
    openButton.addEventListener("click", () => openModal(modal));
    okButton?.addEventListener("click", () => closeModal(modal));
  }

  function renderHoursList(hoursList) {
    if (!hoursList || !CONFIG.horarios) return;

    hoursList.innerHTML = CONFIG.horarios
      .map((horario) => `
        <li>
          <strong>${horario.dia}</strong>
          <span>${horario.abertura} – ${horario.fechamento}</span>
        </li>`)
      .join("");

    createLucideIcons();
  }

  function openModal(modal) {
    modal.showModal();
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.addEventListener("transitionend", () => modal.close(), { once: true });
  }

  function createLucideIcons() {
    if (typeof lucide === "undefined") return;
    lucide.createIcons();
  }

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
 * Estrutura armazenada:
 * {
 *   expiresAt: number,
 *   items: {
 *     [produtoId]: {
 *       nome, preco, qty, categoriaId, categoriaNome,
 *       descPersonalizacao  ← opcional, salvo quando presente
 *     }
 *   }
 * }
 */
const Cart = (() => {
  const STORAGE_KEY = CONFIG.settings?.cartStorageKey || "osb_cart";

  function getTTL() {
    return CONFIG.settings?.cartTTL || DEFAULT_CART_TTL_MS;
  }

  function readRawCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function isCartExpired(rawCart) {
    if (!rawCart?.expiresAt) return true;
    return Date.now() > rawCart.expiresAt;
  }

  function createCartPayload(items) {
    return {
      expiresAt: Date.now() + getTTL(),
      items,
    };
  }

  function get() {
    const rawCart = readRawCart();
    if (!rawCart) return {};
    if (isCartExpired(rawCart)) { clear(); return {}; }
    return rawCart.items || {};
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createCartPayload(items)));
    syncBadges();
  }

  /**
   * Cria um item de carrinho a partir dos dados do produto.
   * Inclui descPersonalizacao quando fornecida.
   *
   * @param {{ id, nome, preco, categoriaId, categoriaNome, descPersonalizacao? }} produto
   */
  function createCartItem(produto) {
    const item = {
      nome:          produto.nome,
      preco:         produto.preco,
      qty:           0,
      categoriaId:   produto.categoriaId,
      categoriaNome: produto.categoriaNome,
    };

    // Persiste a descrição de personalização apenas quando presente
    if (produto.descPersonalizacao) {
      item.descPersonalizacao = produto.descPersonalizacao;
    }

    return item;
  }

  /**
   * Adiciona ou incrementa um produto no carrinho.
   * Se o produto já existir e o novo add trouxer descPersonalizacao,
   * atualiza a descrição para refletir a personalização mais recente.
   */
  function add(produto) {
    const items = get();

    if (!items[produto.id]) {
      items[produto.id] = createCartItem(produto);
    }

    // Atualiza descPersonalizacao se uma nova foi fornecida
    if (produto.descPersonalizacao !== undefined) {
      items[produto.id].descPersonalizacao = produto.descPersonalizacao || undefined;
    }

    items[produto.id].qty += 1;

    save(items);
  }

  function remove(id) {
    const items = get();
    if (!items[id]) return;

    items[id].qty -= 1;

    if (items[id].qty <= 0) delete items[id];

    save(items);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    syncBadges();
  }

  function totalItens() {
    return Object.values(get()).reduce((total, item) => total + item.qty, 0);
  }

  function updateCartBadges(total) {
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = total;
    });
  }

  function updateCartButtonsLabel(total) {
    const itemText = total === 1 ? "item" : "itens";
    document.querySelectorAll(".cart-btn").forEach((button) => {
      button.setAttribute("aria-label", `Ver carrinho (${total} ${itemText})`);
    });
  }

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

    if (countElement) countElement.textContent = total;
  }

  function syncBadges() {
    const total = totalItens();
    updateCartBadges(total);
    updateCartButtonsLabel(total);
    updateOrderBar(total);
  }

  return { get, add, remove, clear, totalItens, syncBadges };
})();

// ── Namespace Store ─────────────────────────────────────────────────────────

const Store = (() => {
  function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function isWithinBusinessHours(currentMinutes, openingMinutes, closingMinutes) {
    const closesAfterMidnight = closingMinutes <= openingMinutes;
    if (!closesAfterMidnight) {
      return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
    }
    return currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
  }

  function isOpen() {
    const now            = new Date();
    const todaySchedule  = CONFIG.horarios[now.getDay()];
    if (!todaySchedule) return false;

    const currentMinutes  = now.getHours() * 60 + now.getMinutes();
    const openingMinutes  = parseTimeToMinutes(todaySchedule.abertura);
    const closingMinutes  = parseTimeToMinutes(todaySchedule.fechamento);

    return isWithinBusinessHours(currentMinutes, openingMinutes, closingMinutes);
  }

  return { isOpen };
})();

// ── Init global ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  UI.initDrawer();
  UI.initWhatsapp();
  UI.initTabs();
  UI.initModalHorarios();
  Cart.syncBadges();
  UI.createLucideIcons();
});
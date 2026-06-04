/**
 * pages/meu-carrinho.js
 * Lógica da página Meu Carrinho.
 *
 * Responsabilidades:
 *  - Renderizar itens do carrinho (nome, categoria, preço unitário, qty, subtotal)
 *  - Controles de quantidade (+/-) com atualização reativa
 *  - Exibir resumo do pedido (subtotal de itens + total geral)
 *  - Alternar entre estado vazio e estado com itens
 *  - Botão "Personalizar meu pedido" por item
 *  - Status da loja e tempos estimados
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → pages/meu-carrinho.js
 */

// ── Utilitários ──────────────────────────────────────────────────────────────

/**
 * Extrai o valor numérico de uma string de preço.
 *
 * Exemplos:
 *   "R$ 26,90"            → 26.90
 *   "a partir de R$ 10,00" → 10.00
 *
 * Se não encontrar nenhum número, retorna 0.
 *
 * @param {string} precoStr
 * @returns {number}
 */
function parsePreco(precoStr) {
  const match = precoStr.match(/[\d]+[,.][\d]{2}/);
  if (!match) return 0;
  return parseFloat(match[0].replace(",", "."));
}

/**
 * Formata um número como moeda brasileira.
 *
 * @param {number} valor
 * @returns {string}  ex: "R$ 26,90"
 */
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Infere um emoji de placeholder baseado no nome e categoria do item.
 * Mesma lógica do cardapio.js para manter consistência visual.
 *
 * @param {string} nome
 * @param {string} categoriaId
 * @returns {string}
 */
function inferirEmoji(nome, categoriaId) {
  const s = (nome + " " + categoriaId).toLowerCase();
  if (s.includes("batata"))                                          return "🍟";
  if (s.includes("picol"))                                           return "🍦";
  if (s.includes("sorvete"))                                         return "🍨";
  if (s.includes("açaí") || s.includes("acai") || s.includes("gelado")) return "🫐";
  if (s.includes("coca") || s.includes("guarana") || s.includes("refrigerante") || s.includes("mineirinho") || s.includes("guaravita")) return "🥤";
  if (s.includes("água") || s.includes("agua") || s.includes("tônica") || s.includes("tonica")) return "💧";
  if (s.includes("suco") || s.includes("del valle") || s.includes("maracujá") || s.includes("pêssego")) return "🧃";
  if (s.includes("magnum") || s.includes("kibon") || s.includes("chicabon") || s.includes("eskibon") || s.includes("tablito") || s.includes("cornetto")) return "🍫";
  if (s.includes("bala") || s.includes("jujuba") || s.includes("pé de moleque") || s.includes("doce")) return "🍬";
  return "🍔";
}

// ── Renderização ─────────────────────────────────────────────────────────────

/**
 * Gera o HTML de um item do carrinho.
 *
 * @param {string} id         - ID do produto
 * @param {Object} item       - { nome, preco, qty, categoriaId, categoriaNome }
 * @returns {string}
 */
function htmlCartItem(id, item) {
  const { nome, preco, qty, categoriaId, categoriaNome } = item;

  const precoNum  = parsePreco(preco);
  const subtotal  = formatarPreco(precoNum * qty);
  const emoji     = inferirEmoji(nome, categoriaId || "");

  // Exibe "a partir de R$..." se o preço contiver "partir"
  const precoLabel = preco.toLowerCase().includes("partir")
    ? preco
    : `Unid.: ${formatarPreco(precoNum)}`;

  return `
    <li class="cart-item" data-product-id="${id}">
      <div class="cart-item-header">
        <div class="cart-item-thumb" aria-hidden="true">${emoji}</div>

        <div class="cart-item-info">
          <span class="cart-item-category">${categoriaNome || ""}</span>
          <span class="cart-item-name">${nome}</span>
          <span class="cart-item-unit-price">${precoLabel}</span>
        </div>

        <div class="qty-pill" role="group" aria-label="Quantidade de ${nome}">
          <button
            class="qty-btn btn-minus"
            data-action="minus"
            data-product-id="${id}"
            aria-label="Remover um ${nome}"
          >
            <i data-lucide="minus"></i>
          </button>
          <span class="qty-value" aria-live="polite" aria-atomic="true">${qty}</span>
          <button
            class="qty-btn btn-plus"
            data-action="plus"
            data-product-id="${id}"
            aria-label="Adicionar um ${nome}"
          >
            <i data-lucide="plus"></i>
          </button>
        </div>
      </div>

      <div class="cart-item-footer">
        <span class="cart-item-subtotal" aria-label="Subtotal: ${subtotal}">${subtotal}</span>
        <button
          class="btn-customize"
          data-product-id="${id}"
          aria-label="Personalizar pedido de ${nome}"
        >
          <i data-lucide="pencil"></i>
          Personalizar meu pedido
        </button>
      </div>
    </li>`;
}

/**
 * Gera o HTML do resumo (total de itens e valor total).
 *
 * @param {Object} cartItems
 * @returns {{ html: string, total: number }}
 */
function calcularResumo(cartItems) {
  let totalItens = 0;
  let totalValor = 0;

  Object.values(cartItems).forEach(({ preco, qty }) => {
    totalItens += qty;
    totalValor += parsePreco(preco) * qty;
  });

  return { totalItens, totalValor };
}

// ── Controle de estados ───────────────────────────────────────────────────────

/**
 * Mostra o estado vazio e esconde o estado com itens.
 */
function showEmptyState() {
  const emptyState  = document.querySelector(".empty-cart-state");
  const itemsState  = document.getElementById("cart-items-state");
  const cartActions = document.querySelector(".cart-actions");

  if (emptyState)  emptyState.style.display  = "";
  if (itemsState)  itemsState.classList.remove("is-visible");
  const summaryEl2 = document.getElementById("cart-summary");
  const finalizeEl2 = document.getElementById("btn-finalize");
  if (summaryEl2)  summaryEl2.style.display = "none";
  if (finalizeEl2) finalizeEl2.style.display = "none";
  if (cartActions) cartActions.style.display  = "";
}

/**
 * Esconde o estado vazio e mostra o estado com itens.
 */
function showItemsState() {
  const emptyState  = document.querySelector(".empty-cart-state");
  const itemsState  = document.getElementById("cart-items-state");
  const cartActions = document.querySelector(".cart-actions");

  if (emptyState)  emptyState.style.display  = "none";
  if (itemsState)  itemsState.classList.add("is-visible");
  const summaryEl3 = document.getElementById("cart-summary");
  const finalizeEl3 = document.getElementById("btn-finalize");
  if (summaryEl3)  summaryEl3.style.display = "";
  if (finalizeEl3) finalizeEl3.style.display = "";
  // Botão "Continuar comprando" permanece visível nos dois estados
}

// ── Renderização principal ────────────────────────────────────────────────────

/**
 * Renderiza todos os itens do carrinho e o resumo do pedido.
 * Chamada na inicialização e após cada mutação do carrinho.
 */
function renderCart() {
  const cartItems = Cart.get();
  const ids       = Object.keys(cartItems);

  if (ids.length === 0) {
    showEmptyState();
    return;
  }

  showItemsState();

  // Lista de itens
  const list = document.getElementById("cart-items-list");
  if (list) {
    list.innerHTML = ids
      .map((id) => htmlCartItem(id, cartItems[id]))
      .join("");
  }

  // Resumo
  renderSummary(cartItems);

  // Re-inicializa ícones Lucide nos elementos recém-injetados
  if (typeof lucide !== "undefined") lucide.createIcons();
}

/**
 * Atualiza apenas o subtotal de um item e o resumo global.
 * Evita re-renderizar a lista toda a cada clique de +/-.
 *
 * @param {string} produtoId
 */
function updateItemUI(produtoId) {
  const cartItems = Cart.get();
  const item      = cartItems[produtoId];
  const itemEl    = document.querySelector(`.cart-item[data-product-id="${produtoId}"]`);

  // Item removido (qty = 0): remove o elemento ou re-renderiza tudo
  if (!item || item.qty <= 0) {
    if (itemEl) {
      itemEl.style.animation = "none";
      itemEl.remove();
    }

    // Se a lista ficou vazia, mostra o estado vazio
    if (Object.keys(Cart.get()).length === 0) {
      showEmptyState();
      return;
    }

    renderSummary(Cart.get());
    return;
  }

  // Atualiza qty visível no item
  const qtyEl = itemEl?.querySelector(".qty-value");
  if (qtyEl) qtyEl.textContent = item.qty;

  // Atualiza subtotal do item
  const subtotalEl = itemEl?.querySelector(".cart-item-subtotal");
  if (subtotalEl) {
    const precoNum = parsePreco(item.preco);
    subtotalEl.textContent = formatarPreco(precoNum * item.qty);
  }

  // Atualiza o resumo global
  renderSummary(Cart.get());
}

/**
 * Renderiza (ou atualiza) o bloco de resumo do pedido.
 *
 * @param {Object} cartItems
 */
function renderSummary(cartItems) {
  const summaryEl = document.getElementById("cart-summary");
  if (!summaryEl) return;

  const { totalItens, totalValor } = calcularResumo(cartItems);
  const itemLabel = totalItens === 1 ? "item" : "itens";

  summaryEl.querySelector(".summary-items-count").textContent =
    `${totalItens} ${itemLabel}`;

  summaryEl.querySelector(".summary-items-value").textContent =
    formatarPreco(totalValor);

  summaryEl.querySelector(".summary-total-value").textContent =
    formatarPreco(totalValor);
}

// ── Eventos ───────────────────────────────────────────────────────────────────

/**
 * Delegação de eventos para os botões +/- do carrinho.
 */
function initEventosQtd() {
  const itemsState = document.getElementById("cart-items-state");
  if (!itemsState) return;

  itemsState.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;

    const produtoId = btn.dataset.productId;
    const acao      = btn.dataset.action;

    if (acao === "plus") {
      // Para aumentar qty no carrinho precisamos dos dados do item já salvo
      const item = Cart.get()[produtoId];
      if (!item) return;

      Cart.add({
        id:           produtoId,
        nome:         item.nome,
        preco:        item.preco,
        categoriaId:  item.categoriaId,
        categoriaNome: item.categoriaNome,
      });
    }

    if (acao === "minus") {
      Cart.remove(produtoId);
    }

    updateItemUI(produtoId);
  });
}

/**
 * Botão "Personalizar meu pedido".
 * Por ora exibe um toast informando que a funcionalidade está em breve,
 * pois o fluxo de personalização será implementado futuramente.
 */
function initEventosPersonalizar() {
  const itemsState = document.getElementById("cart-items-state");
  if (!itemsState) return;

  itemsState.addEventListener("click", (event) => {
    const btn = event.target.closest(".btn-customize");
    if (!btn) return;

    const produtoId = btn.dataset.productId;
    const item      = Cart.get()[produtoId];
    if (!item) return;

    // TODO: Abrir modal de personalização quando implementado
    alert(`Personalização de "${item.nome}" em breve! 🍔`);
  });
}

// ── Status da loja ────────────────────────────────────────────────────────────

function initStatusLoja() {
  const isAberto  = Store.isOpen();
  const badge     = document.getElementById("status-badge");
  const text      = document.getElementById("status-text");
  const hoje      = CONFIG.horarios[new Date().getDay()];
  const elHorario = document.querySelector("[data-horario-hoje]");

  if (badge && text) {
    if (isAberto) {
      badge.classList.remove("closed");
      badge.classList.add("open");
      text.textContent = "Delivery Online - ABERTO";
    } else {
      badge.classList.add("closed");
      badge.classList.remove("open");
      text.textContent = "Delivery Online - FECHADO";
    }
  }

  if (elHorario && hoje) {
    elHorario.textContent = `Atendimento hoje das ${hoje.abertura} às ${hoje.fechamento} horas.`;
  }
}

function initTemposEstimados() {
  const elEntrega  = document.querySelector("[data-tempo-entrega]");
  const elRetirada = document.querySelector("[data-tempo-retirada]");

  if (elEntrega)  elEntrega.textContent  = `${CONFIG.tempos.entrega} - Tempo estimado para entrega`;
  if (elRetirada) elRetirada.textContent = `${CONFIG.tempos.retirada} - Tempo estimado para retirada`;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  initEventosQtd();
  initEventosPersonalizar();
  initStatusLoja();
  initTemposEstimados();
});
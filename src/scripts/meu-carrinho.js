/**
 * pages/meu-carrinho.js
 * Lógica da página Meu Carrinho.
 *
 * Responsabilidades:
 *  - Renderizar itens do carrinho (nome, categoria, preço unitário, qty, subtotal)
 *  - Controles de quantidade (+/-) com atualização reativa
 *  - Exibir resumo do pedido (subtotal de itens + total geral)
 *  - Alternar entre estado vazio e estado com itens
 *  - Botão "Personalizar meu pedido": redireciona para personalizar.html?id=
 *    apenas para produtos que possuem personalizavel: true no CARDAPIO
 *  - Status da loja e tempos estimados
 *  - Bloqueia finalização do pedido quando a loja estiver fechada
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → pages/cardapio.js → pages/meu-carrinho.js
 *
 * Nota: cardapio.js é carregado antes para dar acesso ao CARDAPIO e ao
 * PRODUTO_MAP, necessários para verificar se um produto é personalizável.
 */

// ── Utilitários ──────────────────────────────────────────────────────────────

function parsePreco(precoStr) {
  const match = String(precoStr).match(/[\d]+[,.][\d]{2}/);
  return match ? parseFloat(match[0].replace(",", ".")) : 0;
}

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getAppliedCoupon() {
  const storageKey = CONFIG.settings?.appliedCouponStorageKey || "osb_applied_coupon";

  try {
    return JSON.parse(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function getCouponLabel(coupon) {
  if (!coupon) return "";

  if (coupon.discountType === "percent") {
    return `${coupon.code} (${Number(coupon.discountValue)}% OFF)`;
  }

  return `${coupon.code} (${formatarPreco(Number(coupon.discountValue))} OFF)`;
}

function calcularDesconto(totalValor, coupon) {
  if (!coupon || totalValor <= 0) return 0;

  const discountValue = Number(coupon.discountValue) || 0;
  const maxDiscountValue = Number(coupon.maxDiscountValue) || 0;

  if (coupon.discountType === "fixed") {
    return Math.min(discountValue, totalValor);
  }

  const percentual = Math.min(discountValue, 100);
  const desconto = totalValor * (percentual / 100);

  if (maxDiscountValue > 0) {
    return Math.min(desconto, maxDiscountValue, totalValor);
  }

  return Math.min(desconto, totalValor);
}

function inferirEmoji(nome, categoriaId) {
  const s = (nome + " " + categoriaId).toLowerCase();
  if (s.includes("batata"))                                                    return "🍟";
  if (s.includes("picol"))                                                     return "🍦";
  if (s.includes("sorvete"))                                                   return "🍨";
  if (s.includes("açaí") || s.includes("acai") || s.includes("gelado"))       return "🫐";
  if (s.includes("coca") || s.includes("guarana") || s.includes("refrigerante") || s.includes("mineirinho") || s.includes("guaravita")) return "🥤";
  if (s.includes("água") || s.includes("agua") || s.includes("tônica") || s.includes("tonica")) return "💧";
  if (s.includes("suco") || s.includes("del valle") || s.includes("maracujá") || s.includes("pêssego")) return "🧃";
  if (s.includes("magnum") || s.includes("kibon") || s.includes("chicabon") || s.includes("eskibon") || s.includes("tablito") || s.includes("cornetto")) return "🍫";
  if (s.includes("bala") || s.includes("jujuba") || s.includes("pé de moleque") || s.includes("doce")) return "🍬";
  return "🍔";
}

/**
 * Verifica se um produto é personalizável consultando o CARDAPIO.
 * Retorna false com segurança se o CARDAPIO não estiver disponível.
 *
 * @param {string} produtoId
 * @returns {boolean}
 */
function isProdutoPersonalizavel(produtoId) {
  if (typeof PRODUTO_MAP === "undefined") return false;
  return PRODUTO_MAP.get(produtoId)?.produto?.personalizavel === true;
}

// ── Renderização ─────────────────────────────────────────────────────────────

function htmlCartItem(id, item) {
  const { nome, preco, qty, categoriaId, categoriaNome, descPersonalizacao } = item;

  const precoNum = parsePreco(preco);
  const subtotal = formatarPreco(precoNum * qty);
  const emoji    = inferirEmoji(nome, categoriaId || "");

  const precoLabel = preco.toLowerCase().includes("partir")
    ? preco
    : `Unid.: ${formatarPreco(precoNum)}`;

  // Exibe os detalhes da personalização quando o item foi personalizado
  const descHtml = descPersonalizacao
    ? `<p class="cart-item-personalizacao">${descPersonalizacao}</p>`
    : "";

  // Botão "Personalizar meu pedido" só aparece para produtos personalizáveis
  const btnPersonalizar = isProdutoPersonalizavel(id)
    ? `<a
         href="personalizar.html?id=${id}"
         class="btn-customize"
         aria-label="Personalizar pedido de ${nome}"
       >
         <i data-lucide="pencil"></i>
         Personalizar meu pedido
       </a>`
    : "";

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
      ${descHtml}
      <div class="cart-item-footer">
        <span class="cart-item-subtotal" aria-label="Subtotal: ${subtotal}">${subtotal}</span>
        ${btnPersonalizar}
      </div>
    </li>`;
}

// ── Controle de estados ───────────────────────────────────────────────────────

function showEmptyState() {
  const emptyState  = document.querySelector(".empty-cart-state");
  const itemsState  = document.getElementById("cart-items-state");
  const summaryEl   = document.getElementById("cart-summary");
  const finalizeEl  = document.getElementById("btn-finalize");

  if (emptyState)  emptyState.style.display  = "";
  if (itemsState)  itemsState.classList.remove("is-visible");
  if (summaryEl)   summaryEl.style.display   = "none";
  if (finalizeEl)  finalizeEl.style.display  = "none";
}

function showItemsState() {
  const emptyState  = document.querySelector(".empty-cart-state");
  const itemsState  = document.getElementById("cart-items-state");
  const summaryEl   = document.getElementById("cart-summary");
  const finalizeEl  = document.getElementById("btn-finalize");

  if (emptyState)  emptyState.style.display  = "none";
  if (itemsState)  itemsState.classList.add("is-visible");
  if (summaryEl)   summaryEl.style.display   = "";
  if (finalizeEl)  finalizeEl.style.display  = "";
}

// ── Renderização principal ────────────────────────────────────────────────────

function renderCart() {
  const cartItems = Cart.get();
  const ids       = Object.keys(cartItems);

  if (ids.length === 0) {
    showEmptyState();
    return;
  }

  showItemsState();

  const list = document.getElementById("cart-items-list");
  if (list) {
    list.innerHTML = ids
      .map((id) => htmlCartItem(id, cartItems[id]))
      .join("");
  }

  renderSummary(cartItems);

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function updateItemUI(produtoId) {
  const cartItems = Cart.get();
  const item      = cartItems[produtoId];
  const itemEl    = document.querySelector(`.cart-item[data-product-id="${produtoId}"]`);

  if (!item || item.qty <= 0) {
    if (itemEl) itemEl.remove();

    if (Object.keys(Cart.get()).length === 0) {
      showEmptyState();
      return;
    }

    renderSummary(Cart.get());
    return;
  }

  const qtyEl = itemEl?.querySelector(".qty-value");
  if (qtyEl) qtyEl.textContent = item.qty;

  const subtotalEl = itemEl?.querySelector(".cart-item-subtotal");
  if (subtotalEl) {
    subtotalEl.textContent = formatarPreco(parsePreco(item.preco) * item.qty);
  }

  renderSummary(Cart.get());
}

function renderSummary(cartItems) {
  const summaryEl = document.getElementById("cart-summary");
  if (!summaryEl) return;

  let totalItens = 0;
  let totalValor = 0;

  Object.values(cartItems).forEach(({ preco, qty }) => {
    totalItens += qty;
    totalValor += parsePreco(preco) * qty;
  });

  const itemLabel = totalItens === 1 ? "item" : "itens";
  const appliedCoupon = getAppliedCoupon();
  const discountAmount = calcularDesconto(totalValor, appliedCoupon);
  const totalComDesconto = Math.max(totalValor - discountAmount, 0);
  const couponRow = summaryEl.querySelector(".cart-summary-coupon");

  summaryEl.querySelector(".summary-items-count").textContent  = `${totalItens} ${itemLabel}`;
  summaryEl.querySelector(".summary-items-value").textContent  = formatarPreco(totalValor);
  summaryEl.querySelector(".summary-total-value").textContent  = formatarPreco(totalComDesconto);

  if (couponRow) {
    couponRow.hidden = discountAmount <= 0;
    couponRow.querySelector(".summary-coupon-label").textContent = `Cupom ${getCouponLabel(appliedCoupon)}:`;
    couponRow.querySelector(".summary-coupon-value").textContent = `- ${formatarPreco(discountAmount)}`;
  }
}

function renderEmptyCouponNotice() {
  const notice = document.getElementById("cart-coupon-empty");
  if (!notice) return;

  const appliedCoupon = getAppliedCoupon();

  if (!appliedCoupon) {
    notice.hidden = true;
    notice.textContent = "";
    return;
  }

  notice.hidden = false;
  notice.textContent = `Cupom ${getCouponLabel(appliedCoupon)} aplicado. Adicione itens para ver o total com desconto.`;
}

// ── Eventos ───────────────────────────────────────────────────────────────────

function initEventosQtd() {
  const itemsState = document.getElementById("cart-items-state");
  if (!itemsState) return;

  itemsState.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;

    const produtoId = btn.dataset.productId;
    const acao      = btn.dataset.action;
    const item      = Cart.get()[produtoId];

    if (!item) return;

    if (acao === "plus") {
      Cart.add({
        id:            produtoId,
        nome:          item.nome,
        preco:         item.preco,
        categoriaId:   item.categoriaId,
        categoriaNome: item.categoriaNome,
      });
    }

    if (acao === "minus") Cart.remove(produtoId);

    updateItemUI(produtoId);
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

// ── Finalizar Pedido ─────────────────────────────────────────────────────────

/**
 * Controla o clique no botão "Finalizar Pedido".
 *
 * Fluxo:
 * - Loja aberta  → navega para login.html (href nativo do <a>)
 * - Loja fechada → bloqueia a navegação e exibe o closed-modal
 *
 * O closed-modal exibe o horário de hoje via CONFIG.horarios e um
 * botão que abre o hours-modal existente sem duplicar a lista de horários.
 */
function initFinalizarPedido() {
  const btnFinalize    = document.getElementById("btn-finalize");
  const closedModal    = document.getElementById("closed-modal");
  const closedSchedule = document.getElementById("closed-modal-schedule");
  const closedOkBtn    = document.getElementById("closed-modal-ok");
  const closedHoursBtn = document.getElementById("closed-modal-hours-btn");
  const hoursModal     = document.getElementById("hours-modal");

  if (!btnFinalize || !closedModal) return;

  // Preenche o horário de hoje no modal uma única vez ao inicializar
  const hoje = CONFIG.horarios[new Date().getDay()];
  if (closedSchedule && hoje) {
    closedSchedule.textContent =
      `Atendimento hoje das ${hoje.abertura} às ${hoje.fechamento} horas.`;
  }

  // Intercepta o clique antes de o <a> navegar pelo href
  btnFinalize.addEventListener("click", (event) => {
    if (Store.isOpen()) return; // loja aberta: deixa o href agir normalmente

    event.preventDefault();
    abrirClosedModal();
  });

  // Botão OK fecha o modal
  closedOkBtn?.addEventListener("click", fecharClosedModal);

  // Clique no backdrop fecha o modal
  closedModal.addEventListener("click", (event) => {
    if (event.target === closedModal) fecharClosedModal();
  });

  // Tecla Escape — previne o fechamento nativo do <dialog> para que
  // a animação de saída rode antes de .close() ser chamado
  closedModal.addEventListener("cancel", (event) => {
    event.preventDefault();
    fecharClosedModal();
  });

  // "Confira os horários" — fecha closed-modal e abre hours-modal
  closedHoursBtn?.addEventListener("click", () => {
    fecharClosedModal();

    // Aguarda a transição de saída do closed-modal para abrir o hours-modal
    closedModal.addEventListener(
      "transitionend",
      () => {
        if (!hoursModal) return;
        hoursModal.showModal();
        requestAnimationFrame(() => hoursModal.classList.add("is-open"));
      },
      { once: true }
    );
  });

  function abrirClosedModal() {
    closedModal.showModal();
    requestAnimationFrame(() => closedModal.classList.add("is-open"));
  }

  function fecharClosedModal() {
    closedModal.classList.remove("is-open");
    closedModal.addEventListener(
      "transitionend",
      () => closedModal.close(),
      { once: true }
    );
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderEmptyCouponNotice();
  renderCart();
  initEventosQtd();
  initStatusLoja();
  initTemposEstimados();
  initFinalizarPedido();
});

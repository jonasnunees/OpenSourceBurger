/**
 * pages/promocoes.js
 * Lógica exclusiva da página de Promoções.
 *
 * Responsabilidades:
 * - Adicionar promoções ao carrinho via Cart.add()
 * - Exibir toast de confirmação após adicionar
 * - Aplicar efeito de revelação nos cards conforme entram na tela
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const PROMO_LINK_SELECTOR = ".promo-card__link";
const PROMO_CARD_SELECTOR = ".promo-card";
const TOAST_ID            = "toast";

// ── Configurações ───────────────────────────────────────────────────────────

const TOAST_DURATION_MS  = 3000;
const REVEAL_THRESHOLD   = 0.15;
const REVEAL_ROOT_MARGIN = "0px 0px -50px 0px";

// ── Toast ───────────────────────────────────────────────────────────────────

/**
 * Exibe uma mensagem temporária no toast.
 *
 * @param {HTMLElement} toast
 * @param {string} message
 */
function showToast(toast, message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  toast.removeAttribute("aria-hidden");

  setTimeout(() => hideToast(toast), TOAST_DURATION_MS);
}

/**
 * Oculta o toast e atualiza o estado para leitores de tela.
 *
 * @param {HTMLElement} toast
 */
function hideToast(toast) {
  toast.classList.remove("is-visible");
  toast.setAttribute("aria-hidden", "true");
}

// ── Promoções ────────────────────────────────────────────────────────────────

/**
 * Lê os data-attributes do link e monta o objeto de produto
 * no formato esperado por Cart.add().
 *
 * @param {HTMLAnchorElement} link
 * @returns {{ id, nome, preco, categoriaId, categoriaNome } | null}
 */
function extrairDadosPromo(link) {
  const id    = link.dataset.promoId;
  const nome  = link.dataset.promoName;
  const preco = link.dataset.promoPreco;

  // Dados mínimos obrigatórios para o carrinho funcionar
  if (!id || !nome || !preco) {
    console.warn("[promocoes.js] Card sem dados suficientes para adicionar ao carrinho:", link);
    return null;
  }

  return {
    id:            `promo_${id}`,
    nome,
    preco,
    categoriaId:   "promocao",
    categoriaNome: "Promoção",
  };
}

/**
 * Inicializa o clique nas promoções.
 * Adiciona o item ao carrinho e exibe toast de confirmação.
 */
function initPromoLinks() {
  const promoLinks = document.querySelectorAll(PROMO_LINK_SELECTOR);
  const toast      = document.getElementById(TOAST_ID);

  if (!promoLinks.length || !toast) return;

  promoLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const produto = extrairDadosPromo(link);

      if (!produto) {
        showToast(toast, "Não foi possível adicionar esta promoção.");
        return;
      }

      Cart.add(produto);
      showToast(toast, `✓ ${produto.nome} adicionado ao carrinho!`);
    });
  });
}

// ── Scroll Reveal ────────────────────────────────────────────────────────────

/**
 * Revela visualmente um card e para de observá-lo.
 *
 * @param {IntersectionObserverEntry} entry
 * @param {IntersectionObserver} observer
 */
function revealCard(entry, observer) {
  if (!entry.isIntersecting) return;
  entry.target.classList.add("is-revealed");
  observer.unobserve(entry.target);
}

/**
 * Inicializa o efeito de revelação dos cards conforme entram na tela.
 */
function initScrollReveal() {
  const cards = document.querySelectorAll(PROMO_CARD_SELECTOR);
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => revealCard(entry, observer)),
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
  );

  cards.forEach((card) => observer.observe(card));
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initPromoLinks();
  initScrollReveal();
});
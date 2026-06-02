/**
 * pages/promocoes.js
 * Lógica exclusiva da página de Promoções.
 *
 * Responsabilidades:
 * - Exibir feedback visual ao clicar em uma promoção
 * - Mostrar um toast informando que a promoção foi adicionada ao carrinho
 * - Aplicar efeito de revelação nos cards conforme entram na tela
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const PROMO_LINK_SELECTOR = ".promo-card__link";
const PROMO_CARD_SELECTOR = ".promo-card";
const TOAST_ID = "toast";

// ── Configurações ───────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 3000;
const REVEAL_THRESHOLD = 0.15;
const REVEAL_ROOT_MARGIN = "0px 0px -50px 0px";

// ── Toast ──────────────────────────────────────────────────────────────────

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

  setTimeout(() => {
    hideToast(toast);
  }, TOAST_DURATION_MS);
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

/**
 * Inicializa o clique nas promoções.
 *
 * Por enquanto, o clique apenas exibe um feedback visual.
 * Quando o carrinho de promoções existir, esta função poderá chamar Cart.add().
 */
function initPromoLinks() {
  const promoLinks = document.querySelectorAll(PROMO_LINK_SELECTOR);
  const toast = document.getElementById(TOAST_ID);

  if (!promoLinks.length || !toast) return;

  promoLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const promoName = link.getAttribute("data-promo-name") || "Promoção";

      showToast(toast, `${promoName} adicionado ao carrinho!`);
    });
  });
}

// ── Scroll Reveal ──────────────────────────────────────────────────────────

/**
 * Revela visualmente um card e para de observá-lo.
 *
 * Isso evita processamento desnecessário depois que o efeito já aconteceu.
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
 *
 * O IntersectionObserver observa cada card de promoção e adiciona a classe
 * `is-revealed` quando parte do card fica visível.
 */
function initScrollReveal() {
  const cards = document.querySelectorAll(PROMO_CARD_SELECTOR);

  if (!cards.length) return;

  const observerOptions = {
    threshold: REVEAL_THRESHOLD,
    rootMargin: REVEAL_ROOT_MARGIN,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => revealCard(entry, observer));
  }, observerOptions);

  cards.forEach((card) => observer.observe(card));
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initPromoLinks();
  initScrollReveal();
});
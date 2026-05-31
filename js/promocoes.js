/**
 * main.js
 * Página: Promoções
 *
 * Responsabilidades atuais:
 *  1. Animação escalonada dos cards ao carregar
 *  2. Feedback visual (toast) ao clicar em uma promoção
 *  3. Estrutura preparada (TODO) para integração com carrinho
 *
 * Padrão: módulo ES — sem poluição do escopo global.
 */

'use strict';

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/**
 * Exibe um toast de feedback acessível na tela.
 * @param {string} message - Mensagem a exibir
 * @param {number} [duration=2500] - Duração em ms antes de sumir
 */
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.setAttribute('aria-hidden', 'false');
  toast.classList.add('toast--visible');

  // Remove após a duração
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.setAttribute('aria-hidden', 'true');
  }, duration);
}

/* ============================================================
   ANIMAÇÃO DE ENTRADA ESCALONADA NOS CARDS
   Atribui a custom property --i para cada card,
   que o CSS usa via animation-delay
   ============================================================ */

function initCardAnimations() {
  const cards = document.querySelectorAll('.promo-card');

  cards.forEach((card, index) => {
    card.style.setProperty('--i', index);
  });
}

/* ============================================================
   HANDLER DE CLIQUE NOS CARDS
   Usa delegação de eventos no container pai para
   melhor performance (1 listener ao invés de N)
   ============================================================ */

/**
 * Chamado ao clicar em um card de promoção.
 * Quando o carrinho for implementado, este é o ponto de entrada.
 *
 * @param {object} promo - Dados da promoção clicada
 * @param {string} promo.id   - ID da promoção (data-promo-id)
 * @param {string} promo.name - Nome da promoção (data-promo-name)
 * @param {HTMLElement} promo.element - Elemento do card
 */
function handleAddToCart({ id, name, element }) {
  // --- Feedback visual imediato ---
  element.classList.add('promo-card--pressing');
  setTimeout(() => element.classList.remove('promo-card--pressing'), 300);

  // --- Toast acessível ---
  showToast(`"${name}" adicionado ao carrinho!`);

  // --- Atualiza badge do carrinho (placeholder) ---
  updateCartBadge(1);

  // TODO: Implementar integração com carrinho
  // Exemplo de interface futura:
  // Cart.add({ promoId: id, name, quantity: 1 });

  console.log(`[Carrinho] Promoção adicionada → id: ${id}, name: "${name}"`);
}

/* ============================================================
   BADGE DO CARRINHO
   Incrementa o contador visual. Quando o carrinho for
   implementado, este valor virá do estado real do carrinho.
   ============================================================ */

let cartCount = 0;

function updateCartBadge(increment = 0) {
  cartCount += increment;
  const badge = document.querySelector('.cart-badge');
  const cartBtn = document.querySelector('.header__cart-btn');

  if (!badge) return;

  badge.textContent = cartCount;

  // Atualiza o aria-label do botão com a contagem real
  if (cartBtn) {
    const itemLabel = cartCount === 1 ? 'item' : 'itens';
    cartBtn.setAttribute(
      'aria-label',
      `Ver carrinho de compras — ${cartCount} ${itemLabel}`
    );
  }

  // Animação de "pulso" no badge ao incrementar
  badge.style.animation = 'none';
  // Força reflow para reiniciar a animação
  void badge.offsetWidth;
  badge.style.animation = 'badgePulse 0.3s ease';
}

/* ============================================================
   DELEGAÇÃO DE EVENTOS NA LISTA DE PROMOÇÕES
   ============================================================ */

function initPromoClickHandlers() {
  const list = document.querySelector('.promotions-list');
  if (!list) return;

  list.addEventListener('click', (event) => {
    // Sobe na árvore DOM até encontrar o link do card (ou sair da lista)
    const link = event.target.closest('.promo-card__link');
    if (!link) return;

    // Previne a navegação do href="#" (que causaria scroll para o topo)
    event.preventDefault();

    const card = link.closest('.promo-card');

    handleAddToCart({
      id:      link.dataset.promoId   ?? 'unknown',
      name:    link.dataset.promoName ?? 'Promoção',
      element: card,
    });
  });

  // Suporte a teclado: Enter e Espaço também ativam o card
  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const link = event.target.closest('.promo-card__link');
    if (!link) return;

    event.preventDefault();
    link.click();
  });
}

/* ============================================================
   BOTÃO DE MENU (estado aria-expanded — preparado para sidebar)
   ============================================================ */

function initMenuButton() {
  const menuBtn = document.querySelector('.header__menu-btn');
  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!isExpanded));
    // TODO: Implementar abertura/fechamento do menu lateral
  });
}

/* ============================================================
   KEYFRAMES INJETADOS VIA JS
   (badgePulse — pequeno, não justifica arquivo CSS separado)
   ============================================================ */

function injectDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes badgePulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.45); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   INIT — ponto de entrada único
   ============================================================ */

function init() {
  injectDynamicStyles();
  initCardAnimations();
  initPromoClickHandlers();
  initMenuButton();
}

// Garante que o DOM esteja pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

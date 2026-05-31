/**
 * pages/promocoes.js
 * Lógica da página de Promoções.
 */

document.addEventListener("DOMContentLoaded", () => {
  const promoLinks = document.querySelectorAll(".promo-card__link");
  const toast = document.getElementById("toast");

  promoLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const promoName = link.getAttribute("data-promo-name");

      if (toast) {
        toast.textContent = `${promoName} adicionado ao carrinho!`;
        toast.classList.add("is-visible");
        toast.removeAttribute("aria-hidden");

        setTimeout(() => {
          toast.classList.remove("is-visible");
          toast.setAttribute("aria-hidden", "true");
        }, 3000);
      }
    });
  });

  // ── Lógica de Scroll Reveal (Intersection Observer) ──
  
  const revealOnScroll = () => {
    const cards = document.querySelectorAll(".promo-card");
    
    const observerOptions = {
      threshold: 0.15, // Dispara quando 15% do card estiver visível
      rootMargin: "0px 0px -50px 0px" // Margem negativa para o efeito começar antes de bater no topo
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          // Para de observar após revelar para economizar processamento
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    cards.forEach((card) => observer.observe(card));
  };

  revealOnScroll();
});
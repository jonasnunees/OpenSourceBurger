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
});
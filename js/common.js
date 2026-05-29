/* Centraliza funções compartilhadas entre todas as páginas */
const UI = {
  initDrawer() {
    const drawer = document.getElementById("drawer");
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
  },

  initWhatsapp() {
    const { numero, whatsappMensagem } = CONFIG.contato;
    const waLinks = document.querySelectorAll("[data-whatsapp]");
    waLinks.forEach(link => {
      link.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  UI.initDrawer();
  UI.initWhatsapp();
});
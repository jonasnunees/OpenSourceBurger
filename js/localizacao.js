/* ═══════════════════════════════════════
   localizacao.js
   Lógica da página de Localização.
   Depende de: config.js carregado antes deste script.
   ═══════════════════════════════════════ */

// ── Endereço e botão de rota ──────────────────────────────────────────────────
/**
 * Preenche o endereço completo e configura o href do botão de rota
 * a partir do CONFIG centralizado em config.js.
 *
 * Separamos o endereço completo do CONFIG.endereco para que a página
 * de Localização exiba a rua/número, enquanto o index.html pode
 * exibir um texto mais curto ("São Pedro da Aldeia").
 */
function initLocalizacao() {
  const { mapLink } = CONFIG.endereco;

  // Endereço completo fixo — pode ser movido para CONFIG se necessário
  const enderecoCompleto =
    "Estr. do Boqueirão, Baleia, São Pedro da Aldeia – RJ";

  const addressEl = document.getElementById("store-address");
  if (addressEl) {
    addressEl.textContent = enderecoCompleto;
  }

  const routeBtn = document.getElementById("route-btn");
  if (routeBtn) {
    routeBtn.href = mapLink;
  }
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
function initWhatsapp() {
  const { numero, whatsappMensagem } = CONFIG.contato;
  const waLink = document.querySelector("[data-whatsapp]");
  if (waLink) {
    waLink.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
  }
}

// ── Drawer ───────────────────────────────────────────────────────────────────
const drawer  = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");
const menuBtn = document.getElementById("menu-btn");
const closeBtn = document.getElementById("close-drawer-btn");

function openDrawer() {
  drawer.classList.add("is-open");
  overlay.classList.add("is-open");
  overlay.removeAttribute("aria-hidden");
  document.body.style.overflow = "hidden";
  // Atualiza estado ARIA do botão de menu
  menuBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", openDrawer);
overlay.addEventListener("click", closeDrawer);
if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

// Fecha o drawer com a tecla Escape (acessibilidade — WCAG 2.1 SC 1.4.13)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("is-open")) {
    closeDrawer();
    menuBtn.focus(); // Devolve foco ao botão que abriu o drawer
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────
lucide.createIcons();
initLocalizacao();
initWhatsapp();

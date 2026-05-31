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
  const { mapLink, completo } = CONFIG.endereco;

  const addressEl = document.getElementById("store-address");
  if (addressEl) {
    addressEl.textContent = completo;
  }

  const routeBtn = document.getElementById("route-btn");
  if (routeBtn) {
    routeBtn.href = mapLink;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
lucide.createIcons();
initLocalizacao();

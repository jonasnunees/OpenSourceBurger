/**
 * pages/localizacao.js
 * Lógica exclusiva da página de Localização.
 *
 * Responsabilidades:
 * - Exibir o endereço completo da loja
 * - Configurar o botão de rota usando o link do Google Maps
 * - Inicializar os ícones do Lucide, quando disponíveis
 *
 * Dependências (nesta ordem no HTML):
 * config.js → common.js → pages/localizacao.js
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const STORE_ADDRESS_ID = "store-address";
const ROUTE_BUTTON_ID = "route-btn";

// ── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Inicializa os ícones do Lucide se a biblioteca estiver disponível.
 *
 * A validação evita erro caso a biblioteca não carregue por algum motivo.
 */
function createLucideIcons() {
  if (typeof lucide === "undefined") return;

  lucide.createIcons();
}

// ── Localização ─────────────────────────────────────────────────────────────

/**
 * Preenche o endereço completo e configura o href do botão de rota
 * a partir do CONFIG centralizado em config.js.
 *
 * Separamos o endereço completo do CONFIG.endereco para que a página
 * de Localização exiba rua/número, enquanto a home pode exibir
 * um texto mais curto, como "São Pedro da Aldeia".
 */
function initLocalizacao() {
  const { mapLink, completo } = CONFIG.endereco;

  const addressElement = document.getElementById(STORE_ADDRESS_ID);
  const routeButton = document.getElementById(ROUTE_BUTTON_ID);

  if (addressElement) {
    addressElement.textContent = completo;
  }

  if (routeButton) {
    routeButton.href = mapLink;
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

createLucideIcons();
initLocalizacao();
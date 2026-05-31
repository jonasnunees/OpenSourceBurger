/**
 * pages/area-de-entrega.js
 * Lógica da página de Área de Entrega.
 *
 * Responsabilidades:
 *  - Exibir a cidade atendida
 *  - Renderizar a lista de bairros com taxas de entrega
 *  - Filtrar bairros por busca em tempo real
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → utils/formatters.js → pages/area-de-entrega.js
 */

// ── Cidade ────────────────────────────────────────────────────────────────────

/**
 * Popula o <select> de cidade com o valor definido no CONFIG.
 */
function initCidade() {
  const select = document.getElementById("city-select");
  if (!select) return;

  const option = document.createElement("option");
  option.textContent = CONFIG.cidade;
  select.appendChild(option);
}

// ── Lista de bairros ──────────────────────────────────────────────────────────

/**
 * Renderiza a lista de bairros no DOM.
 * Exibe o empty state quando a lista está vazia.
 * @param {Array<{ nome: string, taxa: number }>} lista
 */
function renderBairros(lista) {
  const ul          = document.getElementById("neighborhoods-list");
  const emptyState  = document.getElementById("empty-state");
  const emptyTerm   = document.getElementById("empty-term");
  const searchInput = document.getElementById("search-input");

  if (!ul) return;

  if (lista.length === 0) {
    ul.innerHTML = "";
    emptyTerm.textContent    = searchInput.value;
    emptyState.style.display = "block";
    lucide.createIcons();
    return;
  }

  emptyState.style.display = "none";

  ul.innerHTML = lista
    .map(
      ({ nome, taxa }) => `
        <li class="neighborhood-item">
          <span class="neighborhood-left">
            <i data-lucide="map-pin"></i>
            <span class="neighborhood-name">${nome}</span>
          </span>
          <span class="neighborhood-fee">${Formatters.formatarMoeda(taxa)}</span>
        </li>`
    )
    .join("");

  lucide.createIcons();
}

/**
 * Inicializa a lista de bairros ordenada e o filtro de busca.
 */
function initBairros() {
  const bairrosOrdenados = [...CONFIG.bairros].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  renderBairros(bairrosOrdenados);

  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.trim().toLowerCase();

    const filtrados = bairrosOrdenados.filter(({ nome }) =>
      nome.toLowerCase().includes(termo)
    );

    renderBairros(filtrados);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
initCidade();
initBairros();

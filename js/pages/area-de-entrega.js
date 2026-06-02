/**
 * pages/area-de-entrega.js
 * Lógica da página de Área de Entrega.
 *
 * Responsabilidades:
 * - Exibir a cidade atendida
 * - Renderizar a lista de bairros com taxas de entrega
 * - Filtrar bairros por busca em tempo real
 *
 * Dependências (nesta ordem no HTML):
 * config.js → common.js → utils/formatters.js → pages/area-de-entrega.js
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const CITY_SELECT_ID = "city-select";
const NEIGHBORHOODS_LIST_ID = "neighborhoods-list";
const EMPTY_STATE_ID = "empty-state";
const EMPTY_TERM_ID = "empty-term";
const SEARCH_INPUT_ID = "search-input";

// ── Cidade ─────────────────────────────────────────────────────────────────

/**
 * Popula o <select> de cidade com o valor definido no CONFIG.
 *
 * Se o elemento não existir na página, a função encerra sem gerar erro.
 */
function initCidade() {
  const citySelect = document.getElementById(CITY_SELECT_ID);

  if (!citySelect) return;

  const option = document.createElement("option");

  option.textContent = CONFIG.cidade;
  option.value = CONFIG.cidade;

  citySelect.appendChild(option);
}

// ── Lista de bairros ───────────────────────────────────────────────────────

/**
 * Retorna os elementos usados na área de bairros.
 *
 * Centralizar os seletores evita repetição e facilita manutenção futura.
 *
 * @returns {{
 *   neighborhoodsList: HTMLElement | null,
 *   emptyState: HTMLElement | null,
 *   emptyTerm: HTMLElement | null,
 *   searchInput: HTMLInputElement | null
 * }}
 */
function getNeighborhoodElements() {
  return {
    neighborhoodsList: document.getElementById(NEIGHBORHOODS_LIST_ID),
    emptyState: document.getElementById(EMPTY_STATE_ID),
    emptyTerm: document.getElementById(EMPTY_TERM_ID),
    searchInput: document.getElementById(SEARCH_INPUT_ID),
  };
}

/**
 * Inicializa novamente os ícones do Lucide após inserir HTML dinâmico.
 */
function refreshIcons() {
  if (typeof lucide === "undefined") return;

  lucide.createIcons();
}

/**
 * Cria o HTML de um bairro da lista.
 *
 * @param {{ nome: string, taxa: number }} bairro
 * @returns {string}
 */
function createNeighborhoodItemTemplate({ nome, taxa }) {
  return `
    <li class="neighborhood-item">
      <span class="neighborhood-left">
        <i data-lucide="map-pin"></i>
        <span class="neighborhood-name">${nome}</span>
      </span>

      <span class="neighborhood-fee">${Formatters.formatarMoeda(taxa)}</span>
    </li>
  `;
}

/**
 * Exibe o estado vazio quando nenhum bairro é encontrado.
 *
 * @param {HTMLElement} neighborhoodsList
 * @param {HTMLElement | null} emptyState
 * @param {HTMLElement | null} emptyTerm
 * @param {HTMLInputElement | null} searchInput
 */
function showEmptyState(neighborhoodsList, emptyState, emptyTerm, searchInput) {
  neighborhoodsList.innerHTML = "";

  if (emptyTerm && searchInput) {
    emptyTerm.textContent = searchInput.value;
  }

  if (emptyState) {
    emptyState.style.display = "block";
  }

  refreshIcons();
}

/**
 * Esconde o estado vazio da busca.
 *
 * @param {HTMLElement | null} emptyState
 */
function hideEmptyState(emptyState) {
  if (!emptyState) return;

  emptyState.style.display = "none";
}

/**
 * Renderiza a lista de bairros no DOM.
 *
 * Se a lista estiver vazia, exibe o empty state.
 *
 * @param {Array<{ nome: string, taxa: number }>} neighborhoods
 */
function renderBairros(neighborhoods) {
  const { neighborhoodsList, emptyState, emptyTerm, searchInput } =
    getNeighborhoodElements();

  if (!neighborhoodsList) return;

  if (neighborhoods.length === 0) {
    showEmptyState(neighborhoodsList, emptyState, emptyTerm, searchInput);
    return;
  }

  hideEmptyState(emptyState);

  neighborhoodsList.innerHTML = neighborhoods
    .map(createNeighborhoodItemTemplate)
    .join("");

  refreshIcons();
}

/**
 * Retorna a lista de bairros ordenada alfabeticamente.
 *
 * O locale "pt-BR" garante ordenação mais adequada para nomes em português.
 *
 * @returns {Array<{ nome: string, taxa: number }>}
 */
function getSortedNeighborhoods() {
  return [...CONFIG.bairros].sort((firstNeighborhood, secondNeighborhood) =>
    firstNeighborhood.nome.localeCompare(secondNeighborhood.nome, "pt-BR")
  );
}

/**
 * Normaliza o termo de busca para facilitar a comparação.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchTerm(value) {
  return value.trim().toLowerCase();
}

/**
 * Filtra os bairros pelo termo digitado.
 *
 * @param {Array<{ nome: string, taxa: number }>} neighborhoods
 * @param {string} searchTerm
 * @returns {Array<{ nome: string, taxa: number }>}
 */
function filterNeighborhoods(neighborhoods, searchTerm) {
  if (!searchTerm) return neighborhoods;

  return neighborhoods.filter(({ nome }) =>
    nome.toLowerCase().includes(searchTerm)
  );
}

/**
 * Inicializa a lista de bairros ordenada e o filtro de busca.
 */
function initBairros() {
  const sortedNeighborhoods = getSortedNeighborhoods();

  renderBairros(sortedNeighborhoods);

  const searchInput = document.getElementById(SEARCH_INPUT_ID);

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const searchTerm = normalizeSearchTerm(searchInput.value);
    const filteredNeighborhoods = filterNeighborhoods(
      sortedNeighborhoods,
      searchTerm
    );

    renderBairros(filteredNeighborhoods);
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

initCidade();
initBairros();
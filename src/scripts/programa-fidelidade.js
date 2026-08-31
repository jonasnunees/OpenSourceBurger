/**
 * pages/programa-fidelidade.js
 * Lógica da página Programa de Fidelidade.
 *
 * Responsabilidades:
 * - Declarar os dados de prêmios e categorias de pontuação
 * - Renderizar a lista de prêmios com busca em tempo real
 * - Renderizar a tabela de regulamento por categoria
 * - Renderizar a área "Meus pontos" para clientes logados
 *
 * O sistema de tabs é inicializado por UI.initTabs() em common.js.
 *
 * Dependências (nesta ordem no HTML):
 * config.js → auth.js → common.js → pages/programa-fidelidade.js
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const PRIZES_LIST_ID = "prizes-list";
const EMPTY_STATE_ID = "empty-state";
const SEARCH_INPUT_ID = "search-input";
const CATEGORIES_BODY_ID = "categories-body";
const REDEEMABLE_PRIZES_LIST_ID = "redeemable-prizes-list";

// ── Dados ──────────────────────────────────────────────────────────────────

/**
 * Lista de prêmios disponíveis para resgate.
 *
 * Cada item pode ter uma propriedade `img` com o caminho da imagem.
 * Quando `img` estiver ausente, um placeholder com emoji é exibido.
 *
 * @type {Array<{ nome: string, pontos: number, img?: string }>}
 */
const PREMIOS = [
  { nome: "1 Unid de Paçoca", pontos: 50 },
  { nome: "1 Unid de Picolé", pontos: 70 },
  { nome: "2 Unids de Picolé", pontos: 130 },
  { nome: "3 Unids de Picolé", pontos: 200 },
  { nome: "5 Unids de Picolé", pontos: 300 },
  { nome: "1 Unid de Refrigerante Lata", pontos: 350 },
  { nome: "1 Unid de Cobertura 270g", pontos: 400 },
  { nome: "1 Unid de Batata Pequena", pontos: 500 },
  { nome: "1 Unid de Hambúrguer", pontos: 500 },
  { nome: "1 Unid de Batata Grande", pontos: 600 },
  { nome: "1 Unid de X-Burguer", pontos: 600 },
  { nome: "1 Unid de Egg Burguer", pontos: 700 },
  { nome: "1 Unid de Coca Cola 1.5L", pontos: 750 },
  { nome: "1 Unid de X-Frango", pontos: 850 },
  { nome: "1 Unid de Bacon Burguer", pontos: 850 },
  { nome: "1 Unid de Calabresa Burguer", pontos: 850 },
  { nome: "1 Unid de Burguer Picanha", pontos: 900 },
  { nome: "1 Unid de Egg Bacon", pontos: 900 },
  { nome: "1 Unid de X-Tudo", pontos: 950 },
  { nome: "1 Unid de Copo Térmico", pontos: 1100 },
  { nome: "1 Unid de Açaí 1L", pontos: 1100 },
  { nome: "1 Unid de Bacon Picanha", pontos: 1100 },
  { nome: "1 Unid de X-Tudo Picanha", pontos: 1150 },
  { nome: "1 Unid de Duplo Picanha", pontos: 1150 },
  { nome: "1 Unid de X-Tudão", pontos: 1200 },
  { nome: "1 Unid de Duplo Burguer", pontos: 1200 },
  { nome: "1 Unid de Duplo Cheese Artesanal", pontos: 1250 },
  { nome: "1 Unid de Batata Gigante", pontos: 1300 },
  { nome: "1 Unid de Pote de Sorvete", pontos: 1350 },
  { nome: "1 Unid de Batata Grande Premium", pontos: 1350 },
  { nome: "1 Unid de Burguer Bacon Artesanal", pontos: 1350 },
  { nome: "1 Unid de Triplo X", pontos: 1400 },
  { nome: "1 Unid de Combo 1", pontos: 1500 },
  { nome: "1 Unid de Burguer Bacon Duplo Artesanal", pontos: 1650 },
  { nome: "1 Unid de Batata Gigante Premium", pontos: 1700 },
  { nome: "1 Unid de Fone de Ouvido", pontos: 1800 },
  { nome: "1 Unid de Caixa de Som", pontos: 2000 },
  { nome: "1 Unid de Cheese Burguer Artesanal", pontos: 2500 },
];

/**
 * Regras de pontuação por categoria de produto.
 *
 * `destaque: true` aplica estilo visual diferenciado na tabela.
 *
 * @type {Array<{ nome: string, formula: string, destaque?: boolean }>}
 */
const CATEGORIAS = [
  { nome: "Açaí", formula: "R$ 1 = 1 ponto" },
  { nome: "Açaí com Sorvete", formula: "R$ 1 = 1 ponto" },
  { nome: "Só Sorvete", formula: "R$ 1 = 1 ponto" },
  { nome: "Sanduíches", formula: "R$ 1 = 2 pontos", destaque: true },
  { nome: "Batatas", formula: "R$ 1 = 1 ponto" },
  { nome: "Bebidas", formula: "R$ 1 = 1 ponto" },
  { nome: "Pote de Sorvete", formula: "R$ 1 = 1 ponto" },
  { nome: "Picolé", formula: "R$ 1 = 1 ponto" },
  { nome: "Doces Artesanais", formula: "R$ 1 = 0 pontos" },
  { nome: "Picolé Kibon", formula: "R$ 1 = 1 ponto" },
  { nome: "Doce", formula: "R$ 1 = 1 ponto" },
  { nome: "Brindes Programa de Fidelidade", formula: "R$ 1 = 0 pontos" },
];

const STATUS_PEDIDOS_PONTUAVEIS = [
  "finalizado",
  "concluido",
  "concluído",
];

// ── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Inicializa os ícones do Lucide se a biblioteca estiver disponível.
 *
 * A validação evita erro caso o Lucide não tenha sido carregado.
 */
function createLucideIcons() {
  if (typeof lucide === "undefined") return;

  lucide.createIcons();
}

/**
 * Normaliza textos usados na busca.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchTerm(value) {
  return value.trim().toLowerCase();
}

/**
 * Formata a pontuação usando o padrão brasileiro.
 *
 * @param {number} pontos
 * @returns {string}
 */
function formatarPontos(pontos) {
  return pontos.toLocaleString("pt-BR");
}

/**
 * Converte preços salvos como texto ou número para Number.
 *
 * @param {unknown} valor
 * @returns {number}
 */
function parsePreco(valor) {
  if (typeof valor === "number") return valor;

  const normalizado = String(valor ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  return Number.parseFloat(normalizado) || 0;
}

/**
 * Normaliza itens salvos no pedido como objeto ou array.
 *
 * @param {object|object[]|null} itens
 * @returns {object[]}
 */
function normalizarItensPedido(itens) {
  if (Array.isArray(itens)) return itens;
  if (itens && typeof itens === "object") return Object.values(itens);
  return [];
}

function obterMultiplicadorPontos(categoriaNome) {
  const categoria = String(categoriaNome || "").toLowerCase();

  if (categoria.includes("sanduíche") || categoria.includes("sanduiche")) return 2;
  if (categoria.includes("doce artesanal")) return 0;
  if (categoria.includes("brindes programa")) return 0;

  return 1;
}

function calcularPontosItem(item) {
  const multiplicador = obterMultiplicadorPontos(item.categoriaNome);
  const subtotal = parsePreco(item.subtotal) || (parsePreco(item.preco) * Number(item.qty || 0));

  return Math.floor(subtotal * multiplicador);
}

function calcularPontosPedidos(pedidos) {
  return pedidos.reduce((total, pedido) => {
    const itens = normalizarItensPedido(pedido.itens);
    return total + itens.reduce((subtotal, item) => subtotal + calcularPontosItem(item), 0);
  }, 0);
}

/**
 * Infere um emoji de placeholder com base em palavras-chave do nome do prêmio.
 *
 * Mantém a UI informativa mesmo sem imagens reais cadastradas.
 *
 * @param {string} nome - Nome do prêmio
 * @returns {string} Emoji correspondente
 */
function inferirEmoji(nome) {
  const nomeNormalizado = nome.toLowerCase();

  if (nomeNormalizado.includes("batata")) return "🍟";
  if (nomeNormalizado.includes("picolé")) return "🍦";
  if (nomeNormalizado.includes("sorvete")) return "🍨";
  if (nomeNormalizado.includes("açaí")) return "";
  if (nomeNormalizado.includes("paçoca")) return "🍬";
  if (nomeNormalizado.includes("refrigerante") || nomeNormalizado.includes("coca")) return "🥤";
  if (nomeNormalizado.includes("copo")) return "☕";
  if (nomeNormalizado.includes("cobertura")) return "🍫";
  if (nomeNormalizado.includes("fone")) return "🎧";
  if (nomeNormalizado.includes("caixa de som")) return "🔊";
  if (nomeNormalizado.includes("combo")) return "🍔";

  return "🍔"; // fallback: sanduíches e burguers
}

// ── Templates ───────────────────────────────────────────────────────────────

/**
 * Cria o HTML da imagem ou placeholder do prêmio.
 *
 * @param {{ nome: string, img?: string }} premio
 * @returns {string}
 */
function createPrizeThumbTemplate({ nome, img }) {
  if (!img) {
    return `<span class="prize-thumb-placeholder" aria-hidden="true">${inferirEmoji(nome)}</span>`;
  }

  return `
    <img
      class="prize-thumb"
      src="${img}"
      alt="${nome}"
      width="88"
      height="88"
      loading="lazy"
    />
  `;
}

/**
 * Cria o HTML de um item da lista de prêmios.
 *
 * @param {{ nome: string, pontos: number, img?: string }} premio
 * @returns {string}
 */
function createPrizeItemTemplate(premio) {
  const { nome, pontos } = premio;

  return `
    <li class="prize-item">
      ${createPrizeThumbTemplate(premio)}

      <div class="prize-info">
        <span class="prize-name">${nome}</span>
        <span class="prize-points">${formatarPontos(pontos)} PONTOS</span>
      </div>
    </li>
  `;
}

/**
 * Cria o HTML de uma linha da tabela de regulamento.
 *
 * @param {{ nome: string, formula: string, destaque?: boolean }} categoria
 * @returns {string}
 */
function createCategoryRowTemplate({ nome, formula, destaque }) {
  return `
    <tr ${destaque ? "data-highlight" : ""}>
      <td>${nome}</td>
      <td>${formula}</td>
    </tr>
  `;
}

// ── Renderização ────────────────────────────────────────────────────────────

/**
 * Exibe o estado vazio quando nenhum prêmio é encontrado.
 *
 * @param {HTMLUListElement} prizesList
 * @param {HTMLElement | null} emptyState
 */
function showEmptyState(prizesList, emptyState) {
  prizesList.innerHTML = "";

  if (emptyState) {
    emptyState.style.display = "block";
  }

  createLucideIcons();
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
 * Renderiza a lista de prêmios no DOM.
 *
 * Exibe o empty state quando a lista está vazia.
 *
 * @param {Array<{ nome: string, pontos: number, img?: string }>} lista
 */
function renderPremios(lista) {
  const prizesList = document.getElementById(PRIZES_LIST_ID);
  const emptyState = document.getElementById(EMPTY_STATE_ID);

  if (!prizesList) return;

  if (lista.length === 0) {
    showEmptyState(prizesList, emptyState);
    return;
  }

  hideEmptyState(emptyState);

  prizesList.innerHTML = lista.map(createPrizeItemTemplate).join("");

  createLucideIcons();
}

function renderPremiosResgataveis(lista) {
  const prizesList = document.getElementById(REDEEMABLE_PRIZES_LIST_ID);

  if (!prizesList) return;

  prizesList.innerHTML = lista.map(createPrizeItemTemplate).join("");
  createLucideIcons();
}

/**
 * Filtra os prêmios pelo termo digitado na busca.
 *
 * @param {string} termo
 * @returns {Array<{ nome: string, pontos: number, img?: string }>}
 */
function filtrarPremios(termo) {
  if (!termo) return PREMIOS;

  return PREMIOS.filter(({ nome }) => nome.toLowerCase().includes(termo));
}

/**
 * Inicializa a lista de prêmios e o filtro de busca em tempo real.
 */
function initPremios() {
  renderPremios(PREMIOS);

  const searchInput = document.getElementById(SEARCH_INPUT_ID);

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const termo = normalizeSearchTerm(searchInput.value);
    const premiosFiltrados = filtrarPremios(termo);

    renderPremios(premiosFiltrados);
  });
}

/**
 * Renderiza a tabela de regulamento com as categorias de pontuação.
 */
function initRegulamento() {
  const categoriesBody = document.getElementById(CATEGORIES_BODY_ID);

  if (!categoriesBody) return;

  categoriesBody.innerHTML = CATEGORIAS.map(createCategoryRowTemplate).join("");
}

function setElementHidden(id, hidden) {
  const element = document.getElementById(id);
  if (element) element.hidden = hidden;
}

function renderSaldo(saldo) {
  const balanceEl = document.getElementById("points-balance");
  if (balanceEl) balanceEl.textContent = formatarPontos(saldo);
}

function getPremiosResgataveis(saldo) {
  return PREMIOS.filter((premio) => premio.pontos <= saldo);
}

async function buscarPedidosPontuaveis(userId) {
  const { data, error } = await SupabaseClient
    .from("pedidos")
    .select("itens")
    .eq("user_id", userId)
    .in("status", STATUS_PEDIDOS_PONTUAVEIS);

  if (error) throw error;

  return data || [];
}

async function buscarSaldoPontos(userId) {
  const pedidos = await buscarPedidosPontuaveis(userId);
  return calcularPontosPedidos(pedidos);
}

function showLoginState() {
  setElementHidden("points-summary", true);
  setElementHidden("points-loading", true);
  setElementHidden("points-empty", true);
  setElementHidden("points-no-prizes", true);
  setElementHidden("redeemable-prizes", true);
  setElementHidden("points-login-message", false);
  setElementHidden("points-login-btn", false);
}

function showLoadingState() {
  setElementHidden("points-summary", true);
  setElementHidden("points-loading", false);
  setElementHidden("points-empty", true);
  setElementHidden("points-no-prizes", true);
  setElementHidden("redeemable-prizes", true);
  setElementHidden("points-login-message", true);
  setElementHidden("points-login-btn", true);
}

function showPointsState(saldo) {
  const premiosResgataveis = getPremiosResgataveis(saldo);

  renderSaldo(saldo);
  renderPremiosResgataveis(premiosResgataveis);

  setElementHidden("points-summary", false);
  setElementHidden("points-loading", true);
  setElementHidden("points-login-message", true);
  setElementHidden("points-login-btn", true);
  setElementHidden("points-empty", saldo > 0);
  setElementHidden("points-no-prizes", saldo <= 0 || premiosResgataveis.length > 0);
  setElementHidden("redeemable-prizes", premiosResgataveis.length === 0);

  createLucideIcons();
}

async function initMeusPontos() {
  const session = Auth.getSession();

  if (!session?.id) {
    showLoginState();
    return;
  }

  showLoadingState();

  try {
    const saldo = await buscarSaldoPontos(session.id);
    showPointsState(saldo);
  } catch (error) {
    console.error("[OSB] Erro ao carregar pontos:", error);
    showPointsState(0);
  }
}

function ativarAba(tabId) {
  const tab = document.getElementById(tabId);
  if (!tab) return;

  document.querySelectorAll("[role='tab']").forEach((button) => {
    button.setAttribute("aria-selected", "false");
    button.setAttribute("tabindex", "-1");
  });

  document.querySelectorAll("[role='tabpanel']").forEach((panel) => {
    panel.classList.remove("is-active");
  });

  tab.setAttribute("aria-selected", "true");
  tab.setAttribute("tabindex", "0");
  document.getElementById(tab.getAttribute("aria-controls"))?.classList.add("is-active");
}

function initAbaInicial() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("tab") !== "meus-pontos") return;

  if (!Auth.isLoggedIn()) {
    window.location.replace("login.html?redirect=programa-fidelidade.html%3Ftab%3Dmeus-pontos");
    return;
  }

  ativarAba("tab-historico");
}

// ── Init ───────────────────────────────────────────────────────────────────

// UI.initTabs() é chamado automaticamente no carregamento global (common.js).
initPremios();
initRegulamento();
document.addEventListener("DOMContentLoaded", () => {
  initMeusPontos();
  initAbaInicial();
});

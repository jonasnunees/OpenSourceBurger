/**
 * pages/cardapio.js
 * Lógica da página Cardápio.
 *
 * Responsabilidades:
 *  - Declarar os dados de categorias, subcategorias e produtos
 *  - Renderizar tabs de categorias com scroll horizontal
 *  - Renderizar accordions de subcategorias
 *  - Controles de quantidade (+/-) por produto
 *  - Manter estado do carrinho em localStorage
 *  - Atualizar badge do carrinho no header e na barra inferior
 *  - Barra "Fechar Pedido" que aparece quando há itens no carrinho
 *  - Busca global em tempo real filtrando todos os produtos
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → pages/cardapio.js
 */

// ── Dados ─────────────────────────────────────────────────────────────────────

/**
 * Estrutura do cardápio completo.
 * Cada categoria pode ter `produtos` diretos ou `subcategorias` com seus produtos.
 * `emoji` é usado como placeholder visual quando não há imagem.
 *
 * @typedef {{ id: string, nome: string, preco: string, desc?: string, img?: string }} Produto
 * @typedef {{ id: string, nome: string, produtos: Produto[] }} Subcategoria
 * @typedef {{ id: string, nome: string, emoji: string, produtos?: Produto[], subcategorias?: Subcategoria[] }} Categoria
 */

/** @type {Categoria[]} */
const CARDAPIO = [
  {
    id: "gelados",
    nome: "Gelados",
    emoji: "🍨",
    produtos: [
      {
        id: "acai-sorvete",
        nome: "Açaí com Sorvete",
        preco: "a partir de R$ 10,00",
        desc: "Selecione até 3 ingredientes + 2 coberturas + 1 opção de sorvete",
      },
      {
        id: "so-sorvete",
        nome: "Só Sorvete",
        preco: "a partir de R$ 10,00",
        desc: "Selecione até 3 ingredientes + 2 coberturas + 2 opções de sorvete",
      },
      {
        id: "acai",
        nome: "Açaí",
        preco: "a partir de R$ 6,00",
        desc: "Selecione até 3 ingredientes + 2 coberturas",
      },
    ],
  },
  {
    id: "artesanais",
    nome: "Artesanais",
    emoji: "🍔",
    produtos: [
      {
        id: "burguer-bacon-duplo-artesanal",
        nome: "Burguer Bacon Duplo Artesanal",
        preco: "a partir de R$ 32,90",
        desc: "2 Blend 90g, 2 Fatias de cheddar, Bacon fatia, Cebola roxa, Pão brioche",
      },
      {
        id: "catupiry-burguer-artesanal",
        nome: "Catupiry Burguer Artesanal",
        preco: "a partir de R$ 29,90",
        desc: "Bacon picado, Blend 90g, Catupiry, Cebola roxa, Salada",
      },
      {
        id: "burguer-bacon-artesanal",
        nome: "Burguer Bacon Artesanal",
        preco: "a partir de R$ 26,90",
        desc: "2 unidades de ketchup, Blend 90g, Cebola roxa, Fatia de bacon, Cheddar ou catupiry, Maionese, Pão brioche",
      },
      {
        id: "duplo-cheese-artesanal",
        nome: "Duplo Cheese Artesanal",
        preco: "a partir de R$ 24,90",
        desc: "2 Blend 90g, 2 Fatia de cheddar, Pão brioche",
      },
      {
        id: "cheese-burguer-artesanal",
        nome: "Cheese Burguer Artesanal",
        preco: "a partir de R$ 14,90",
        desc: "Blend 90g, Fatia de cheddar, Maionese, Pão brioche",
      },
    ],
  },
  {
    id: "tradicionais",
    nome: "Tradicionais",
    emoji: "🍟",
    produtos: [
      {
        id: "triplo-x",
        nome: "Triplo X",
        preco: "a partir de R$ 27,90",
        desc: "3 Carnes, 3 Queijos, Bacon picado, Calabresa fatiada, Ovos, Salada",
      },
      {
        id: "duplo-burguer",
        nome: "Duplo Burguer",
        preco: "a partir de R$ 23,90",
        desc: "2 Carnes, 2 Presuntos, 2 Queijos, Bacon Picado, Calabresa fatiada, Ovo, Salada",
      },
      {
        id: "x-tudao",
        nome: "X-Tudão",
        preco: "a partir de R$ 23,90",
        desc: "Bacon picado, Calabresa, Carne, Cheddar creme, Presunto, Queijo, Frango, Ovo, Salada",
      },
      {
        id: "duplo-picanha",
        nome: "Duplo Picanha",
        preco: "a partir de R$ 22,90",
        desc: "2 Carnes, 2 Presuntos, 2 Queijos, 2 Maionese, 2 Ketchup, Salada",
      },
      {
        id: "x-tudo-picanha",
        nome: "X-Tudo Picanha",
        preco: "a partir de R$ 22,90",
        desc: "Bacon picado, Calabresa fatiada, Carne, Presunto, Queijo, Ovo, Salada",
      },
      {
        id: "bacon-picanha",
        nome: "Bacon Picanha",
        preco: "a partir de R$ 21,90",
        desc: "Bacon picado, Carne, Presunto, Queijo, Salada",
      },
      {
        id: "x-tudo",
        nome: "X-Tudo",
        preco: "a partir de R$ 18,90",
        desc: "Bacon picado, Calabresa, Carne, Presunto, Queijo, Ovo, Salada",
      },
      {
        id: "egg-bacon",
        nome: "Egg Bacon",
        preco: "a partir de R$ 17,90",
        desc: "Bacon picado, Carne, Presunto, Queijo, Ovo, Salada",
      },
      {
        id: "burguer-picanha",
        nome: "Burguer Picanha",
        preco: "a partir de R$ 17,90",
        desc: "Carne, Presunto, Queijo, Salada",
      },
      {
        id: "bacon-burguer",
        nome: "Bacon Burguer",
        preco: "a partir de R$ 16,90",
        desc: "Bacon picado, Carne, Presunto, Queijo, Salada",
      },
      {
        id: "calabresa-burguer",
        nome: "Calabresa Burguer",
        preco: "a partir de R$ 16,90",
        desc: "Calabresa fatiada, Carne, Presunto, Queijo, Salada",
      },
      {
        id: "x-frango",
        nome: "X-Frango",
        preco: "a partir de R$ 16,90",
        desc: "Frango desfiado, Queijo, Presunto, Salada",
      },
      {
        id: "egg-burguer",
        nome: "Egg Burguer",
        preco: "a partir de R$ 13,90",
        desc: "Carne, Queijo, Ovo, Salada",
      },
      {
        id: "x-burguer",
        nome: "X-Burguer",
        preco: "a partir de R$ 11,90",
        desc: "Carne, Queijo, Maionese, Salada, 2 Ketchup",
      },
      {
        id: "hamburguer",
        nome: "Hamburguer",
        preco: "a partir de R$ 9,90",
        desc: "Carne, Maionese, Salada, 2 Ketchup",
      },
    ],
  },
  {
    id: "batatas",
    nome: "Batatas",
    emoji: "🍟",
    subcategorias: [
      {
        id: "batatas-comum",
        nome: "Comum",
        produtos: [
          { id: "batata-gigante",  nome: "Batata Gigante",  preco: "R$ 25,90" },
          { id: "batata-grande",   nome: "Batata Grande",   preco: "R$ 12,00" },
          { id: "batata-pequena",  nome: "Batata Pequena",  preco: "R$ 10,00" },
        ],
      },
      {
        id: "batatas-premium",
        nome: "Premium",
        produtos: [
          {
            id: "batata-premium-gigante",
            nome: "Batata Premium Gigante",
            preco: "R$ 33,90",
            desc: "Cheddar e bacon",
          },
          {
            id: "batata-premium-grande",
            nome: "Batata Premium Grande",
            preco: "R$ 26,90",
            desc: "Cheddar e bacon",
          },
        ],
      },
    ],
  },
  {
    id: "bebidas",
    nome: "Bebidas",
    emoji: "🥤",
    subcategorias: [
      {
        id: "refrigerantes",
        nome: "Refrigerantes",
        produtos: [
          { id: "coca-1-5l",                nome: "Coca Cola 1,5L",                       preco: "R$ 15,00" },
          { id: "coca-zero-1-5l",           nome: "Coca Cola Zero 1,5L",                  preco: "R$ 15,00" },
          { id: "guarana-1-5l",             nome: "Guaraná Antártica 1,5L",               preco: "R$ 15,00" },
          { id: "mineirinho-2l",            nome: "Mineirinho 2L",                        preco: "R$ 15,00" },
          { id: "coca-600ml",               nome: "Coca Cola 600ml",                      preco: "R$ 8,00"  },
          { id: "coca-lata",                nome: "Coca Cola Lata 350ml",                 preco: "R$ 6,00"  },
          { id: "coca-zero-lata",           nome: "Coca Cola Zero Lata 350ml",            preco: "R$ 6,00"  },
          { id: "guarana-lata",             nome: "Guaraná Antártica Lata 350ml",         preco: "R$ 6,00"  },
          { id: "guaravita",                nome: "Guaravita Copo 290ml",                 preco: "R$ 3,00"  },
        ],
      },
      {
        id: "sucos",
        nome: "Sucos",
        produtos: [
          { id: "del-valle-maracuja", nome: "Del Valle Maracujá Lata 335ml", preco: "R$ 6,00" },
          { id: "del-valle-pessego",  nome: "Del Valle Pêssego Lata 335ml",  preco: "R$ 6,00" },
          { id: "del-valle-uva",      nome: "Del Valle Uva Lata 335ml",      preco: "R$ 6,00" },
        ],
      },
      {
        id: "aguas",
        nome: "Água",
        produtos: [
          { id: "agua-1-5l",          nome: "Água 1,5L",                              preco: "R$ 6,00" },
          { id: "tonica-citrus",      nome: "Água Tônica Schweppes Citrus Lata 350ml", preco: "R$ 6,00" },
          { id: "tonica-antartica",   nome: "Tônica Antártica Lata 350ml",            preco: "R$ 6,00" },
          { id: "agua-gas",           nome: "Água com Gás 500ml",                     preco: "R$ 4,00" },
          { id: "agua-500ml",         nome: "Água 500ml",                             preco: "R$ 3,00" },
        ],
      },
    ],
  },
  {
    id: "sorvetes",
    nome: "Sorvetes",
    emoji: "🍨",
    produtos: [
      { id: "sorvete-chocolate",   nome: "Sorvete Chocolate 1,8L",    preco: "R$ 25,00" },
      { id: "sorvete-flocos",      nome: "Sorvete Flocos 1,8L",       preco: "R$ 25,00" },
      { id: "sorvete-milho-verde", nome: "Sorvete Milho Verde 1,8L",  preco: "R$ 25,00" },
      { id: "sorvete-morango",     nome: "Sorvete Morango 1,8L",      preco: "R$ 25,00" },
      { id: "sorvete-napolitano",  nome: "Sorvete Napolitano 1,8L",   preco: "R$ 25,00" },
    ],
  },
  {
    id: "picoles",
    nome: "Picolés",
    emoji: "🍦",
    produtos: [
      { id: "picole-acai",           nome: "Picolé Açaí",           preco: "R$ 3,00" },
      { id: "picole-amendoim",       nome: "Picolé Amendoim",       preco: "R$ 3,00" },
      { id: "picole-chiclete",       nome: "Picolé Chiclete",       preco: "R$ 3,00" },
      { id: "picole-chocolate",      nome: "Picolé Chocolate",      preco: "R$ 3,00" },
      { id: "picole-coco",           nome: "Picolé Côco",           preco: "R$ 3,00" },
      { id: "picole-graviola",       nome: "Picolé Graviola",       preco: "R$ 3,00" },
      { id: "picole-leite-cond",     nome: "Picolé Leite Condensado", preco: "R$ 3,00" },
      { id: "picole-leite-ninho",    nome: "Picolé Leite Ninho",    preco: "R$ 3,00" },
      { id: "picole-limao",          nome: "Picolé Limão",          preco: "R$ 3,00" },
      { id: "picole-maracuja",       nome: "Picolé Maracujá",       preco: "R$ 3,00" },
      { id: "picole-morango",        nome: "Picolé Morango",        preco: "R$ 3,00" },
      { id: "picole-mousse-maracuja",nome: "Picolé Mousse de Maracujá", preco: "R$ 3,00" },
      { id: "picole-pedacinho-ceu",  nome: "Picolé Pedacinho do Céu", preco: "R$ 3,00" },
      { id: "picole-tapioca-coco",   nome: "Picolé Tapioca com Côco", preco: "R$ 3,00" },
      { id: "picole-uva",            nome: "Picolé Uva",            preco: "R$ 3,00" },
    ],
  },
  {
    id: "picoles-kibon",
    nome: "Kibon",
    emoji: "🍫",
    produtos: [
      { id: "kibon-magnum-menos-acucar",   nome: "Magnum Clássico (menos açúcar)",                 preco: "R$ 21,00" },
      { id: "kibon-magnum-chocolate",      nome: "Magnum Clássico Chocolate",                      preco: "R$ 20,00" },
      { id: "kibon-magnum-branco",         nome: "Magnum Clássico Chocolate Branco",               preco: "R$ 20,00" },
      { id: "kibon-magnum-praline",        nome: "Magnum Praliné Avelãs Caramelizadas",            preco: "R$ 20,00" },
      { id: "kibon-magnum-cookies",        nome: "Magnum Cookies & Cream",                         preco: "R$ 20,00" },
      { id: "kibon-mini-chicabon",         nome: "Bombom Mini Chicabon",                           preco: "R$ 17,00" },
      { id: "kibon-mini-eskibon",          nome: "Bombom Mini Eskibon",                            preco: "R$ 17,00" },
      { id: "kibon-cornetto-mms",          nome: "Picolé Kibon Cornetto M&M's",                    preco: "R$ 16,00" },
      { id: "kibon-brigadeiro",            nome: "Picolé Kibon Brigadeiro",                        preco: "R$ 12,00" },
      { id: "kibon-tablito",               nome: "Picolé Kibon Tablito",                           preco: "R$ 12,00" },
      { id: "kibon-chicabon-menos-acucar", nome: "Picolé Chicabon (menos açúcar)",                 preco: "R$ 11,00" },
      { id: "kibon-chicabon",              nome: "Picolé Chicabon",                                preco: "R$ 10,00" },
      { id: "kibon-eskibon",               nome: "Picolé Eskibon",                                 preco: "R$ 10,00" },
    ],
  },
  {
    id: "doces",
    nome: "Doces",
    emoji: "🍬",
    produtos: [
      { id: "pe-de-moleque",      nome: "Pé de Moleque",       preco: "R$ 4,00"  },
      { id: "bala-halls-morango", nome: "Bala Halls Morango",  preco: "R$ 3,00"  },
      { id: "jujuba",             nome: "Jujuba",              preco: "R$ 2,50"  },
      { id: "bala-unidade",       nome: "Bala (unidade)",      preco: "R$ 0,20"  },
    ],
  },
];

// ── Carrinho ──────────────────────────────────────────────────────────────────
// Toda a lógica de persistência, expiração e atualização de badges
// é delegada ao módulo global Cart (common.js).
// Este arquivo apenas consome Cart.get(), Cart.add(), Cart.remove()
// e Cart.syncBadges() quando necessário.

// ── Renderização ──────────────────────────────────────────────────────────────

/**
 * Infere emoji de placeholder a partir do id ou nome do produto/categoria.
 * @param {string} id
 * @param {string} nome
 * @returns {string}
 */
function inferirEmojiProduto(id, nome) {
  const s = (id + " " + nome).toLowerCase();
  if (s.includes("batata"))                               return "🍟";
  if (s.includes("picol"))                               return "🍦";
  if (s.includes("sorvete"))                             return "🍨";
  if (s.includes("açaí") || s.includes("acai"))         return "🫐";
  if (s.includes("paçoca") || s.includes("pacoca"))     return "🍬";
  if (s.includes("refrigerante") || s.includes("coca") || s.includes("guarana") || s.includes("mineirinho") || s.includes("guaravita")) return "🥤";
  if (s.includes("água") || s.includes("agua") || s.includes("tônica") || s.includes("tonica")) return "💧";
  if (s.includes("suco") || s.includes("del valle") || s.includes("maracujá") || s.includes("pêssego") || s.includes("uva")) return "🧃";
  if (s.includes("copo"))                               return "☕";
  if (s.includes("cobertura"))                          return "🍫";
  if (s.includes("fone"))                               return "🎧";
  if (s.includes("caixa de som"))                       return "🔊";
  if (s.includes("combo"))                              return "🍔🍟";
  if (s.includes("magnum") || s.includes("kibon") || s.includes("chicabon") || s.includes("eskibon") || s.includes("tablito") || s.includes("cornetto")) return "🍫";
  if (s.includes("bala") || s.includes("jujuba") || s.includes("pé de moleque") || s.includes("pe de moleque") || s.includes("doce")) return "🍬";
  return "🍔";
}

/**
 * Gera o HTML de um item de produto.
 * @param {Produto} produto
 * @param {number} qty - Quantidade atual no carrinho
 * @returns {string}
 */
function htmlProduto(produto, qty = 0) {
  const { id, nome, preco, desc, img } = produto;

  const thumbHtml = img
    ? `<img
         class="product-img"
         src="${img}"
         alt="${nome}"
         width="96"
         height="96"
         loading="lazy"
       />`
    : `<span class="product-img-placeholder" aria-hidden="true">${inferirEmojiProduto(id, nome)}</span>`;

  const descHtml = desc
    ? `<p class="product-desc">${desc}</p>`
    : "";

  return `
    <li class="product-item" data-product-id="${id}">
      <div class="product-img-wrap">
        ${thumbHtml}
      </div>
      <div class="product-info">
        <span class="product-name">${nome}</span>
        <span class="product-price">${preco}</span>
        ${descHtml}
      </div>
      <div class="qty-control">
        <div class="qty-pill" role="group" aria-label="Quantidade de ${nome}">
          <button
            class="qty-btn btn-minus"
            data-action="minus"
            data-product-id="${id}"
            aria-label="Remover um ${nome}"
          >
            <i data-lucide="minus"></i>
          </button>
          <span class="qty-value" aria-live="polite" aria-atomic="true">${qty}</span>
          <button
            class="qty-btn btn-plus"
            data-action="plus"
            data-product-id="${id}"
            aria-label="Adicionar um ${nome}"
          >
            <i data-lucide="plus"></i>
          </button>
        </div>
      </div>
    </li>`;
}

/**
 * Gera HTML de uma subcategoria com accordion.
 * @param {Subcategoria} subcategoria
 * @param {Object} cart
 * @param {boolean} aberta - Se o accordion inicia aberto
 * @returns {string}
 */
function htmlSubcategoria(subcategoria, cart, aberta = true) {
  const { id, nome, produtos } = subcategoria;

  const produtosHtml = produtos
    .map((p) => htmlProduto(p, cart[p.id]?.qty || 0))
    .join("");

  return `
    <div class="subcategory" id="sub-${id}">
      <button
        class="subcategory-toggle"
        aria-expanded="${aberta}"
        aria-controls="sub-body-${id}"
      >
        <i data-lucide="chevron-down"></i>
        ${nome}
      </button>
      <div
        class="subcategory-body ${aberta ? "is-open" : ""}"
        id="sub-body-${id}"
      >
        <ul class="products-list" aria-label="Produtos: ${nome}">
          ${produtosHtml}
        </ul>
      </div>
    </div>`;
}

/**
 * Gera HTML de um painel de categoria completo.
 * @param {Categoria} categoria
 * @param {Object} cart
 * @param {boolean} ativo
 * @returns {string}
 */
function htmlPainel(categoria, cart, ativo = false) {
  const { id, nome, produtos, subcategorias } = categoria;

  let conteudo = "";

  if (subcategorias && subcategorias.length > 0) {
    // Primeira subcategoria abre por padrão
    conteudo = subcategorias
      .map((sub, i) => htmlSubcategoria(sub, cart, i === 0))
      .join("");
  } else if (produtos && produtos.length > 0) {
    const produtosHtml = produtos
      .map((p) => htmlProduto(p, cart[p.id]?.qty || 0))
      .join("");
    conteudo = `<ul class="products-list" aria-label="Produtos: ${nome}">${produtosHtml}</ul>`;
  }

  return `
    <section
      class="cat-panel ${ativo ? "is-active" : ""}"
      id="panel-${id}"
      aria-label="${nome}"
    >
      ${conteudo}
    </section>`;
}

// ── Utilidades ──────────────────────────────────────────────────────────────

function createLucideIcons() {
  if (typeof lucide === "undefined") return;

  lucide.createIcons();
}

function getProductQuantity(produtoId) {
  return Cart.get()[produtoId]?.qty || 0;
}

function updateQuantityElements(produtoId, quantidade) {
  document
    .querySelectorAll(`.product-item[data-product-id="${produtoId}"] .qty-value`)
    .forEach((elemento) => {
      elemento.textContent = quantidade;
    });
}

// ── Mapa de lookup: produtoId → objeto Produto ─────────────────────────────

/**
 * Cria um mapa para encontrar produtos rapidamente pelo ID.
 *
 * Isso evita ter que percorrer o CARDAPIO inteiro toda vez
 * que o usuário clica nos botões de adicionar ou remover.
 *
 * Estrutura:
 * produtoId → { produto, categoriaId, categoriaNome }
 *
 * @returns {Map}
 */
function createProductMap() {
  const produtoMap = new Map();

  CARDAPIO.forEach((categoria) => {
    const registrarProduto = (produto) => {
      produtoMap.set(produto.id, {
        produto,
        categoriaId: categoria.id,
        categoriaNome: categoria.nome,
      });
    };

    if (categoria.produtos) {
      categoria.produtos.forEach(registrarProduto);
    }

    if (categoria.subcategorias) {
      categoria.subcategorias.forEach((subcategoria) => {
        subcategoria.produtos.forEach(registrarProduto);
      });
    }
  });

  return produtoMap;
}

/** @type {Map} */
const PRODUTO_MAP = createProductMap();

// ── Inicialização ──────────────────────────────────────────────────────────

/**
 * Renderiza as tabs de categorias.
 *
 * Mantém o mesmo HTML visual original para não alterar o layout.
 */
function initTabs() {
  const tabsContainer = document.getElementById("category-tabs");

  if (!tabsContainer) return;

  tabsContainer.innerHTML = CARDAPIO.map(
    (cat, i) => `
      <button
        class="cat-tab ${i === 0 ? "is-active" : ""}"
        type="button"
        role="tab"
        data-cat="${cat.id}"
        aria-selected="${i === 0 ? "true" : "false"}"
        aria-controls="panel-${cat.id}"
      >
        ${cat.nome}
      </button>
    `
  ).join("");
}

/**
 * Renderiza todos os painéis de categorias.
 *
 * Usa htmlPainel(), que deve permanecer com o HTML original dos produtos.
 */
function initPaineis() {
  const content = document.getElementById("menu-content");

  if (!content) return;

  const cart = Cart.get();

  content.innerHTML = CARDAPIO.map((cat, i) => htmlPainel(cat, cart, i === 0)).join("");
}

/**
 * Inicializa eventos de troca de categoria (tabs).
 */
function initEventosTabs() {
  const tabsContainer = document.getElementById("category-tabs");

  if (!tabsContainer) return;

  tabsContainer.addEventListener("click", (event) => {
    const tab = event.target.closest(".cat-tab");

    if (!tab) return;

    activateTab(tab, tabsContainer);
  });
}

function activateTab(tab, tabsContainer) {
  const catId = tab.dataset.cat;

  tabsContainer.querySelectorAll(".cat-tab").forEach((currentTab) => {
    const isActive = currentTab === tab;

    currentTab.classList.toggle("is-active", isActive);
    currentTab.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".cat-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${catId}`);
  });

  tab.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  });
}

/**
 * Inicializa eventos de accordion de subcategorias.
 */
function initEventosAccordion() {
  const menuContent = document.getElementById("menu-content");

  if (!menuContent) return;

  menuContent.addEventListener("click", (event) => {
    const toggle = event.target.closest(".subcategory-toggle");

    if (!toggle) return;

    toggleSubcategoria(toggle);
  });
}

function toggleSubcategoria(toggle) {
  const bodyId = toggle.getAttribute("aria-controls");
  const body = document.getElementById(bodyId);

  if (!body) return;

  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  const nextState = !isOpen;

  toggle.setAttribute("aria-expanded", String(nextState));
  body.classList.toggle("is-open", nextState);
}

// ── Quantidade / Carrinho ──────────────────────────────────────────────────

/**
 * Atualiza o carrinho com base na ação do botão clicado.
 *
 * Mantém o mesmo HTML dos botões +/-.
 */
function updateCartByAction(produtoId, acao) {
  const entry = PRODUTO_MAP.get(produtoId);

  if (!entry) return;

  if (acao === "plus") {
    Cart.add({
      id: produtoId,
      nome: entry.produto.nome,
      preco: entry.produto.preco,
      categoriaId: entry.categoriaId,
      categoriaNome: entry.categoriaNome,
    });

    return;
  }

  if (acao === "minus") {
    Cart.remove(produtoId);
  }
}

function handleQuantityClick(event) {
  const btn = event.target.closest(".qty-btn");

  if (!btn) return;

  const produtoId = btn.dataset.productId;
  const acao = btn.dataset.action;

  updateCartByAction(produtoId, acao);
  updateQuantityElements(produtoId, getProductQuantity(produtoId));
}

/**
 * Inicializa eventos dos botões +/- dentro do cardápio principal.
 */
function initEventosQtd() {
  const menuContent = document.getElementById("menu-content");

  if (!menuContent) return;

  menuContent.addEventListener("click", handleQuantityClick);
}

/**
 * Inicializa eventos dos botões +/- dentro do painel de busca.
 */
function initEventosQtdBusca() {
  const searchPanel = document.getElementById("search-results-panel");

  if (!searchPanel) return;

  searchPanel.addEventListener("click", handleQuantityClick);
}

// ── Busca ──────────────────────────────────────────────────────────────────

function getSearchElements() {
  return {
    input: document.getElementById("search-input"),
    tabsWrap: document.getElementById("category-tabs"),
    menuContent: document.getElementById("menu-content"),
    searchPanel: document.getElementById("search-results-panel"),
    emptyState: document.getElementById("menu-empty-state"),
  };
}

function normalizeSearchTerm(value) {
  return value.trim().toLowerCase();
}

function getProdutosDaCategoria(categoria) {
  if (categoria.produtos) return categoria.produtos;

  if (!categoria.subcategorias) return [];

  return categoria.subcategorias.flatMap((subcategoria) => subcategoria.produtos);
}

function buscarProdutos(termo) {
  const resultados = [];

  CARDAPIO.forEach((cat) => {
    const produtosEncontrados = getProdutosDaCategoria(cat).filter((produto) =>
      produto.nome.toLowerCase().includes(termo)
    );

    if (produtosEncontrados.length === 0) return;

    resultados.push({
      cat,
      produtos: produtosEncontrados,
    });
  });

  return resultados;
}

function showDefaultMenuView({ tabsWrap, menuContent, searchPanel, emptyState }) {
  if (tabsWrap) tabsWrap.style.display = "";
  if (menuContent) menuContent.style.display = "";
  if (searchPanel) searchPanel.classList.remove("is-active");
  if (emptyState) emptyState.style.display = "none";
}

function showSearchMode({ tabsWrap, menuContent, searchPanel }) {
  if (tabsWrap) tabsWrap.style.display = "none";
  if (menuContent) menuContent.style.display = "none";
  if (searchPanel) searchPanel.classList.add("is-active");
}

function renderEmptySearch(searchPanel, emptyState) {
  searchPanel.innerHTML = "";

  if (emptyState) {
    emptyState.style.display = "block";
  }

  createLucideIcons();
}

function renderSearchResults(searchPanel, emptyState, resultados) {
  const cart = Cart.get();

  if (emptyState) {
    emptyState.style.display = "none";
  }

  searchPanel.innerHTML = resultados
    .map(
      ({ cat, produtos }) => `
        <section class="search-category">
          <h2>${cat.nome}</h2>

          ${produtos.map((p) => htmlProduto(p, cart[p.id]?.qty || 0)).join("")}
        </section>
      `
    )
    .join("");

  createLucideIcons();
}

/**
 * Inicializa a busca global em tempo real.
 *
 * Quando há termo:
 * - oculta tabs e painéis principais
 * - mostra resultados globais
 *
 * Quando o campo fica vazio:
 * - restaura a visualização normal do cardápio
 */
function initBusca() {
  const searchElements = getSearchElements();
  const { input, searchPanel, emptyState } = searchElements;

  if (!input || !searchPanel) return;

  input.addEventListener("input", () => {
    const termo = normalizeSearchTerm(input.value);

    if (!termo) {
      showDefaultMenuView(searchElements);
      return;
    }

    showSearchMode(searchElements);

    const resultados = buscarProdutos(termo);

    if (resultados.length === 0) {
      renderEmptySearch(searchPanel, emptyState);
      return;
    }

    renderSearchResults(searchPanel, emptyState, resultados);
  });
}

// ── Restauração de estado ──────────────────────────────────────────────────

/**
 * Restaura as quantidades dos produtos a partir do carrinho salvo.
 *
 * Útil quando o usuário volta para o cardápio depois de navegar
 * por outras páginas do projeto.
 */
function restoreCartQuantities() {
  Object.entries(Cart.get()).forEach(([produtoId, item]) => {
    updateQuantityElements(produtoId, item.qty);
  });
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

(function init() {
  initTabs();
  initPaineis();

  createLucideIcons();

  initEventosTabs();
  initEventosAccordion();
  initEventosQtd();
  initBusca();
  initEventosQtdBusca();

  // Cart.syncBadges() é chamado pelo common.js no DOMContentLoaded,
  // mas chamamos novamente aqui após renderizar os produtos no DOM.
  Cart.syncBadges();

  restoreCartQuantities();
})();
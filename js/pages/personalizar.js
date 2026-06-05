/**
 * pages/personalizar.js
 * Lógica da página de personalização de produtos.
 *
 * Responsabilidades:
 *  - Ler ?id= da URL e localizar o produto no CARDAPIO
 *  - Renderizar tabs dinâmicas conforme o tipo do produto (gelado | sanduiche)
 *  - Gelados: Tamanho (obrigatório), Opcionais (até 3), Cobertura (até 2),
 *             Sorvete (quando aplicável, até limSorvete)
 *  - Sanduíches: Ingredientes (fixos, só leitura), Adicionais, Observações,
 *                Leve Também (qty independente)
 *  - "Açaí Puro": ao marcar, desmarca e desabilita os demais opcionais
 *  - Botão fixo no rodapé com valor dinâmico em tempo real
 *  - Ao confirmar: adiciona item principal + itens do "Leve Também" ao Cart
 *    e redireciona para cardapio.html
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → pages/cardapio.js → pages/personalizar.js
 */

// ── Estado da personalização ──────────────────────────────────────────────────

/**
 * Objeto de estado mutable que representa as escolhas do usuário.
 * É atualizado a cada interação e usado para calcular o total.
 */
const estado = {
  produto:        null,   // objeto Produto completo do CARDAPIO
  categoriaId:    "",
  categoriaNome:  "",

  // Gelados
  tamanhoId:      null,   // id do tamanho selecionado
  tamanhoPreco:   0,      // preço numérico do tamanho
  opcionaisSel:   [],     // ids dos opcionais selecionados
  coberturasSel:  [],     // ids das coberturas selecionadas
  sorvetesSel:    [],     // ids dos sorvetes selecionados

  // Sanduíches
  adicionaisSel:  [],     // { id, nome, preco }
  obsFixasSel:    [],     // ids das observações pré-definidas marcadas
  obsLivre:       "",     // texto livre
  leveTambem:     {},     // produtoId → { nome, preco, qty, emoji, subcategoria }
};

// ── Utilitários ───────────────────────────────────────────────────────────────

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parsePrecoStr(str) {
  const match = String(str).match(/[\d]+[,.][\d]{2}/);
  return match ? parseFloat(match[0].replace(",", ".")) : 0;
}

/**
 * Lê o parâmetro ?id= da URL atual.
 * @returns {string|null}
 */
function getProdutoIdDaURL() {
  return new URLSearchParams(window.location.search).get("id");
}

/**
 * Localiza o produto no CARDAPIO pelo id.
 * Retorna também categoriaId e categoriaNome.
 *
 * @param {string} id
 * @returns {{ produto, categoriaId, categoriaNome } | null}
 */
function encontrarProduto(id) {
  for (const cat of CARDAPIO) {
    const lista = cat.produtos || cat.subcategorias?.flatMap((s) => s.produtos) || [];
    const prod  = lista.find((p) => p.id === id);
    if (prod) return { produto: prod, categoriaId: cat.id, categoriaNome: cat.nome };
  }
  return null;
}

// ── Cálculo do total ──────────────────────────────────────────────────────────

/**
 * Calcula o total em tempo real somando:
 * - Preço base (tamanho para gelados, preço do produto para sanduíches)
 * - Adicionais selecionados (sanduíches)
 * - Itens do Leve Também
 *
 * @returns {number}
 */
function calcularTotal() {
  let total = 0;

  if (estado.produto?.tipoPersonalizacao === "gelado") {
    total += estado.tamanhoPreco;
  } else {
    total += parsePrecoStr(estado.produto?.preco || "0");
  }

  // Adicionais de sanduíche
  estado.adicionaisSel.forEach(({ preco }) => { total += preco; });

  // Leve Também
  Object.values(estado.leveTambem).forEach(({ preco, qty }) => {
    total += preco * qty;
  });

  return total;
}

/**
 * Atualiza o texto do botão de rodapé com o total calculado.
 */
function atualizarBotaoTotal() {
  const btn = document.getElementById("btn-adicionar");
  if (!btn) return;

  const total = calcularTotal();
  btn.querySelector(".btn-add-label").textContent = `ADICIONAR ${formatarPreco(total)}`;
}

// ── Renderização das tabs ─────────────────────────────────────────────────────

/**
 * Define as tabs de acordo com o tipo de produto.
 *
 * @returns {{ id: string, label: string }[]}
 */
function getTabsParaProduto(produto) {
  if (produto.tipoPersonalizacao === "gelado") {
    const tabs = [
      { id: "tab-tamanho",   label: "Tamanho"   },
      { id: "tab-opcionais", label: "Opcionais" },
      { id: "tab-cobertura", label: "Cobertura" },
    ];
    if (produto.sorvetes?.length) {
      tabs.push({ id: "tab-sorvete", label: "Sorvete" });
    }
    return tabs;
  }

  return [
    { id: "tab-ingredientes", label: "Ingredientes" },
    { id: "tab-adicionais",   label: "Adicionais"   },
    { id: "tab-leve-tambem",  label: "Leve Também"  },
  ];
}

/**
 * Injeta as tabs no container e ativa a primeira.
 */
function renderTabs(tabs) {
  const container = document.getElementById("personalizar-tabs");
  if (!container) return;

  container.innerHTML = tabs
    .map((tab, i) => `
      <button
        class="cat-tab ${i === 0 ? "is-active" : ""}"
        type="button"
        role="tab"
        data-tab="${tab.id}"
        aria-selected="${i === 0}"
        aria-controls="panel-${tab.id}"
        id="${tab.id}"
      >
        ${tab.label}
      </button>`)
    .join("");
}

// ── Painéis ───────────────────────────────────────────────────────────────────

/** Ativa uma tab e seu painel. */
function ativarTab(tabId) {
  document.querySelectorAll("#personalizar-tabs .cat-tab").forEach((btn) => {
    const ativa = btn.dataset.tab === tabId;
    btn.classList.toggle("is-active", ativa);
    btn.setAttribute("aria-selected", String(ativa));
  });

  document.querySelectorAll(".personalizar-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${tabId}`);
  });
}

/** Inicializa cliques nas tabs. */
function initEventosTabs() {
  const container = document.getElementById("personalizar-tabs");
  if (!container) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-tab");
    if (!btn) return;
    ativarTab(btn.dataset.tab);
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

// ── Painel: Tamanho (gelados) ─────────────────────────────────────────────────

function renderPainelTamanho(produto) {
  const panel = document.getElementById("panel-tab-tamanho");
  if (!panel) return;

  panel.innerHTML = `
    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Escolha o tamanho
        <span class="opcoes-badge obrigatorio">Obrigatório</span>
      </legend>
      <ul class="opcoes-list" role="radiogroup" aria-label="Tamanho">
        ${produto.tamanhos.map((tam) => `
          <li class="opcao-item">
            <label class="opcao-label" for="tam-${tam.id}">
              <input
                type="radio"
                id="tam-${tam.id}"
                name="tamanho"
                value="${tam.id}"
                data-preco="${tam.preco}"
                class="opcao-input"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${tam.nome}</span>
              <span class="opcao-preco">${formatarPreco(tam.preco)}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>`;

  panel.addEventListener("change", (e) => {
    const radio = e.target.closest('input[name="tamanho"]');
    if (!radio) return;

    estado.tamanhoId    = radio.value;
    estado.tamanhoPreco = parseFloat(radio.dataset.preco);
    atualizarBotaoTotal();
  });
}

// ── Painel: Opcionais (gelados) ───────────────────────────────────────────────

function renderPainelOpcionais(produto) {
  const panel = document.getElementById("panel-tab-opcionais");
  if (!panel) return;

  panel.innerHTML = `
    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Escolha os ingredientes
        <span class="opcoes-badge limite">Até 3</span>
      </legend>
      <ul class="opcoes-list">
        ${produto.opcionais.map((op) => `
          <li class="opcao-item">
            <label class="opcao-label" for="${op.id}">
              <input
                type="checkbox"
                id="${op.id}"
                value="${op.id}"
                data-exclusivo="${op.exclusivo || false}"
                class="opcao-input opcao-opcional"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${op.nome}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>`;

  panel.addEventListener("change", (e) => {
    const cb = e.target.closest(".opcao-opcional");
    if (!cb) return;
    handleOpcionalChange(cb, produto);
  });
}

/**
 * Gerencia seleção de opcionais com limite de 3 e lógica do "Açaí Puro".
 */
function handleOpcionalChange(checkbox, produto) {
  const isExclusivo = checkbox.dataset.exclusivo === "true";
  const allCheckboxes = document.querySelectorAll(".opcao-opcional");

  if (checkbox.checked && isExclusivo) {
    // Marcar "Açaí Puro": desmarca e desabilita todos os outros
    allCheckboxes.forEach((cb) => {
      if (cb !== checkbox) {
        cb.checked  = false;
        cb.disabled = true;
        cb.closest(".opcao-item")?.classList.add("is-disabled");
      }
    });
    estado.opcionaisSel = [checkbox.value];
    atualizarBotaoTotal();
    return;
  }

  if (!checkbox.checked && isExclusivo) {
    // Desmarcar "Açaí Puro": reabilita todos
    allCheckboxes.forEach((cb) => {
      cb.disabled = false;
      cb.closest(".opcao-item")?.classList.remove("is-disabled");
    });
    estado.opcionaisSel = [];
    atualizarBotaoTotal();
    return;
  }

  // Opcionais normais: respeita limite de 3
  const marcados = [...allCheckboxes].filter((cb) => cb.checked && cb.dataset.exclusivo !== "true");

  if (checkbox.checked && marcados.length > 3) {
    checkbox.checked = false;
    mostrarToastLimite("Máximo de 3 ingredientes");
    return;
  }

  estado.opcionaisSel = marcados.map((cb) => cb.value);
  atualizarBotaoTotal();
}

// ── Painel: Cobertura (gelados) ───────────────────────────────────────────────

function renderPainelCobertura(produto) {
  const panel = document.getElementById("panel-tab-cobertura");
  if (!panel) return;

  panel.innerHTML = `
    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Escolha a cobertura
        <span class="opcoes-badge limite">Até 2</span>
      </legend>
      <ul class="opcoes-list">
        ${produto.coberturas.map((cob) => `
          <li class="opcao-item">
            <label class="opcao-label" for="${cob.id}">
              <input
                type="checkbox"
                id="${cob.id}"
                value="${cob.id}"
                class="opcao-input opcao-cobertura"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${cob.nome}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>`;

  panel.addEventListener("change", (e) => {
    const cb = e.target.closest(".opcao-cobertura");
    if (!cb) return;

    const marcadas = [...document.querySelectorAll(".opcao-cobertura:checked")];

    if (cb.checked && marcadas.length > 2) {
      cb.checked = false;
      mostrarToastLimite("Máximo de 2 coberturas");
      return;
    }

    estado.coberturasSel = marcadas.map((c) => c.value);
    atualizarBotaoTotal();
  });
}

// ── Painel: Sorvete (gelados com sorvete) ─────────────────────────────────────

function renderPainelSorvete(produto) {
  const panel = document.getElementById("panel-tab-sorvete");
  if (!panel) return;

  const lim      = produto.limSorvete || 1;
  const tipoInput = lim === 1 ? "radio" : "checkbox";
  const labelLim  = lim === 1 ? "Escolha 1 sabor" : `Até ${lim} sabores`;

  panel.innerHTML = `
    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Sabor do sorvete
        <span class="opcoes-badge ${lim === 1 ? "obrigatorio" : "limite"}">${labelLim}</span>
      </legend>
      <ul class="opcoes-list" ${tipoInput === "radio" ? 'role="radiogroup"' : ""}>
        ${produto.sorvetes.map((sor) => `
          <li class="opcao-item">
            <label class="opcao-label" for="${sor.id}">
              <input
                type="${tipoInput}"
                id="${sor.id}"
                name="sorvete"
                value="${sor.id}"
                class="opcao-input opcao-sorvete"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${sor.nome}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>`;

  panel.addEventListener("change", (e) => {
    const input = e.target.closest(".opcao-sorvete");
    if (!input) return;

    if (tipoInput === "checkbox") {
      const marcados = [...document.querySelectorAll(".opcao-sorvete:checked")];
      if (input.checked && marcados.length > lim) {
        input.checked = false;
        mostrarToastLimite(`Máximo de ${lim} sabores`);
        return;
      }
      estado.sorvetesSel = marcados.map((c) => c.value);
    } else {
      estado.sorvetesSel = [input.value];
    }

    atualizarBotaoTotal();
  });
}

// ── Painel: Ingredientes fixos + Observações (sanduíches) ────────────────────

function renderPainelIngredientes(produto) {
  const panel = document.getElementById("panel-tab-ingredientes");
  if (!panel) return;

  panel.innerHTML = `
    <div class="opcoes-fieldset">
      <p class="opcoes-legend">Ingredientes do lanche</p>
      <p class="ingredientes-aviso">
        <i data-lucide="info" aria-hidden="true"></i>
        Para remover um ingrediente, utilize o campo de observação.
      </p>
      <ul class="fixos-list">
        ${produto.fixos.map((nome) => `
          <li class="fixo-item">
            <i data-lucide="check" aria-hidden="true"></i>
            ${nome}
          </li>`).join("")}
      </ul>
    </div>

    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Observações rápidas
        <span class="opcoes-badge opcional">Opcional</span>
      </legend>
      <ul class="opcoes-list">
        ${produto.observacoes.map((obs) => `
          <li class="opcao-item">
            <label class="opcao-label" for="${obs.id}">
              <input
                type="checkbox"
                id="${obs.id}"
                value="${obs.id}"
                data-nome="${obs.nome}"
                class="opcao-input opcao-obs-fixa"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${obs.nome}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>

    <div class="opcoes-fieldset">
      <label class="opcoes-legend" for="obs-livre">
        Alguma observação?
        <span class="opcoes-badge opcional">Opcional</span>
      </label>
      <textarea
        id="obs-livre"
        class="obs-textarea"
        placeholder="Ex: sem cebola, ponto da carne, embalagem separada..."
        rows="4"
        maxlength="300"
        aria-describedby="obs-contador"
      ></textarea>
      <span class="obs-contador" id="obs-contador" aria-live="polite">0 / 300</span>
    </div>`;

  panel.addEventListener("change", (e) => {
    const cb = e.target.closest(".opcao-obs-fixa");
    if (!cb) return;
    const marcadas = [...document.querySelectorAll(".opcao-obs-fixa:checked")];
    estado.obsFixasSel = marcadas.map((c) => c.dataset.nome);
  });

  const textarea = panel.querySelector("#obs-livre");
  const contador = panel.querySelector("#obs-contador");

  textarea?.addEventListener("input", () => {
    estado.obsLivre = textarea.value;
    if (contador) contador.textContent = `${textarea.value.length} / 300`;
  });

  if (typeof lucide !== "undefined") lucide.createIcons();
}

// ── Painel: Adicionais (sanduíches) ──────────────────────────────────────────

function renderPainelAdicionais(produto) {
  const panel = document.getElementById("panel-tab-adicionais");
  if (!panel) return;

  panel.innerHTML = `
    <fieldset class="opcoes-fieldset">
      <legend class="opcoes-legend">
        Adicionar ingredientes
        <span class="opcoes-badge opcional">Opcional</span>
      </legend>
      <ul class="opcoes-list">
        ${produto.adicionais.map((ad) => `
          <li class="opcao-item">
            <label class="opcao-label" for="${ad.id}">
              <input
                type="checkbox"
                id="${ad.id}"
                value="${ad.id}"
                data-nome="${ad.nome}"
                data-preco="${ad.preco}"
                class="opcao-input opcao-adicional"
              />
              <span class="opcao-check"></span>
              <span class="opcao-nome">${ad.nome}</span>
              <span class="opcao-preco">+ ${formatarPreco(ad.preco)}</span>
            </label>
          </li>`).join("")}
      </ul>
    </fieldset>`;

  panel.addEventListener("change", (e) => {
    const cb = e.target.closest(".opcao-adicional");
    if (!cb) return;

    const marcados = [...document.querySelectorAll(".opcao-adicional:checked")];
    estado.adicionaisSel = marcados.map((c) => ({
      id:    c.value,
      nome:  c.dataset.nome,
      preco: parseFloat(c.dataset.preco),
    }));

    atualizarBotaoTotal();
  });
}

// ── Painel: Leve Também (sanduíches) ─────────────────────────────────────────

function renderPainelLeveTambem(produto) {
  const panel = document.getElementById("panel-tab-leve-tambem");
  if (!panel) return;

  panel.innerHTML = `
    <div class="opcoes-fieldset">
      <p class="opcoes-legend">
        Leve Também
        <span class="opcoes-badge opcional">Opcional</span>
      </p>
      <ul class="leve-list">
        ${produto.leveTambem.map((item) => `
          <li class="leve-item" data-leve-id="${item.id}">
            <div class="leve-thumb" aria-hidden="true">${item.emoji}</div>
            <div class="leve-info">
              <span class="leve-nome">${item.nome} <strong>+ ${formatarPreco(item.preco)}</strong></span>
              <span class="leve-sub">${item.subcategoria}</span>
            </div>
            <div class="qty-pill leve-qty" role="group" aria-label="Quantidade de ${item.nome}">
              <button
                class="qty-btn btn-minus leve-minus"
                data-leve-id="${item.id}"
                aria-label="Remover ${item.nome}"
                type="button"
              >
                <i data-lucide="minus"></i>
              </button>
              <span class="qty-value leve-qty-value" aria-live="polite">0</span>
              <button
                class="qty-btn btn-plus leve-plus"
                data-leve-id="${item.id}"
                aria-label="Adicionar ${item.nome}"
                type="button"
              >
                <i data-lucide="plus"></i>
              </button>
            </div>
          </li>`).join("")}
      </ul>
    </div>`;

  panel.addEventListener("click", (e) => {
    const btnMinus = e.target.closest(".leve-minus");
    const btnPlus  = e.target.closest(".leve-plus");
    const btn      = btnMinus || btnPlus;
    if (!btn) return;

    const leveId = btn.dataset.leveId;
    const item   = produto.leveTambem.find((i) => i.id === leveId);
    if (!item) return;

    if (!estado.leveTambem[leveId]) {
      estado.leveTambem[leveId] = { ...item, qty: 0 };
    }

    if (btnPlus)  estado.leveTambem[leveId].qty += 1;
    if (btnMinus) estado.leveTambem[leveId].qty  = Math.max(0, estado.leveTambem[leveId].qty - 1);

    // Atualiza qty visível
    const qtyEl = panel.querySelector(`.leve-item[data-leve-id="${leveId}"] .leve-qty-value`);
    if (qtyEl) qtyEl.textContent = estado.leveTambem[leveId].qty;

    atualizarBotaoTotal();
  });

  if (typeof lucide !== "undefined") lucide.createIcons();
}

// ── Toast de limite ───────────────────────────────────────────────────────────

/**
 * Exibe brevemente uma mensagem de limite atingido.
 * Reutiliza o padrão .toast do base.css (se existir) ou cria inline.
 */
function mostrarToastLimite(mensagem) {
  let toast = document.getElementById("personalizar-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "personalizar-toast";
    toast.className = "toast";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 2000);
}

// ── Renderização dos painéis ──────────────────────────────────────────────────

/**
 * Cria os containers dos painéis no DOM e popula cada um.
 */
function renderPaineis(produto) {
  const content = document.getElementById("personalizar-content");
  if (!content) return;

  const tipo = produto.tipoPersonalizacao;

  const paineis = tipo === "gelado"
    ? [
        `<section class="personalizar-panel is-active" id="panel-tab-tamanho"   aria-label="Tamanho"></section>`,
        `<section class="personalizar-panel"           id="panel-tab-opcionais" aria-label="Opcionais"></section>`,
        `<section class="personalizar-panel"           id="panel-tab-cobertura" aria-label="Cobertura"></section>`,
        produto.sorvetes?.length
          ? `<section class="personalizar-panel" id="panel-tab-sorvete" aria-label="Sorvete"></section>`
          : "",
      ]
    : [
        `<section class="personalizar-panel is-active" id="panel-tab-ingredientes" aria-label="Ingredientes"></section>`,
        `<section class="personalizar-panel"           id="panel-tab-adicionais"   aria-label="Adicionais"></section>`,
        `<section class="personalizar-panel"           id="panel-tab-leve-tambem"  aria-label="Leve Também"></section>`,
      ];

  content.innerHTML = paineis.join("");

  // Popula cada painel
  if (tipo === "gelado") {
    renderPainelTamanho(produto);
    renderPainelOpcionais(produto);
    renderPainelCobertura(produto);
    if (produto.sorvetes?.length) renderPainelSorvete(produto);
  } else {
    renderPainelIngredientes(produto);
    renderPainelAdicionais(produto);
    renderPainelLeveTambem(produto);
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

// ── Header da página ──────────────────────────────────────────────────────────

/**
 * Preenche o título e emoji do produto no header.
 */
function renderHeader(produto) {
  const titulo = document.getElementById("personalizar-titulo");
  if (titulo) titulo.textContent = produto.nome;
}

// ── Confirmação: adicionar ao carrinho ────────────────────────────────────────

/**
 * Valida se o pedido está completo (tamanho obrigatório para gelados).
 * @returns {{ valido: boolean, mensagem?: string }}
 */
function validarPedido() {
  const tipo = estado.produto.tipoPersonalizacao;

  if (tipo === "gelado" && !estado.tamanhoId) {
    return { valido: false, mensagem: "Selecione o tamanho antes de continuar" };
  }

  return { valido: true };
}

/**
 * Monta a string de descrição do pedido personalizado para salvar no carrinho.
 * Isso facilita exibir os detalhes na página do carrinho futuramente.
 */
function montarDescricaoPedido() {
  const tipo   = estado.produto.tipoPersonalizacao;
  const partes = [];

  if (tipo === "gelado") {
    const tam = estado.produto.tamanhos.find((t) => t.id === estado.tamanhoId);
    if (tam) partes.push(`Tamanho: ${tam.nome}`);

    if (estado.opcionaisSel.length) {
      const nomes = estado.opcionaisSel.map((id) =>
        estado.produto.opcionais.find((o) => o.id === id)?.nome || id
      );
      partes.push(`Ingredientes: ${nomes.join(", ")}`);
    }

    if (estado.coberturasSel.length) {
      const nomes = estado.coberturasSel.map((id) =>
        estado.produto.coberturas.find((c) => c.id === id)?.nome || id
      );
      partes.push(`Coberturas: ${nomes.join(", ")}`);
    }

    if (estado.sorvetesSel.length && estado.produto.sorvetes) {
      const nomes = estado.sorvetesSel.map((id) =>
        estado.produto.sorvetes.find((s) => s.id === id)?.nome || id
      );
      partes.push(`Sorvete: ${nomes.join(", ")}`);
    }
  } else {
    if (estado.adicionaisSel.length) {
      partes.push(`Adicionais: ${estado.adicionaisSel.map((a) => a.nome).join(", ")}`);
    }

    const todasObs = [
      ...estado.obsFixasSel,
      ...(estado.obsLivre.trim() ? [estado.obsLivre.trim()] : []),
    ];
    if (todasObs.length) partes.push(`Obs: ${todasObs.join("; ")}`);
  }

  return partes.join(" · ");
}

/**
 * Substitui o item existente no carrinho pela versão personalizada,
 * preservando a quantidade original, e adiciona os itens do Leve Também.
 *
 * Fluxo:
 * 1. Lê a qty atual do item no Cart (pode ser 0 se ainda não estava)
 * 2. Remove completamente o item existente via Cart.remove() em loop
 * 3. Recria o item com o novo preço e descrição, respeitando a qty original
 * 4. Adiciona itens do Leve Também independentemente
 * 5. Redireciona para meu-carrinho.html
 */
function confirmarPedido() {
  const { valido, mensagem } = validarPedido();

  if (!valido) {
    mostrarToastLimite(mensagem);
    return;
  }

  const total     = calcularTotal();
  const desc      = montarDescricaoPedido();
  const produtoId = estado.produto.id;

  // Preserva a qty que já estava no carrinho (mínimo 1)
  const qtyAtual = Cart.get()[produtoId]?.qty || 1;

  // Remove completamente o item existente antes de recriar
  for (let i = 0; i < qtyAtual; i++) {
    Cart.remove(produtoId);
  }

  // Recria o item com o preço e descrição atualizados, na mesma qty
  for (let i = 0; i < qtyAtual; i++) {
    Cart.add({
      id:                 produtoId,
      nome:               estado.produto.nome,
      preco:              formatarPreco(total),
      categoriaId:        estado.categoriaId,
      categoriaNome:      estado.categoriaNome,
      descPersonalizacao: desc,
    });
  }

  // Adiciona itens do Leve Também independentemente
  Object.values(estado.leveTambem).forEach(({ id, nome, preco, qty, subcategoria }) => {
    if (qty <= 0) return;
    for (let i = 0; i < qty; i++) {
      Cart.add({
        id,
        nome,
        preco:         formatarPreco(preco),
        categoriaId:   "bebidas-batatas",
        categoriaNome: subcategoria,
      });
    }
  });

  window.location.href = "meu-carrinho.html";
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

(function init() {
  const produtoId = getProdutoIdDaURL();

  if (!produtoId) {
    window.location.href = "cardapio.html";
    return;
  }

  const resultado = encontrarProduto(produtoId);

  if (!resultado) {
    window.location.href = "cardapio.html";
    return;
  }

  const { produto, categoriaId, categoriaNome } = resultado;

  // Preenche o estado global
  estado.produto       = produto;
  estado.categoriaId   = categoriaId;
  estado.categoriaNome = categoriaNome;

  // Renderiza a página
  renderHeader(produto);

  const tabs = getTabsParaProduto(produto);
  renderTabs(tabs);
  renderPaineis(produto);
  initEventosTabs();
  atualizarBotaoTotal();

  // Botão confirmar
  document.getElementById("btn-adicionar")?.addEventListener("click", confirmarPedido);
})();
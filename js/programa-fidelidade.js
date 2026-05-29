/* ═══════════════════════════════════════
   programa-fidelidade.js
   Lógica da página Programa de Fidelidade.
   Depende de: config.js carregado antes deste script.
   ═══════════════════════════════════════ */

// ── Dados dos prêmios ─────────────────────────────────────────────────────────
/**
 * Cada item pode ter uma propriedade `img` com o caminho da imagem.
 * Quando ausente, um placeholder com emoji é exibido.
 * O emoji é escolhido automaticamente pela categoria inferida do nome.
 */
const PREMIOS = [
  { nome: "1 Unid de Paçoca",                  pontos: 50   },
  { nome: "1 Unid de Picolé",                   pontos: 70   },
  { nome: "2 Unids de Picolé",                  pontos: 130  },
  { nome: "3 Unids de Picolé",                  pontos: 200  },
  { nome: "5 Unids de Picolé",                  pontos: 300  },
  { nome: "1 Unid de Refrigerante Lata",        pontos: 350  },
  { nome: "1 Unid de Cobertura 270g",           pontos: 400  },
  { nome: "1 Unid de Batata Pequena",           pontos: 500  },
  { nome: "1 Unid de Hambúrguer",              pontos: 500  },
  { nome: "1 Unid de Batata Grande",            pontos: 600  },
  { nome: "1 Unid de X-Burguer",                pontos: 600  },
  { nome: "1 Unid de Egg Burguer",              pontos: 700  },
  { nome: "1 Unid de Coca Cola 1.5L",           pontos: 750  },
  { nome: "1 Unid de X-Frango",                 pontos: 850  },
  { nome: "1 Unid de Bacon Burguer",            pontos: 850  },
  { nome: "1 Unid de Calabresa Burguer",        pontos: 850  },
  { nome: "1 Unid de Burguer Picanha",          pontos: 900  },
  { nome: "1 Unid de Egg Bacon",               pontos: 900  },
  { nome: "1 Unid de X-Tudo",                   pontos: 950  },
  { nome: "1 Unid de Copo Térmico",            pontos: 1100 },
  { nome: "1 Unid de Açaí 1L",                 pontos: 1100 },
  { nome: "1 Unid de Bacon Picanha",            pontos: 1100 },
  { nome: "1 Unid de X-Tudo Picanha",           pontos: 1150 },
  { nome: "1 Unid de Duplo Picanha",            pontos: 1150 },
  { nome: "1 Unid de X-Tudão",                  pontos: 1200 },
  { nome: "1 Unid de Duplo Burguer",            pontos: 1200 },
  { nome: "1 Unid de Duplo Cheese Artesanal",   pontos: 1250 },
  { nome: "1 Unid de Batata Gigante",           pontos: 1300 },
  { nome: "1 Unid de Pote de Sorvete",          pontos: 1350 },
  { nome: "1 Unid de Batata Grande Premium",    pontos: 1350 },
  { nome: "1 Unid de Burguer Bacon Artesanal",  pontos: 1350 },
  { nome: "1 Unid de Triplo X",                 pontos: 1400 },
  { nome: "1 Unid de Combo 1",                  pontos: 1500 },
  { nome: "1 Unid de Burguer Bacon Duplo Artesanal", pontos: 1650 },
  { nome: "1 Unid de Batata Gigante Premium",   pontos: 1700 },
  { nome: "1 Unid de Fone de Ouvido",           pontos: 1800 },
  { nome: "1 Unid de Caixa de Som",             pontos: 2000 },
  { nome: "1 Unid de Cheese Burguer Artesanal", pontos: 2500 },
];

// ── Dados de pontuação por categoria ─────────────────────────────────────────
const CATEGORIAS = [
  { nome: "Açaí",                           formula: "R$ 1 = 1 ponto"  },
  { nome: "Açaí com Sorvete",               formula: "R$ 1 = 1 ponto"  },
  { nome: "Só Sorvete",                     formula: "R$ 1 = 1 ponto"  },
  { nome: "Sanduíches",                     formula: "R$ 1 = 2 pontos", destaque: true },
  { nome: "Batatas",                        formula: "R$ 1 = 1 ponto"  },
  { nome: "Bebidas",                        formula: "R$ 1 = 1 ponto"  },
  { nome: "Pote de Sorvete",                formula: "R$ 1 = 1 ponto"  },
  { nome: "Picolé",                         formula: "R$ 1 = 1 ponto"  },
  { nome: "Doces Artesanais",               formula: "R$ 1 = 0 pontos" },
  { nome: "Picolé Kibon",                   formula: "R$ 1 = 1 ponto"  },
  { nome: "Doce",                           formula: "R$ 1 = 1 ponto"  },
  { nome: "Brindes Programa de Fidelidade", formula: "R$ 1 = 0 pontos" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Infere um emoji de placeholder com base em palavras-chave do nome do prêmio.
 * Mantém a UI informativa mesmo sem imagens reais.
 */
function inferirEmoji(nome) {
  const n = nome.toLowerCase();
  if (n.includes("batata"))       return "🍟";
  if (n.includes("picolé"))       return "🍦";
  if (n.includes("sorvete"))      return "🍨";
  if (n.includes("açaí"))         return "🫐";
  if (n.includes("paçoca"))       return "🍬";
  if (n.includes("refrigerante") || n.includes("coca"))  return "🥤";
  if (n.includes("copo"))         return "☕";
  if (n.includes("cobertura"))    return "🍫";
  if (n.includes("fone"))         return "🎧";
  if (n.includes("caixa de som")) return "🔊";
  if (n.includes("combo"))        return "🍔🍟";
  // Sanduíches e burguers como fallback
  return "🍔";
}

// ── Painel: Prêmios ───────────────────────────────────────────────────────────

function renderPremios(lista) {
  const ul          = document.getElementById("prizes-list");
  const emptyState  = document.getElementById("empty-state");

  if (!ul) return;

  if (lista.length === 0) {
    ul.innerHTML = "";
    emptyState.style.display = "block";
    lucide.createIcons();
    return;
  }

  emptyState.style.display = "none";

  ul.innerHTML = lista.map(({ nome, pontos, img }) => {
    const thumbHtml = img
      ? `<img
           class="prize-thumb"
           src="${img}"
           alt="${nome}"
           width="88"
           height="88"
           loading="lazy"
         />`
      : `<span class="prize-thumb-placeholder" aria-hidden="true">${inferirEmoji(nome)}</span>`;

    return `
      <li class="prize-item">
        ${thumbHtml}
        <div class="prize-info">
          <span class="prize-name">${nome}</span>
          <span class="prize-points">${pontos.toLocaleString("pt-BR")} PONTOS</span>
        </div>
      </li>
    `;
  }).join("");
}

function initPremios() {
  renderPremios(PREMIOS);

  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.trim().toLowerCase();

    const filtrados = PREMIOS.filter(({ nome }) =>
      nome.toLowerCase().includes(termo)
    );

    renderPremios(filtrados);
  });
}

// ── Painel: Regulamento ───────────────────────────────────────────────────────

function initRegulamento() {
  const tbody = document.getElementById("categories-body");
  if (!tbody) return;

  tbody.innerHTML = CATEGORIAS.map(({ nome, formula, destaque }) => `
    <tr ${destaque ? 'data-highlight' : ''}>
      <td>${nome}</td>
      <td>${formula}</td>
    </tr>
  `).join("");
}

// ── Sistema de Tabs ───────────────────────────────────────────────────────────

function initTabs() {
  const tabBtns   = document.querySelectorAll("[role='tab']");
  const tabPanels = document.querySelectorAll("[role='tabpanel']");

  function activateTab(selectedBtn) {
    // Reseta todos os botões e painéis
    tabBtns.forEach((btn) => {
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1");
    });
    tabPanels.forEach((panel) => {
      panel.classList.remove("is-active");
    });

    // Ativa o botão e painel selecionados
    selectedBtn.setAttribute("aria-selected", "true");
    selectedBtn.setAttribute("tabindex", "0");
    const targetId = selectedBtn.getAttribute("aria-controls");
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add("is-active");
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn));

    // Navegação por teclado — WCAG 2.1 SC 2.1.1
    btn.addEventListener("keydown", (e) => {
      const btnsArray = [...tabBtns];
      const currentIndex = btnsArray.indexOf(btn);

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % btnsArray.length;
        btnsArray[nextIndex].focus();
        activateTab(btnsArray[nextIndex]);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + btnsArray.length) % btnsArray.length;
        btnsArray[prevIndex].focus();
        activateTab(btnsArray[prevIndex]);
      }
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

lucide.createIcons();
initTabs();
initPremios();
initRegulamento();

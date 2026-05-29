// ── Cidade ──
function initCidade() {
  const select = document.getElementById("city-select");
  if (!select) return;

  const option = document.createElement("option");
  option.textContent = CONFIG.cidade;
  select.appendChild(option);
}

// ── Lista de bairros ──
function formatarTaxa(taxa) {
  return taxa.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderBairros(lista) {
  const ul = document.getElementById("neighborhoods-list");
  const emptyState = document.getElementById("empty-state");
  const emptyTerm = document.getElementById("empty-term");
  const searchInput = document.getElementById("search-input");

  if (!ul) return;

  if (lista.length === 0) {
    ul.innerHTML = "";
    emptyTerm.textContent = searchInput.value;
    emptyState.style.display = "block";
    lucide.createIcons();
    return;
  }

  emptyState.style.display = "none";

  ul.innerHTML = lista.map(({ nome, taxa }) => `
    <li class="neighborhood-item">
      <span class="neighborhood-left">
        <i data-lucide="map-pin"></i>
        <span class="neighborhood-name">${nome}</span>
      </span>
      <span class="neighborhood-fee">${formatarTaxa(taxa)}</span>
    </li>
  `).join("");

  lucide.createIcons();
}

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

// ── Init ──
lucide.createIcons();
initCidade();
initBairros();
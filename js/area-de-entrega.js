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

// ── Drawer ──
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");
const menuBtn = document.getElementById("menu-btn");

function openDrawer() {
  drawer.classList.add("is-open");
  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
}

menuBtn.addEventListener("click", openDrawer);
overlay.addEventListener("click", closeDrawer);

// ── WhatsApp ──
function initWhatsapp() {
  const { numero, whatsappMensagem } = CONFIG.contato;
  const waLink = document.querySelector("[data-whatsapp]");
  if (waLink) {
    waLink.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
  }
}

// ── Init ──
lucide.createIcons();
initCidade();
initBairros();
initWhatsapp();
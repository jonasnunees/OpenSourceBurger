// ── Contato ──
function initContato() {
  const { numero, formatado, whatsappMensagem } = CONFIG.contato;

  const telLink = document.querySelector("[data-tel]");
  if (telLink) {
    telLink.href = `tel:+${numero}`;
    telLink.textContent = formatado;
  }

  const waLink = document.querySelector("[data-whatsapp]");
  if (waLink) {
    waLink.href = `https://wa.me/${numero}?text=${whatsappMensagem}`;
  }
}

// ── Endereço ──
function initEndereco() {
  const { texto, mapLink } = CONFIG.endereco;

  const enderecoLink = document.querySelector("[data-endereco]");
  if (enderecoLink) {
    enderecoLink.href = mapLink;
    enderecoLink.textContent = texto;
  }
}

// ── Tempos estimados ──
function initTempos() {
  const { entrega, retirada } = CONFIG.tempos;

  const elEntrega = document.querySelector("[data-tempo-entrega]");
  const elRetirada = document.querySelector("[data-tempo-retirada]");

  if (elEntrega) elEntrega.textContent = `${entrega} · tempo estimado de entrega`;
  if (elRetirada) elRetirada.textContent = `${retirada} · retirada e consumo no local`;
}

// ── Horário de hoje ──
function initHorarioHoje() {
  const hoje = CONFIG.horarios[new Date().getDay()];
  const el = document.querySelector("[data-horario-hoje]");

  if (el && hoje) {
    el.textContent = `Atendimento hoje das ${hoje.abertura} às ${hoje.fechamento}`;
  }
}

// ── Lista de horários no modal ──
function initHorarioModal() {
  const lista = document.getElementById("hours-list");
  if (!lista) return;

  lista.innerHTML = CONFIG.horarios.map(({ dia, abertura, fechamento }) => `
    <li>
      <span>${dia}</span>
      <span>
        <i data-lucide="clock-3"></i>
        ${abertura} – ${fechamento}
      </span>
    </li>
  `).join("");

  lucide.createIcons();
}

// ── Modal de horários ──
const modal = document.getElementById("hours-modal");

document.querySelector(".hours-link").addEventListener("click", () => {
  modal.showModal();
  requestAnimationFrame(() => modal.classList.add("is-open"));
});

document.querySelector(".modal-ok").addEventListener("click", () => {
  modal.classList.remove("is-open");
  modal.addEventListener("transitionend", () => modal.close(), { once: true });
});

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

// ── Init ──
initContato();
initEndereco();
initTempos();
initHorarioHoje();
initHorarioModal();
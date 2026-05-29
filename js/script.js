// ── Contato ──
function initContato() {
  const { numero, formatado, whatsappMensagem } = CONFIG.contato;

  const telLink = document.querySelector("[data-tel]");
  if (telLink) {
    telLink.href = `tel:+${numero}`;
    telLink.textContent = formatado;
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

// ── Verifica se está dentro do horário ──
function estaAberto() {
  const agora = new Date();
  const hoje = CONFIG.horarios[agora.getDay()];
  if (!hoje) return false;

  const [hAbre, mAbre] = hoje.abertura.split(":").map(Number);
  const [hFecha, mFecha] = hoje.fechamento.split(":").map(Number);

  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const abreMin = hAbre * 60 + mAbre;
  let fechaMin = hFecha * 60 + mFecha;

  // Lógica para horários que passam da meia-noite (ex: até as 02:00)
  if (fechaMin <= abreMin) fechaMin += 1440; 

  return agoraMin >= abreMin && agoraMin <= fechaMin;
}

// ── Modal de fechado ──
function initModalFechado() {
  if (estaAberto()) return;

  const modal = document.getElementById("closed-modal");
  const btnOk = document.getElementById("closed-ok");
  const elAbre = document.querySelector("[data-abre-hoje]");

  if (elAbre) {
    elAbre.textContent = CONFIG.horarios[new Date().getDay()].abertura;
  }

  modal.showModal();
  requestAnimationFrame(() => modal.classList.add("is-open"));

  btnOk.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.addEventListener("transitionend", () => modal.close(), { once: true });
  });
}

// ── Init ──
initContato();
initEndereco();
initTempos();
initHorarioHoje();
initHorarioModal();
initModalFechado(); // deve ser o último
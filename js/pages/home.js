/**
 * pages/home.js
 * Lógica exclusiva da página inicial (index.html).
 *
 * Responsabilidades:
 *  - Preencher dados de contato, endereço e tempos estimados
 *  - Exibir o horário de funcionamento do dia atual
 *  - Gerenciar o modal de horários
 *  - Verificar se o estabelecimento está aberto e exibir modal de aviso
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → common.js → utils/formatters.js → pages/home.js
 */

// ── Lógica de negócio ─────────────────────────────────────────────────────────

/**
 * Verifica se o estabelecimento está aberto no momento atual.
 * Suporta horários que ultrapassam a meia-noite (ex: 18:00 – 02:00).
 * @returns {boolean}
 */
function estaAberto() {
  const agora = new Date();
  const hoje  = CONFIG.horarios[agora.getDay()];
  if (!hoje) return false;

  const [hAbre,  mAbre]  = hoje.abertura.split(":").map(Number);
  const [hFecha, mFecha] = hoje.fechamento.split(":").map(Number);

  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const abreMin  = hAbre  * 60 + mAbre;
  let   fechaMin = hFecha * 60 + mFecha;

  // Ajuste para horários que passam da meia-noite
  if (fechaMin <= abreMin) fechaMin += 1440;

  return agoraMin >= abreMin && agoraMin <= fechaMin;
}

// ── Preenchimento de dados ────────────────────────────────────────────────────

/**
 * Preenche o link de telefone com o número do CONFIG.
 */
function initContato() {
  const { numero, formatado } = CONFIG.contato;
  const telLink = document.querySelector("[data-tel]");

  if (telLink) {
    telLink.href        = `tel:+${numero}`;
    telLink.textContent = formatado;
  }
}

/**
 * Preenche o link de endereço com o texto e URL do Google Maps do CONFIG.
 */
function initEndereco() {
  const { texto, mapLink } = CONFIG.endereco;
  const enderecoLink = document.querySelector("[data-endereco]");

  if (enderecoLink) {
    enderecoLink.href        = mapLink;
    enderecoLink.textContent = texto;
  }
}

/**
 * Preenche os textos de tempo estimado de entrega e retirada.
 */
function initTempos() {
  const { entrega, retirada } = CONFIG.tempos;

  const elEntrega  = document.querySelector("[data-tempo-entrega]");
  const elRetirada = document.querySelector("[data-tempo-retirada]");

  if (elEntrega)  elEntrega.textContent  = `${entrega} · tempo estimado de entrega`;
  if (elRetirada) elRetirada.textContent = `${retirada} · retirada e consumo no local`;
}

/**
 * Exibe o horário de hoje na faixa de funcionamento da home.
 */
function initHorarioHoje() {
  const hoje = CONFIG.horarios[new Date().getDay()];
  const el   = document.querySelector("[data-horario-hoje]");

  if (el && hoje) {
    el.textContent = `Atendimento hoje das ${hoje.abertura} às ${hoje.fechamento}`;
  }
}

// ── Modais ────────────────────────────────────────────────────────────────────

/**
 * Inicializa o modal de horários completos da semana.
 * Preenche a lista e configura abertura/fechamento.
 */
function initModalHorarios() {
  const lista   = document.getElementById("hours-list");
  const modal   = document.getElementById("hours-modal");
  const openBtn = document.querySelector(".hours-link");
  const okBtn   = document.querySelector(".modal-ok");

  if (!modal || !openBtn) return;

  // Preenche a lista de horários da semana
  if (lista) {
    lista.innerHTML = CONFIG.horarios
      .map(
        ({ dia, abertura, fechamento }) => `
          <li>
            <span>${dia}</span>
            <span>
              <i data-lucide="clock-3"></i>
              ${abertura} – ${fechamento}
            </span>
          </li>`
      )
      .join("");

    lucide.createIcons();
  }

  openBtn.addEventListener("click", () => {
    modal.showModal();
    requestAnimationFrame(() => modal.classList.add("is-open"));
  });

  okBtn?.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.addEventListener("transitionend", () => modal.close(), { once: true });
  });
}

/**
 * Exibe o modal de "estabelecimento fechado" se fora do horário.
 * Deve ser chamado por último para não bloquear o carregamento da página.
 */
function initModalFechado() {
  if (estaAberto()) return;

  const modal  = document.getElementById("closed-modal");
  const btnOk  = document.getElementById("closed-ok");
  const elAbre = document.querySelector("[data-abre-hoje]");

  if (!modal) return;

  if (elAbre) {
    elAbre.textContent = CONFIG.horarios[new Date().getDay()].abertura;
  }

  modal.showModal();
  requestAnimationFrame(() => modal.classList.add("is-open"));

  btnOk?.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.addEventListener("transitionend", () => modal.close(), { once: true });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
initContato();
initEndereco();
initTempos();
initHorarioHoje();
initModalHorarios();
initModalFechado(); // deve ser o último — exibe modal de aviso se fechado

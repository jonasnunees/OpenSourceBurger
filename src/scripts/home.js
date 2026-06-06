/**
 * pages/home.js
 * Lógica exclusiva da página inicial (index.html).
 *
 * Responsabilidades:
 * - Preencher dados de contato, endereço e tempos estimados
 * - Exibir o horário de funcionamento do dia atual
 * - Verificar se o estabelecimento está aberto
 * - Exibir modal de aviso quando a loja estiver fechada
 *
 * Dependências (nesta ordem no HTML):
 * config.js → common.js → utils/formatters.js → pages/home.js
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const TEL_SELECTOR = "[data-tel]";
const ADDRESS_SELECTOR = "[data-endereco]";
const DELIVERY_TIME_SELECTOR = "[data-tempo-entrega]";
const PICKUP_TIME_SELECTOR = "[data-tempo-retirada]";
const TODAY_HOURS_SELECTOR = "[data-horario-hoje]";
const TODAY_OPENING_SELECTOR = "[data-abre-hoje]";

const CLOSED_MODAL_ID = "closed-modal";
const CLOSED_OK_BUTTON_ID = "closed-ok";

// ── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Retorna o horário de funcionamento do dia atual.
 *
 * A ordem de CONFIG.horarios segue o padrão do JavaScript:
 * 0 = Domingo, 1 = Segunda, ..., 6 = Sábado.
 *
 * @returns {{ dia: string, abertura: string, fechamento: string } | undefined}
 */
function getHorarioHoje() {
  return CONFIG.horarios[new Date().getDay()];
}

/**
 * Abre um modal do tipo dialog com animação.
 *
 * @param {HTMLDialogElement} modal
 */
function openModal(modal) {
  modal.showModal();

  requestAnimationFrame(() => {
    modal.classList.add("is-open");
  });
}

/**
 * Fecha um modal do tipo dialog respeitando a transição CSS.
 *
 * @param {HTMLDialogElement} modal
 */
function closeModal(modal) {
  modal.classList.remove("is-open");

  modal.addEventListener("transitionend", () => modal.close(), { once: true });
}

// ── Preenchimento de dados ─────────────────────────────────────────────────

/**
 * Preenche o link de telefone com o número definido no CONFIG.
 */
function initContato() {
  const { numero, formatado } = CONFIG.contato;
  const telLink = document.querySelector(TEL_SELECTOR);

  if (!telLink) return;

  telLink.href = `tel:+${numero}`;
  telLink.textContent = formatado;
}

/**
 * Preenche o link de endereço com o texto e URL do Google Maps definidos no CONFIG.
 */
function initEndereco() {
  const { texto, mapLink } = CONFIG.endereco;
  const enderecoLink = document.querySelector(ADDRESS_SELECTOR);

  if (!enderecoLink) return;

  enderecoLink.href = mapLink;
  enderecoLink.textContent = texto;
}

/**
 * Preenche os textos de tempo estimado de entrega e retirada.
 */
function initTempos() {
  const { entrega, retirada } = CONFIG.tempos;

  const deliveryTimeElement = document.querySelector(DELIVERY_TIME_SELECTOR);
  const pickupTimeElement = document.querySelector(PICKUP_TIME_SELECTOR);

  if (deliveryTimeElement) {
    deliveryTimeElement.textContent = `${entrega} · tempo estimado de entrega`;
  }

  if (pickupTimeElement) {
    pickupTimeElement.textContent = `${retirada} · retirada e consumo no local`;
  }
}

/**
 * Exibe o horário de funcionamento do dia atual na home.
 */
function initHorarioHoje() {
  const horarioHoje = getHorarioHoje();
  const todayHoursElement = document.querySelector(TODAY_HOURS_SELECTOR);

  if (!todayHoursElement || !horarioHoje) return;

  todayHoursElement.textContent = `Atendimento hoje das ${horarioHoje.abertura} às ${horarioHoje.fechamento}`;
}

// ── Modal de loja fechada ──────────────────────────────────────────────────

/**
 * Exibe o modal de "estabelecimento fechado" se estiver fora do horário.
 *
 * A verificação de loja aberta usa Store.isOpen(), centralizada no common.js.
 * Assim evitamos duplicar regra de horário em mais de um arquivo.
 */
function initModalFechado() {
  if (Store.isOpen()) return;

  const modal = document.getElementById(CLOSED_MODAL_ID);
  const okButton = document.getElementById(CLOSED_OK_BUTTON_ID);
  const todayOpeningElement = document.querySelector(TODAY_OPENING_SELECTOR);
  const horarioHoje = getHorarioHoje();

  if (!modal) return;

  if (todayOpeningElement && horarioHoje) {
    todayOpeningElement.textContent = horarioHoje.abertura;
  }

  openModal(modal);

  okButton?.addEventListener("click", () => {
    closeModal(modal);
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

initContato();
initEndereco();
initTempos();
initHorarioHoje();

// Deve ser o último para não bloquear o carregamento dos dados da página.
initModalFechado();
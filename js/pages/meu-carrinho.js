/**
 * pages/meu-carrinho.js
 * Lógica para a página de carrinho vazio e informações da loja.
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

  if (fechaMin <= abreMin) fechaMin += 1440;
  return agoraMin >= abreMin && agoraMin <= fechaMin;
}

function initStatusLoja() {
  const isAberto = estaAberto();
  const badge = document.getElementById('status-badge');
  const text = document.getElementById('status-text');
  const hoje = CONFIG.horarios[new Date().getDay()];
  const elHorario = document.querySelector('[data-horario-hoje]');

  if (badge && text) {
    if (isAberto) {
      badge.classList.remove('closed');
      badge.classList.add('open');
      text.textContent = 'Delivery Online - ABERTO';
    } else {
      badge.classList.add('closed');
      text.textContent = 'Delivery Online - FECHADO';
    }
  }

  if (elHorario && hoje) {
    elHorario.textContent = `Atendimento hoje das ${hoje.abertura} às ${hoje.fechamento} horas.`;
  }
}

function initTemposEstimados() {
  const elEntrega = document.querySelector('[data-tempo-entrega]');
  const elRetirada = document.querySelector('[data-tempo-retirada]');
  
  if (elEntrega) elEntrega.textContent = `${CONFIG.tempos.entrega} - Tempo estimado para entrega`;
  if (elRetirada) elRetirada.textContent = `${CONFIG.tempos.retirada} - Tempo estimado para retirada`;
}

function initModalHorarios() {
  const modal = document.getElementById('hours-modal');
  const btnOpen = document.getElementById('open-hours-btn');
  const btnOk = modal?.querySelector('.modal-ok');
  const lista = document.getElementById('hours-list');

  if (!modal || !btnOpen) return;

  if (lista) {
    lista.innerHTML = CONFIG.horarios.map(h => `
      <li>
        <span>${h.dia}</span>
        <span><i data-lucide="clock-3"></i> ${h.abertura} – ${h.fechamento}</span>
      </li>
    `).join('');
    lucide.createIcons();
  }

  btnOpen.addEventListener('click', () => {
    modal.showModal();
    requestAnimationFrame(() => modal.classList.add('is-open'));
  });

  btnOk?.addEventListener('click', () => {
    modal.classList.remove('is-open');
    modal.addEventListener('transitionend', () => modal.close(), { once: true });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStatusLoja();
  initTemposEstimados();
  initModalHorarios();
});
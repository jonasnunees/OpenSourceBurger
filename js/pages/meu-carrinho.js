/**
 * pages/meu-carrinho.js
 * Lógica para a página de carrinho vazio e informações da loja.
 */

function initStatusLoja() {
  // Agora consome a lógica centralizada no Store util do common.js
  const isAberto = Store.isOpen();
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

document.addEventListener('DOMContentLoaded', () => {
  initStatusLoja();
  initTemposEstimados();
});
/**
 * pedido-confirmado.js
 * Exibe o comprovante temporario do pedido recem-finalizado.
 *
 * Dependencias: config.js, auth.js, lucide, common.js
 */

(function () {
  "use strict";

  const CONFIRM_KEY = "osb_pedido_confirmado";

  const contentEl = document.getElementById("confirmado-content");
  const emptyEl = document.getElementById("confirmado-empty");

  const codigoEl = document.getElementById("pedido-codigo");
  const clienteEl = document.getElementById("pedido-cliente");
  const modalidadeEl = document.getElementById("pedido-modalidade");
  const enderecoRowEl = document.getElementById("pedido-endereco-row");
  const enderecoEl = document.getElementById("pedido-endereco");
  const pagamentoEl = document.getElementById("pedido-pagamento");
  const descontoRowEl = document.getElementById("pedido-desconto-row");
  const descontoEl = document.getElementById("pedido-desconto");
  const totalEl = document.getElementById("pedido-total");
  const whatsappEl = document.getElementById("pedido-whatsapp");

  function lerConfirmacao() {
    try {
      const raw = sessionStorage.getItem(CONFIRM_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function preencherTexto(element, value, fallback = "—") {
    if (!element) return;
    element.textContent = value || fallback;
  }

  function montarMensagemWhatsapp(pedido) {
    const linhas = [
      `Olá! Acabei de finalizar o pedido ${pedido.codigo}.`,
      `Nome: ${pedido.clienteNome || "Visitante"}`,
      `Modalidade: ${pedido.modalidade || "—"}`,
      `Total: ${formatarMoeda(pedido.total)}`,
    ];

    if (pedido.endereco) {
      linhas.splice(3, 0, `Endereço: ${pedido.endereco}`);
    }

    return encodeURIComponent(linhas.join("\n"));
  }

  function configurarWhatsapp(pedido) {
    if (!whatsappEl) return;

    const numero = CONFIG.contato?.numero;
    const mensagem = montarMensagemWhatsapp(pedido);

    whatsappEl.href = `https://wa.me/${numero}?text=${mensagem}`;
  }

  function exibirConfirmacao(pedido) {
    preencherTexto(codigoEl, pedido.codigo);
    preencherTexto(clienteEl, pedido.clienteNome);
    preencherTexto(modalidadeEl, pedido.modalidade);
    preencherTexto(pagamentoEl, pedido.pagamento);
    preencherTexto(totalEl, formatarMoeda(pedido.total));

    if (pedido.endereco) {
      enderecoRowEl.hidden = false;
      preencherTexto(enderecoEl, pedido.endereco);
    }

    if (Number(pedido.desconto) > 0) {
      descontoRowEl.hidden = false;
      const labelCupom = pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : "";
      preencherTexto(descontoEl, `- ${formatarMoeda(pedido.desconto)}${labelCupom}`);
    }

    configurarWhatsapp(pedido);
  }

  function exibirVazio() {
    if (contentEl) contentEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
  }

  function init() {
    const pedido = lerConfirmacao();

    if (!pedido?.codigo) {
      exibirVazio();
    } else {
      exibirConfirmacao(pedido);
    }

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

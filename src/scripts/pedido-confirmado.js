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
  const bandeiraRowEl = document.getElementById("pedido-bandeira-row");
  const bandeiraEl = document.getElementById("pedido-bandeira");
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

  function obterPrimeiroNome(nome) {
    return String(nome || "Cliente").trim().split(/\s+/)[0] || "Cliente";
  }

  function formatarPersonalizacao(descPersonalizacao) {
    if (!descPersonalizacao) return [];

    return String(descPersonalizacao)
      .split(" · ")
      .flatMap((grupo) => {
        const [titulo, valores] = grupo.split(":").map((parte) => parte?.trim());
        if (!titulo || !valores) return [];

        const itens = valores
          .split(",")
          .map((valor) => valor.trim())
          .filter(Boolean);

        const tituloFormatado = titulo === "Tamanho" ? "Tamanhos" : titulo;

        return [
          tituloFormatado,
          ...itens.map((item) => `1x ${item}`),
        ];
      });
  }

  function obterItensPedido(pedido) {
    if (Array.isArray(pedido.itensResumo) && pedido.itensResumo.length) {
      return pedido.itensResumo;
    }

    return Object.values(pedido.itens || {});
  }

  function montarLinhasProdutos(pedido) {
    const itens = obterItensPedido(pedido);
    const linhas = ["Produtos", ""];

    itens.forEach((item, index) => {
      const subtotal = Number(item.subtotal) || calcularSubtotalItem(item);
      linhas.push(`${formatarMoeda(subtotal)} ${item.qty}x ${item.nome}`);
      linhas.push(...formatarPersonalizacao(item.descPersonalizacao));

      if (index < itens.length - 1) {
        linhas.push("");
      }
    });

    if (!itens.length) {
      linhas.push("Itens do pedido não disponíveis nesta confirmação.");
    }

    return linhas;
  }

  function calcularSubtotalItem(item) {
    const match = String(item.preco).match(/[\d]+[,.][\d]{2}/);
    const preco = match ? parseFloat(match[0].replace(",", ".")) : 0;
    return preco * Number(item.qty || 0);
  }

  function normalizarPagamento(pagamento) {
    return String(pagamento || "—")
      .replace(" (Entregador)", "")
      .replace(" (R$)", "")
      .replace("Cartão de ", "");
  }

  function formatarBandeira(bandeira, bandeiraLabel) {
    if (bandeiraLabel) return bandeiraLabel;

    const bandeiras = {
      visa: "Visa",
      mastercard: "Mastercard",
      elo: "Elo",
      hipercard: "Hipercard",
      amex: "American Express",
      cabal: "Cabal",
    };

    return bandeiras[bandeira] || bandeira;
  }

  function montarLinhasTotais(pedido) {
    const linhas = [
      "---",
      "",
      `${formatarMoeda(pedido.subtotal)} Total dos produtos`,
    ];

    if (Number(pedido.taxaEntrega) > 0) {
      linhas.push(`${formatarMoeda(pedido.taxaEntrega)} Taxa de entrega`);
    }

    if (Number(pedido.desconto) > 0) {
      const labelCupom = pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : "";
      linhas.push(`- ${formatarMoeda(pedido.desconto)} Desconto${labelCupom}`);
    }

    linhas.push(`${formatarMoeda(pedido.total)} Total`);
    linhas.push(`Forma de pagamento: ${normalizarPagamento(pedido.pagamento)}`);

    if (pedido.bandeira || pedido.bandeiraLabel) {
      linhas.push(`Bandeira do cartão: ${formatarBandeira(pedido.bandeira, pedido.bandeiraLabel)}`);
    }

    linhas.push("O seu pedido ainda não foi pago.");

    return linhas;
  }

  function montarLinhasEndereco(pedido) {
    const endereco = pedido.enderecoDados;
    if (!endereco && !pedido.endereco) return [];

    const linhas = [
      "",
      "---",
      "",
      `Nome: ${pedido.clienteNome || "Cliente"}`,
    ];

    if (!endereco) {
      linhas.push(`Endereço: ${pedido.endereco}`);
      return linhas;
    }

    if (endereco.bairro) linhas.push(`Bairro: ${String(endereco.bairro).toUpperCase()}`);
    if (endereco.endereco) linhas.push(`Rua: ${endereco.endereco}`);
    if (endereco.numero) linhas.push(`Número: ${endereco.numero}`);
    if (endereco.complemento) linhas.push(`Complemento: ${endereco.complemento}`);
    if (endereco.referencia) linhas.push(`Ponto de referência: ${endereco.referencia}`);

    return linhas;
  }

  function montarLinhasRetiradaOuLocal(pedido) {
    return [
      "",
      "---",
      "",
      `Nome: ${pedido.clienteNome || "Cliente"}`,
      `Modalidade: ${pedido.modalidade || "—"}`,
    ];
  }

  function temEnderecoPedido(pedido) {
    return Boolean(pedido.enderecoDados || pedido.endereco);
  }

  function montarMensagemWhatsappVisitante(pedido) {
    const linhas = [
      `Olá ${obterPrimeiroNome(pedido.clienteNome)}, seu pedido foi confirmado e está sendo preparado.`,
      "",
      `Pedido: ${pedido.codigo}`,
      "",
      ...montarLinhasProdutos(pedido),
      "",
      ...montarLinhasTotais(pedido),
    ];

    linhas.push(...(temEnderecoPedido(pedido)
      ? montarLinhasEndereco(pedido)
      : montarLinhasRetiradaOuLocal(pedido)));

    linhas.push("", "Crie sua conta nos próximos pedidos para acumular pontos de fidelidade.");

    return linhas.join("\n");
  }

  function montarMensagemWhatsappClienteCadastrado(pedido) {
    const linhas = [
      `Olá ${obterPrimeiroNome(pedido.clienteNome)}, seu pedido foi confirmado e está sendo preparado.`,
      "",
      `Pedido: ${pedido.codigo}`,
      "",
      ...montarLinhasProdutos(pedido),
      "",
      ...montarLinhasTotais(pedido),
    ];

    linhas.push(...(temEnderecoPedido(pedido)
      ? montarLinhasEndereco(pedido)
      : montarLinhasRetiradaOuLocal(pedido)));

    return linhas.join("\n");
  }

  function montarMensagemWhatsapp(pedido) {
    const mensagem = pedido.tipoCliente === "visitante"
      ? montarMensagemWhatsappVisitante(pedido)
      : montarMensagemWhatsappClienteCadastrado(pedido);

    return encodeURIComponent(mensagem);
  }

  function salvarMensagemNoPedido(pedido) {
    const mensagem = pedido.tipoCliente === "visitante"
      ? montarMensagemWhatsappVisitante(pedido)
      : montarMensagemWhatsappClienteCadastrado(pedido);

    try {
      sessionStorage.setItem(CONFIRM_KEY, JSON.stringify({
        ...pedido,
        mensagemWhatsapp: mensagem,
      }));
    } catch {
      return;
    }
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

    if (pedido.bandeira || pedido.bandeiraLabel) {
      bandeiraRowEl.hidden = false;
      preencherTexto(bandeiraEl, formatarBandeira(pedido.bandeira, pedido.bandeiraLabel));
    }

    if (Number(pedido.desconto) > 0) {
      descontoRowEl.hidden = false;
      const labelCupom = pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : "";
      preencherTexto(descontoEl, `- ${formatarMoeda(pedido.desconto)}${labelCupom}`);
    }

    configurarWhatsapp(pedido);
    salvarMensagemNoPedido(pedido);
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

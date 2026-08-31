/**
 * finalizar-pedido.js
 * Script da página de finalização de pedido (retirada e consumo no local).
 *
 * Responsabilidades:
 * - Valida presença de cliente (visitante ou usuário logado) e modalidade
 * - Redireciona para o início do fluxo se dados estiverem ausentes
 * - Preenche o label e ícone da modalidade escolhida
 * - Calcula e exibe o resumo do carrinho (itens + total)
 * - Contador de caracteres do textarea de observações
 * - Monta e envia o pedido ao clicar em "Finalizar Pedido"
 *   (TODO: integrar com Supabase — hoje apenas exibe um alerta)
 *
 * Dependências: config.js, auth.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const GUEST_KEY      = "osb_guest";
  const MODALIDADE_KEY = "osb_modalidade";
  const CONFIRM_KEY    = "osb_pedido_confirmado";
  const FLUXO_INICIO   = "escolher-modalidade.html";
  const MAX_OBS        = 300;

  /**
   * Ícone Lucide associado a cada modalidade.
   * Mantido aqui para não depender de dados externos ao JS.
   */
  const ICONES_MODALIDADE = {
    retirada: "store",
    local:    "utensils",
  };

  // ── Elementos ───────────────────────────────────────────────────────────

  const labelModalidade  = document.getElementById("label-modalidade");
  const iconeModalidade  = document.getElementById("icone-modalidade");
  const resumoValorItens = document.getElementById("resumo-valor-itens");
  const resumoTotal      = document.getElementById("resumo-total");
  const textarea         = document.getElementById("observacoes");
  const obsContador      = document.getElementById("obs-contador");
  const btnFinalizar     = document.getElementById("btn-finalizar");

  // ── Sessão ──────────────────────────────────────────────────────────────

  /**
   * Lê e parseia um item do sessionStorage com segurança.
   *
   * @param {string} key
   * @returns {object|null}
   */
  function lerSessao(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Valida que os dados necessários estão no sessionStorage.
   * Se ausentes, redireciona para o início do fluxo.
   *
   * O cliente pode vir do checkout como visitante (osb_guest) ou da sessão
   * autenticada. A modalidade (osb_modalidade) é obrigatória pois define
   * o que exibir.
   *
   * @returns {{ cliente: object, guest: object|null, usuario: object|null, modalidade: object } | null}
   */
  function validarSessao() {
    const guest      = lerSessao(GUEST_KEY);
    const usuario    = Auth.getSession?.() ?? null;
    const modalidade = lerSessao(MODALIDADE_KEY);
    const cliente    = guest ?? usuario;

    if (!cliente || !modalidade) {
      window.location.replace(FLUXO_INICIO);
      return null;
    }

    return { cliente, guest, usuario, modalidade };
  }

  // ── Modalidade ──────────────────────────────────────────────────────────

  /**
   * Preenche o label e o ícone da modalidade escolhida.
   * O ícone é atualizado via data-lucide e re-renderizado pelo Lucide.
   *
   * @param {{ valor: string, label: string }} modalidade
   */
  function preencherModalidade(modalidade) {
    if (labelModalidade) {
      labelModalidade.textContent = modalidade.label;
    }

    if (iconeModalidade) {
      const icone = ICONES_MODALIDADE[modalidade.valor] ?? "package";
      iconeModalidade.setAttribute("data-lucide", icone);
      lucide.createIcons({ nodes: [iconeModalidade] });
    }
  }

  // ── Resumo do carrinho ──────────────────────────────────────────────────

  /**
   * Parseia preço de string para número.
   * Reutiliza a mesma lógica de meu-carrinho.js para consistência.
   *
   * @param {string} precoStr
   * @returns {number}
   */
  function parsePreco(precoStr) {
    const match = String(precoStr).match(/[\d]+[,.][\d]{2}/);
    return match ? parseFloat(match[0].replace(",", ".")) : 0;
  }

  /**
   * Formata número para moeda BRL.
   *
   * @param {number} valor
   * @returns {string}
   */
  function formatarPreco(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getAppliedCoupon() {
    const key = CONFIG.settings?.appliedCouponSessionKey || "osb_applied_coupon";

    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function calcularDesconto(subtotal, coupon) {
    if (!coupon || subtotal <= 0) return 0;

    const discountValue = Number(coupon.discountValue) || 0;
    const maxDiscountValue = Number(coupon.maxDiscountValue) || 0;

    if (coupon.discountType === "fixed") {
      return Math.min(discountValue, subtotal);
    }

    const percentual = Math.min(discountValue, 100);
    const desconto = subtotal * (percentual / 100);

    if (maxDiscountValue > 0) {
      return Math.min(desconto, maxDiscountValue, subtotal);
    }

    return Math.min(desconto, subtotal);
  }

  function calcularTotais(itens) {
    const subtotal = Object.values(itens).reduce((total, { preco, qty }) => {
      return total + parsePreco(preco) * qty;
    }, 0);

    const cupom = getAppliedCoupon();
    const desconto = calcularDesconto(subtotal, cupom);

    return {
      subtotal,
      taxaEntrega: 0,
      desconto,
      total: Math.max(subtotal - desconto, 0),
      cupom,
    };
  }

  /**
   * Calcula e exibe o resumo do carrinho na página.
   * Redireciona para o carrinho se estiver vazio —
   * não faz sentido finalizar sem itens.
   */
  function preencherResumo() {
    const itens = Cart.get();

    if (Object.keys(itens).length === 0) {
      window.location.replace("meu-carrinho.html");
      return;
    }

    const { subtotal, total } = calcularTotais(itens);

    if (resumoValorItens) resumoValorItens.textContent = formatarPreco(subtotal);
    if (resumoTotal)      resumoTotal.textContent      = formatarPreco(total);
  }

  // ── Contador de observações ─────────────────────────────────────────────

  function initContador() {
    if (!textarea || !obsContador) return;

    function atualizar() {
      const atual = textarea.value.length;
      obsContador.textContent = `${atual} / ${MAX_OBS}`;
    }

    textarea.addEventListener("input", atualizar);
    atualizar(); // estado inicial
  }

  // ── Finalizar pedido ────────────────────────────────────────────────────

  /**
   * Monta o objeto do pedido consolidando todos os dados da sessão.
   *
   * @param {{ cliente: object, guest: object|null, usuario: object|null, modalidade: object }} sessao
   * @returns {object}
   */
  function montarPedido(sessao) {
    const itens = Cart.get();
    const totais = calcularTotais(itens);

    return {
      codigo:       gerarCodigoPedido(),
      cliente:      sessao.cliente,
      tipoCliente:  sessao.usuario ? "cadastrado" : "visitante",
      visitante:    sessao.guest,
      modalidade:   sessao.modalidade,
      pagamento:    "Pagar no estabelecimento",
      observacoes:  textarea?.value.trim() ?? "",
      itens,
      subtotal:     totais.subtotal,
      taxaEntrega:  totais.taxaEntrega,
      desconto:     totais.desconto,
      total:        totais.total,
      cupom:        totais.cupom,
      criadoEm:     new Date().toISOString(),
    };
  }

  function gerarCodigoPedido() {
    const data = new Date();
    const dia = data.toISOString().slice(2, 10).replace(/-/g, "");
    const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `OSB-${dia}-${aleatorio}`;
  }

  function montarRegistroVisitante(pedido) {
    return {
      codigo: pedido.codigo,
      cliente_nome: pedido.visitante.nome,
      cliente_telefone: pedido.visitante.telefone,
      modalidade: pedido.modalidade.valor,
      endereco: null,
      pagamento: pedido.pagamento,
      bandeira: null,
      observacoes: pedido.observacoes || null,
      itens: pedido.itens,
      subtotal: pedido.subtotal,
      taxa_entrega: pedido.taxaEntrega,
      desconto: pedido.desconto,
      total: pedido.total,
      cupom_codigo: pedido.cupom?.code ?? null,
      origem: "site",
    };
  }

  function montarRegistroClienteCadastrado(pedido) {
    return {
      user_id: pedido.cliente.id,
      codigo: pedido.codigo,
      status: "pendente",
      modalidade: pedido.modalidade.valor,
      endereco: null,
      pagamento: pedido.pagamento,
      bandeira: null,
      observacoes: pedido.observacoes || null,
      itens: pedido.itens,
      subtotal: pedido.subtotal,
      taxa_entrega: pedido.taxaEntrega,
      desconto: pedido.desconto,
      total: pedido.total,
      cupom_codigo: pedido.cupom?.code ?? null,
      origem: "site",
    };
  }

  async function salvarPedidoVisitante(pedido) {
    if (pedido.tipoCliente !== "visitante") return;

    const { error } = await SupabaseClient
      .from("pedidos_visitantes")
      .insert(montarRegistroVisitante(pedido));

    if (error) throw error;
  }

  async function salvarPedidoClienteCadastrado(pedido) {
    if (pedido.tipoCliente !== "cadastrado") return;

    const { error } = await SupabaseClient
      .from("pedidos")
      .insert(montarRegistroClienteCadastrado(pedido));

    if (error) throw error;
  }

  async function salvarPedido(pedido) {
    if (pedido.tipoCliente === "visitante") {
      await salvarPedidoVisitante(pedido);
      return;
    }

    await salvarPedidoClienteCadastrado(pedido);
  }

  function montarItensConfirmacao(itens) {
    return Object.entries(itens).map(([id, item]) => ({
      id,
      nome: item.nome,
      preco: item.preco,
      qty: item.qty,
      categoriaNome: item.categoriaNome,
      descPersonalizacao: item.descPersonalizacao || "",
    }));
  }

  function salvarConfirmacao(pedido) {
    sessionStorage.setItem(CONFIRM_KEY, JSON.stringify({
      codigo: pedido.codigo,
      tipoCliente: pedido.tipoCliente,
      clienteNome: pedido.cliente.nome ?? pedido.cliente.name ?? "",
      modalidade: pedido.modalidade.label,
      pagamento: pedido.pagamento,
      bandeira: null,
      bandeiraLabel: null,
      endereco: null,
      enderecoDados: null,
      itens: pedido.itens,
      itensResumo: montarItensConfirmacao(pedido.itens),
      subtotal: pedido.subtotal,
      taxaEntrega: pedido.taxaEntrega,
      desconto: pedido.desconto,
      total: pedido.total,
      cupomCodigo: pedido.cupom?.code ?? null,
      criadoEm: pedido.criadoEm,
    }));
  }

  function limparCupomAplicado() {
    const key = CONFIG.settings?.appliedCouponSessionKey || "osb_applied_coupon";
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }

  /**
   * Limpa os dados de sessão do checkout após confirmação.
   * O carrinho é limpo via Cart.clear() que já sincroniza os badges.
   */
  function limparSessaoCheckout() {
    sessionStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(MODALIDADE_KEY);
    limparCupomAplicado();
    Cart.clear();
  }

  function handleFinalizar(sessao) {
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener("click", async () => {
      const pedido = montarPedido(sessao);

      btnFinalizar.disabled = true;
      btnFinalizar.innerHTML = "Enviando pedido...";

      try {
        await salvarPedido(pedido);
        salvarConfirmacao(pedido);
        limparSessaoCheckout();

        window.location.href = "pedido-confirmado.html";
      } catch (error) {
        console.error("[OSB] Erro ao salvar pedido:", error);
        alert("Não foi possível enviar seu pedido agora. Tente novamente.");
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = '<i data-lucide="circle-check-big" aria-hidden="true"></i>Finalizar Pedido';
        if (typeof lucide !== "undefined") {
          lucide.createIcons({ nodes: btnFinalizar.querySelectorAll("i[data-lucide]") });
        }
      }
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────

  function init() {
    const sessao = validarSessao();
    if (!sessao) return; // redirecionamento já disparado

    preencherModalidade(sessao.modalidade);
    preencherResumo();
    initContador();
    handleFinalizar(sessao);
  }

  document.addEventListener("DOMContentLoaded", init);
})();

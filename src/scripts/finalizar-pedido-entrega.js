/**
 * finalizar-pedido-entrega.js
 * Script da página de finalização para entrega em domicílio.
 *
 * Responsabilidades:
 * - Exibe o endereço resumido via osb_endereco do sessionStorage
 * - Gerencia seleção de forma de pagamento e bandeira
 * - Habilita/desabilita select de bandeira conforme pagamento
 * - Calcula resumo: subtotal itens + taxa de entrega do bairro
 * - Abre modal de aviso ao clicar em "Cadastrar Novo Endereço"
 * - Valida sessão e pagamento apenas no momento de finalizar
 * - Monta e envia o pedido ao confirmar
 *
 * Estratégia de validação de sessão:
 * A validação NÃO bloqueia o init() — toda a UI é inicializada
 * normalmente. A sessão é verificada apenas no clique de finalizar,
 * evitando que um redirecionamento precoce impeça listeners de serem
 * registrados (select de pagamento, modal, etc).
 *
 * Dependências: config.js, auth.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const GUEST_KEY      = "osb_guest";
  const MODALIDADE_KEY = "osb_modalidade";
  const ENDERECO_KEY   = "osb_endereco";
  const CONFIRM_KEY    = "osb_pedido_confirmado";
  const FLUXO_INICIO   = "escolher-modalidade.html";
  const MAX_OBS        = 300;

  const PAGAMENTOS_COM_BANDEIRA = new Set(["credito", "debito"]);

  // ── Elementos ───────────────────────────────────────────────────────────

  const enderecoTexto    = document.getElementById("endereco-texto");
  const selectPagamento  = document.getElementById("forma-pagamento");
  const selectBandeira   = document.getElementById("bandeira");
  const bandeiraDica     = document.getElementById("bandeira-dica");
  const pagamentoError   = document.getElementById("pagamento-error");
  const resumoValorItens = document.getElementById("resumo-valor-itens");
  const resumoTaxa       = document.getElementById("resumo-taxa");
  const resumoTotal      = document.getElementById("resumo-total");
  const textarea         = document.getElementById("observacoes");
  const obsContador      = document.getElementById("obs-contador");
  const btnFinalizar     = document.getElementById("btn-finalizar");
  const btnNovoEndereco  = document.getElementById("btn-novo-endereco");
  const cadastroModal    = document.getElementById("cadastro-modal");
  const cadastroModalOk  = document.getElementById("cadastro-modal-ok");

  // ── Sessão ──────────────────────────────────────────────────────────────

  function lerSessao(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Lê os dados de sessão sem redirecionar.
   * Retorna null para dados ausentes — cada função consumidora
   * trata a ausência graciosamente (exibe "—", R$ 0,00, etc).
   *
   * @returns {{ cliente: object|null, guest: object|null, usuario: object|null, modalidade: object|null, endereco: object|null }}
   */
  function lerDadosSessao() {
    const guest   = lerSessao(GUEST_KEY);
    const usuario = Auth.getSession?.() ?? null;

    return {
      cliente:    guest ?? usuario,
      guest,
      usuario,
      modalidade: lerSessao(MODALIDADE_KEY),
      endereco:   lerSessao(ENDERECO_KEY),
    };
  }

  // ── Endereço resumido ────────────────────────────────────────────────────

  function formatarEnderecoResumido(endereco) {
    const { endereco: rua, numero, bairro, cidade, complemento } = endereco;
    const partes = [`${rua}, ${numero}`];
    if (complemento) partes.push(complemento);
    partes.push(`${bairro} - ${cidade}`);
    return partes.join(", ");
  }

  function preencherEndereco(endereco) {
    if (!enderecoTexto) return;
    enderecoTexto.textContent = endereco
      ? formatarEnderecoResumido(endereco)
      : "Nenhum endereço informado";
  }

  // ── Resumo financeiro ────────────────────────────────────────────────────

  function parsePreco(precoStr) {
    const match = String(precoStr).match(/[\d]+[,.][\d]{2}/);
    return match ? parseFloat(match[0].replace(",", ".")) : 0;
  }

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

  function calcularTotais(itens, endereco) {
    const subtotal = Object.values(itens).reduce((total, { preco, qty }) => {
      return total + parsePreco(preco) * qty;
    }, 0);

    const taxaEntrega = Number(endereco?.taxa) || 0;
    const cupom = getAppliedCoupon();
    const desconto = calcularDesconto(subtotal, cupom);

    return {
      subtotal,
      taxaEntrega,
      desconto,
      total: Math.max(subtotal + taxaEntrega - desconto, 0),
      cupom,
    };
  }

  function preencherResumo(endereco) {
    const itens = Cart.get();
    const { subtotal, taxaEntrega, total } = calcularTotais(itens, endereco);

    if (resumoValorItens) resumoValorItens.textContent = formatarPreco(subtotal);
    if (resumoTaxa)       resumoTaxa.textContent       = formatarPreco(taxaEntrega);
    if (resumoTotal)      resumoTotal.textContent      = formatarPreco(total);
  }

  // ── Forma de pagamento e bandeira ────────────────────────────────────────

  function atualizarBandeira() {
    const precisaBandeira = PAGAMENTOS_COM_BANDEIRA.has(selectPagamento.value);

    selectBandeira.disabled = !precisaBandeira;
    selectBandeira.setAttribute("aria-disabled", String(!precisaBandeira));

    if (!precisaBandeira) selectBandeira.value = "";

    if (bandeiraDica) {
      bandeiraDica.textContent = precisaBandeira
        ? "Selecione a bandeira do cartão"
        : "Selecione crédito ou débito para escolher a bandeira";
    }
  }

  function validarPagamento() {
    if (!selectPagamento.value) {
      selectPagamento.setAttribute("aria-invalid", "true");
      if (pagamentoError) pagamentoError.textContent = "Selecione a forma de pagamento.";
      return false;
    }

    if (PAGAMENTOS_COM_BANDEIRA.has(selectPagamento.value) && !selectBandeira.value) {
      selectPagamento.setAttribute("aria-invalid", "false");
      selectBandeira.setAttribute("aria-invalid", "true");
      if (pagamentoError) pagamentoError.textContent = "Selecione a bandeira do cartão.";
      return false;
    }

    selectPagamento.setAttribute("aria-invalid", "false");
    selectBandeira.setAttribute("aria-invalid", "false");
    if (pagamentoError) pagamentoError.textContent = "";
    return true;
  }

  function initPagamento() {
    if (!selectPagamento) return;
    selectPagamento.addEventListener("change", () => {
      atualizarBandeira();
      validarPagamento();
    });
    selectBandeira?.addEventListener("change", validarPagamento);
    atualizarBandeira();
  }

  // ── Contador de observações ──────────────────────────────────────────────

  function initContador() {
    if (!textarea || !obsContador) return;

    function atualizar() {
      obsContador.textContent = `${textarea.value.length} / ${MAX_OBS}`;
    }

    textarea.addEventListener("input", atualizar);
    atualizar();
  }

  // ── Modal: Cadastro necessário ───────────────────────────────────────────

  function abrirCadastroModal() {
    if (!cadastroModal) return;
    cadastroModal.showModal();
    requestAnimationFrame(() => cadastroModal.classList.add("is-open"));
  }

  function fecharCadastroModal() {
    if (!cadastroModal) return;
    cadastroModal.classList.remove("is-open");
    cadastroModal.addEventListener(
      "transitionend",
      () => cadastroModal.close(),
      { once: true }
    );
  }

  function initModalCadastro() {
    btnNovoEndereco?.addEventListener("click", abrirCadastroModal);
    cadastroModalOk?.addEventListener("click", fecharCadastroModal);

    cadastroModal?.addEventListener("click", (event) => {
      if (event.target === cadastroModal) fecharCadastroModal();
    });

    cadastroModal?.addEventListener("cancel", (event) => {
      event.preventDefault();
      fecharCadastroModal();
    });
  }

  // ── Finalizar pedido ─────────────────────────────────────────────────────

  function montarPedido(sessao) {
    const itens = Cart.get();
    const totais = calcularTotais(itens, sessao.endereco);

    return {
      codigo:      gerarCodigoPedido(),
      cliente:     sessao.cliente,
      tipoCliente: sessao.usuario ? "cadastrado" : "visitante",
      visitante:   sessao.guest,
      modalidade:  sessao.modalidade,
      endereco:    sessao.endereco,
      pagamento:   selectPagamento.options[selectPagamento.selectedIndex]?.text ?? "",
      bandeira:    selectBandeira.disabled ? null : (selectBandeira.value || null),
      bandeiraLabel: selectBandeira.disabled
        ? null
        : (selectBandeira.options[selectBandeira.selectedIndex]?.text || null),
      observacoes: textarea?.value.trim() ?? "",
      itens,
      subtotal:    totais.subtotal,
      taxaEntrega: totais.taxaEntrega,
      desconto:    totais.desconto,
      total:       totais.total,
      cupom:       totais.cupom,
      criadoEm:    new Date().toISOString(),
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
      modalidade: "entrega",
      endereco: pedido.endereco,
      pagamento: pedido.pagamento,
      bandeira: pedido.bandeira,
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

  function formatarEnderecoResumidoSeguro(endereco) {
    return endereco ? formatarEnderecoResumido(endereco) : null;
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
      modalidade: "Entregar em domicílio",
      pagamento: pedido.pagamento,
      bandeira: pedido.bandeira,
      bandeiraLabel: pedido.bandeiraLabel,
      endereco: formatarEnderecoResumidoSeguro(pedido.endereco),
      enderecoDados: pedido.endereco,
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

  function limparSessaoCheckout() {
    sessionStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(MODALIDADE_KEY);
    sessionStorage.removeItem(ENDERECO_KEY);
    limparCupomAplicado();
    Cart.clear();
  }

  function initFinalizar() {
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener("click", async () => {
      // Valida pagamento primeiro
      if (!validarPagamento()) {
        if (PAGAMENTOS_COM_BANDEIRA.has(selectPagamento.value) && !selectBandeira.value) {
          selectBandeira.focus();
        } else {
          selectPagamento.focus();
        }
        return;
      }

      // Valida sessão apenas no momento de confirmar
      const sessao = lerDadosSessao();
      if (!sessao.cliente || !sessao.modalidade || !sessao.endereco) {
        window.location.replace(FLUXO_INICIO);
        return;
      }

      // Valida carrinho
      if (Object.keys(Cart.get()).length === 0) {
        window.location.replace("meu-carrinho.html");
        return;
      }

      const pedido = montarPedido(sessao);

      btnFinalizar.disabled = true;
      btnFinalizar.innerHTML = "Enviando pedido...";

      try {
        await salvarPedidoVisitante(pedido);
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

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // Lê sessão sem bloquear — UI inicializa normalmente mesmo sem dados
    const { endereco } = lerDadosSessao();

    preencherEndereco(endereco);
    preencherResumo(endereco);
    initPagamento();
    initContador();
    initModalCadastro();
    initFinalizar();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

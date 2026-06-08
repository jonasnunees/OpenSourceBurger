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
   * @returns {{ guest, modalidade, endereco }}
   */
  function lerDadosSessao() {
    return {
      guest:      lerSessao(GUEST_KEY),
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

  function preencherResumo(endereco) {
    const itens = Cart.get();
    let totalItens = 0;

    Object.values(itens).forEach(({ preco, qty }) => {
      totalItens += parsePreco(preco) * qty;
    });

    const taxa  = Number(endereco?.taxa) || 0;
    const total = totalItens + taxa;

    if (resumoValorItens) resumoValorItens.textContent = formatarPreco(totalItens);
    if (resumoTaxa)       resumoTaxa.textContent       = formatarPreco(taxa);
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
    selectPagamento.setAttribute("aria-invalid", "false");
    if (pagamentoError) pagamentoError.textContent = "";
    return true;
  }

  function initPagamento() {
    if (!selectPagamento) return;
    selectPagamento.addEventListener("change", () => {
      atualizarBandeira();
      validarPagamento();
    });
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
    return {
      visitante:   sessao.guest,
      modalidade:  sessao.modalidade,
      endereco:    sessao.endereco,
      pagamento:   selectPagamento.options[selectPagamento.selectedIndex]?.text ?? "",
      bandeira:    selectBandeira.disabled ? null : (selectBandeira.value || null),
      observacoes: textarea?.value.trim() ?? "",
      itens:       Cart.get(),
      criadoEm:    new Date().toISOString(),
    };
  }

  function limparSessaoCheckout() {
    sessionStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(MODALIDADE_KEY);
    sessionStorage.removeItem(ENDERECO_KEY);
    Cart.clear();
  }

  function initFinalizar() {
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener("click", () => {
      // Valida pagamento primeiro
      if (!validarPagamento()) {
        selectPagamento.focus();
        return;
      }

      // Valida sessão apenas no momento de confirmar
      const sessao = lerDadosSessao();
      if (!sessao.guest || !sessao.modalidade || !sessao.endereco) {
        window.location.replace(FLUXO_INICIO);
        return;
      }

      // Valida carrinho
      if (Object.keys(Cart.get()).length === 0) {
        window.location.replace("meu-carrinho.html");
        return;
      }

      const pedido = montarPedido(sessao);

      // TODO: enviar pedido ao Supabase via fetch() ou SDK
      console.log("[OSB] Pedido entrega montado:", pedido);

      limparSessaoCheckout();

      // TODO: redirecionar para página de confirmação do pedido
      window.location.href = "pedido-confirmado.html";
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
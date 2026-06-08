/**
 * finalizar-pedido.js
 * Script da página de finalização de pedido (retirada e consumo no local).
 *
 * Responsabilidades:
 * - Valida presença dos dados de sessão (osb_guest, osb_modalidade)
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
   * Os dados de visitante (osb_guest) são obrigatórios pois o fluxo
   * de checkout sempre passa por pedido-visitante.html antes desta página.
   * A modalidade (osb_modalidade) é obrigatória pois define o que exibir.
   *
   * @returns {{ guest: object, modalidade: object } | null}
   */
  function validarSessao() {
    const guest      = lerSessao(GUEST_KEY);
    const modalidade = lerSessao(MODALIDADE_KEY);

    if (!guest || !modalidade) {
      window.location.replace(FLUXO_INICIO);
      return null;
    }

    return { guest, modalidade };
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

    let totalValor = 0;

    Object.values(itens).forEach(({ preco, qty }) => {
      totalValor += parsePreco(preco) * qty;
    });

    if (resumoValorItens) resumoValorItens.textContent = formatarPreco(totalValor);
    if (resumoTotal)      resumoTotal.textContent      = formatarPreco(totalValor);
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
   * @param {{ guest: object, modalidade: object }} sessao
   * @returns {object}
   */
  function montarPedido(sessao) {
    return {
      visitante:    sessao.guest,
      modalidade:   sessao.modalidade,
      pagamento:    "Pagar no estabelecimento",
      observacoes:  textarea?.value.trim() ?? "",
      itens:        Cart.get(),
      criadoEm:     new Date().toISOString(),
    };
  }

  /**
   * Limpa os dados de sessão do checkout após confirmação.
   * O carrinho é limpo via Cart.clear() que já sincroniza os badges.
   */
  function limparSessaoCheckout() {
    sessionStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(MODALIDADE_KEY);
    Cart.clear();
  }

  function handleFinalizar(sessao) {
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener("click", () => {
      const pedido = montarPedido(sessao);

      // TODO: enviar pedido ao Supabase via fetch() ou SDK
      // Por ora: loga o objeto e simula confirmação
      console.log("[OSB] Pedido montado:", pedido);

      limparSessaoCheckout();

      // TODO: redirecionar para página de confirmação do pedido
      window.location.href = "pedido-confirmado.html";
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
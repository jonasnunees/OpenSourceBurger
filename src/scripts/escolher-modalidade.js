/**
 * escolher-modalidade.js
 * Script da página de seleção de modalidade de pedido.
 *
 * Responsabilidades:
 * - Preenche tempos de entrega/retirada a partir de CONFIG.tempos
 * - Ajusta o href do botão "Voltar" preservando o ?redirect= da URL
 * - Habilita o botão "Avançar" ao selecionar qualquer modalidade
 * - Persiste a modalidade escolhida em sessionStorage como 'osb_modalidade'
 * - Redireciona para a página correta conforme a modalidade:
 *     entrega  → endereco-entrega.html
 *     retirada → finalizar-pedido.html
 *     local    → finalizar-pedido.html
 *
 * Dependências: config.js, auth.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const MODALIDADE_KEY = "osb_modalidade";

  /**
   * Mapa de modalidades com rótulo legível e página de destino.
   * Centraliza aqui toda a lógica de roteamento pós-seleção.
   * Para adicionar uma nova modalidade: basta incluir uma entrada.
   */
  const MODALIDADES = {
    entrega:  {
      label: "Entrega em domicílio",
      destino: "endereco-de-entrega.html",
    },
    retirada: {
      label:   "Retirar no local",
      destino: "finalizar-pedido.html",
    },
    local: {
      label:   "Consumir no local",
      destino: "finalizar-pedido.html",
    },
  };

  // ── Elementos ───────────────────────────────────────────────────────────

  const btnVoltar  = document.getElementById("btn-voltar");
  const btnAvancar = document.getElementById("btn-avancar");
  const fieldset   = document.getElementById("modalidade-fieldset");

  // ── URL helpers ─────────────────────────────────────────────────────────

  function getRedirectParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  }

  function isSafeUrl(url) {
    if (!url) return false;
    return !url.startsWith("http") && !url.startsWith("//");
  }

  /**
   * Retorna a URL de destino para a modalidade selecionada.
   * Se houver ?redirect= seguro na URL, ele tem precedência
   * (permite forçar um destino externo ao fluxo padrão).
   *
   * @param {string} valorModalidade
   * @returns {string}
   */
  function getNextUrl(valorModalidade) {
    const redirect = getRedirectParam();
    if (isSafeUrl(redirect)) return redirect;

    return MODALIDADES[valorModalidade]?.destino ?? "finalizar-pedido.html";
  }

  // ── Botão Voltar ────────────────────────────────────────────────────────

  function initBtnVoltar() {
    if (!btnVoltar) return;

    const redirect = getRedirectParam();

    if (redirect) {
      btnVoltar.href =
        `pedido-visitante.html?redirect=${encodeURIComponent(redirect)}`;
    }
  }

  // ── Preenche tempos via CONFIG ───────────────────────────────────────────

  function preencherTempos() {
    const { entrega, retirada } = CONFIG.tempos;

    document.querySelectorAll("[data-tempo-entrega]").forEach((el) => {
      el.textContent = entrega;
    });

    document.querySelectorAll("[data-tempo-retirada]").forEach((el) => {
      el.textContent = retirada;
    });

    document.querySelectorAll("[data-tempo-local]").forEach((el) => {
      el.textContent = retirada;
    });
  }

  // ── Habilitar botão ao selecionar ───────────────────────────────────────

  function initSelecao() {
    if (!fieldset || !btnAvancar) return;

    fieldset.addEventListener("change", (event) => {
      if (event.target.name !== "modalidade") return;

      btnAvancar.disabled = false;
      btnAvancar.removeAttribute("aria-disabled");
    });
  }

  // ── Persistência e navegação ─────────────────────────────────────────────

  /**
   * Salva a modalidade escolhida em sessionStorage.
   * Formato: { valor: string, label: string, destino: string }
   *
   * O destino é salvo junto para que páginas futuras possam
   * reconstruir o fluxo de navegação sem referenciar o mapa local.
   *
   * @param {string} valor
   */
  function salvarModalidade(valor) {
    const modalidade = MODALIDADES[valor];
    sessionStorage.setItem(
      MODALIDADE_KEY,
      JSON.stringify({
        valor,
        label:   modalidade?.label   ?? valor,
        destino: modalidade?.destino ?? "finalizar-pedido.html",
      })
    );
  }

  function handleAvancar() {
    const selecionado = fieldset.querySelector(
      'input[name="modalidade"]:checked'
    );

    if (!selecionado) return;

    const valor = selecionado.value;

    salvarModalidade(valor);

    btnAvancar.disabled = true;
    window.location.href = getNextUrl(valor);
  }

  // ── Init ────────────────────────────────────────────────────────────────

  function init() {
    initBtnVoltar();
    preencherTempos();
    initSelecao();
    btnAvancar?.addEventListener("click", handleAvancar);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
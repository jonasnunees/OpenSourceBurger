/**
 * escolher-modalidade.js
 * Script da página de seleção de modalidade de pedido.
 *
 * Responsabilidades:
 * - Preenche tempos de entrega/retirada a partir de CONFIG.tempos
 * - Ajusta o href do botão "Voltar" preservando o ?redirect= da URL
 * - Habilita o botão "Avançar" ao selecionar qualquer modalidade
 * - Persiste a modalidade escolhida em sessionStorage como 'osb_modalidade'
 * - Redireciona para o destino definido por ?redirect=
 *   (futuramente: finalizar-pedido.html)
 *
 * Dependências: config.js, auth.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const MODALIDADE_KEY = "osb_modalidade";
  const DEFAULT_NEXT   = "finalizar-pedido.html";

  /**
   * Mapa de modalidades com seus rótulos legíveis.
   * Usado para salvar no sessionStorage de forma descritiva,
   * facilitando o consumo na próxima etapa do checkout.
   */
  const MODALIDADES = {
    entrega:  { label: "Entrega em domicílio" },
    retirada: { label: "Retirar no local"     },
    local:    { label: "Consumir no local"    },
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

  function getNextUrl() {
    const redirect = getRedirectParam();
    return isSafeUrl(redirect) ? redirect : DEFAULT_NEXT;
  }

  // ── Botão Voltar ────────────────────────────────────────────────────────

  /**
   * Monta o href do botão Voltar apontando para pedido-visitante.html
   * e preservando o ?redirect= para não perder o destino do fluxo.
   */
  function initBtnVoltar() {
    if (!btnVoltar) return;

    const redirect = getRedirectParam();

    if (redirect) {
      btnVoltar.href =
        `pedido-visitante.html?redirect=${encodeURIComponent(redirect)}`;
    }
    // Sem redirect: mantém o href padrão "pedido-visitante.html" do HTML
  }

  // ── Preenche tempos via CONFIG ───────────────────────────────────────────

  /**
   * Injeta os valores de CONFIG.tempos nos elementos marcados com
   * data-tempo-entrega, data-tempo-retirada e data-tempo-local.
   *
   * Reutiliza o mesmo padrão de data attributes de meu-carrinho.html,
   * mantendo consistência na forma de injetar dados do config no DOM.
   */
  function preencherTempos() {
    const { entrega, retirada } = CONFIG.tempos;

    document.querySelectorAll("[data-tempo-entrega]").forEach((el) => {
      el.textContent = entrega;
    });

    // Retirada e consumo no local compartilham o mesmo tempo estimado
    document.querySelectorAll("[data-tempo-retirada]").forEach((el) => {
      el.textContent = retirada;
    });

    document.querySelectorAll("[data-tempo-local]").forEach((el) => {
      el.textContent = retirada;
    });
  }

  // ── Habilitar botão ao selecionar ───────────────────────────────────────

  /**
   * Observa mudanças no fieldset via delegação de evento.
   * Habilita o botão Avançar quando qualquer radio é selecionado.
   * Usando "change" no fieldset (delegação) em vez de um listener
   * por input — mais performático e robusto a cards adicionados dinamicamente.
   */
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
   *
   * Formato: { valor: "entrega" | "retirada" | "local", label: string }
   *
   * Salvar o label evita que a próxima página precise referenciar
   * o MODALIDADES map novamente para exibir o nome legível ao usuário.
   *
   * @param {string} valor
   */
  function salvarModalidade(valor) {
    const modalidade = {
      valor,
      label: MODALIDADES[valor]?.label ?? valor,
    };
    sessionStorage.setItem(MODALIDADE_KEY, JSON.stringify(modalidade));
  }

  function handleAvancar() {
    const selecionado = fieldset.querySelector(
      'input[name="modalidade"]:checked'
    );

    if (!selecionado) return;

    salvarModalidade(selecionado.value);

    btnAvancar.disabled = true;
    window.location.href = getNextUrl();
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
/**
 * endereco-entrega.js
 * Script da página de coleta de endereço para entrega em domicílio.
 *
 * Responsabilidades:
 * - Popula o select de cidade com CONFIG.cidade (valor único, fixo)
 * - Popula o select de bairro com CONFIG.bairros (nome + taxa)
 * - Valida os campos obrigatórios (endereço, número, bairro)
 * - Persiste o endereço em sessionStorage como 'osb_endereco'
 * - Redireciona para finalizar-pedido-entrega.html ao avançar
 *
 * Dependências: config.js, auth.js, validators.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const ENDERECO_KEY = "osb_endereco";
  const DEFAULT_NEXT = "finalizar-pedido-entrega.html";

  // ── Elementos ───────────────────────────────────────────────────────────

  const form            = document.getElementById("endereco-form");
  const selectCidade    = document.getElementById("cidade");
  const inputEndereco   = document.getElementById("endereco");
  const inputNumero     = document.getElementById("numero");
  const selectBairro    = document.getElementById("bairro");
  const inputCompl      = document.getElementById("complemento");
  const enderecoError   = document.getElementById("endereco-error");
  const numeroError     = document.getElementById("numero-error");
  const bairroError     = document.getElementById("bairro-error");
  const btnAvancar      = document.getElementById("btn-avancar");
  const btnVoltar       = document.getElementById("btn-voltar");

  // ── Popula selects via CONFIG ────────────────────────────────────────────

  /**
   * Popula o select de cidade com o valor único de CONFIG.cidade.
   * Desabilitado — não há outras cidades de entrega disponíveis.
   */
  function popularCidade() {
    if (!selectCidade) return;

    const option = document.createElement("option");
    option.value       = CONFIG.cidade;
    option.textContent = CONFIG.cidade;
    option.selected    = true;
    selectCidade.appendChild(option);
  }

  /**
   * Popula o select de bairro com CONFIG.bairros.
   * Cada option carrega a taxa como data-taxa para leitura no submit.
   * A opção placeholder ("- Selecione seu Bairro") tem value="" e
   * é desabilitada para impedir seleção após interação.
   */
  function popularBairros() {
    if (!selectBairro) return;

    // Placeholder
    const placeholder = document.createElement("option");
    placeholder.value    = "";
    placeholder.textContent = "- Selecione seu Bairro";
    placeholder.disabled = true;
    placeholder.selected = true;
    selectBairro.appendChild(placeholder);

    CONFIG.bairros.forEach(({ nome, taxa }) => {
      const option = document.createElement("option");
      option.value          = nome;
      option.textContent    = nome;
      option.dataset.taxa   = taxa;
      selectBairro.appendChild(option);
    });
  }

  // ── Validação ────────────────────────────────────────────────────────────

  /**
   * Valida o select de bairro.
   * Reutiliza setFieldError/clearFieldError do Validators
   * mas a lógica de "valor vazio" é específica de select.
   *
   * @returns {boolean}
   */
  function validarBairro() {
    if (!selectBairro.value) {
      Validators.setFieldError(
        selectBairro,
        bairroError,
        "Selecione seu bairro."
      );
      return false;
    }

    Validators.clearFieldError(selectBairro, bairroError);
    return true;
  }

  function validarEndereco() {
    return Validators.validarObrigatorio(
      inputEndereco,
      enderecoError,
      "Informe o endereço."
    );
  }

  function validarNumero() {
    return Validators.validarObrigatorio(
      inputNumero,
      numeroError,
      "Informe o número."
    );
  }

  function validarTudo() {
    // Executa todos — não curto-circuita — para exibir todos os erros
    const e = validarEndereco();
    const n = validarNumero();
    const b = validarBairro();
    return e && n && b;
  }

  // ── Validação em tempo real (blur) ────────────────────────────────────────

  function initRealtimeValidation() {
    inputEndereco.addEventListener("blur", validarEndereco);
    inputNumero.addEventListener("blur", validarNumero);
    selectBairro.addEventListener("change", validarBairro);

    // Limpa erro ao voltar a digitar
    [
      [inputEndereco, enderecoError],
      [inputNumero,   numeroError],
    ].forEach(([input, errorEl]) => {
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") {
          Validators.clearFieldError(input, errorEl);
        }
      });
    });
  }

  // ── Persistência ──────────────────────────────────────────────────────────

  /**
   * Lê a taxa do bairro selecionado a partir do data-taxa da option.
   *
   * @returns {number}
   */
  function lerTaxaBairro() {
    const selectedOption = selectBairro.options[selectBairro.selectedIndex];
    return parseFloat(selectedOption?.dataset.taxa ?? "0");
  }

  /**
   * Salva o endereço completo em sessionStorage.
   *
   * Formato:
   * {
   *   cidade:      string,
   *   endereco:    string,
   *   numero:      string,
   *   bairro:      string,
   *   taxa:        number,   ← taxa de entrega do bairro selecionado
   *   complemento: string    ← vazio se não preenchido
   * }
   */
  function salvarEndereco() {
    const dados = {
      cidade:      selectCidade.value,
      endereco:    inputEndereco.value.trim(),
      numero:      inputNumero.value.trim(),
      bairro:      selectBairro.value,
      taxa:        lerTaxaBairro(),
      complemento: inputCompl?.value.trim() ?? "",
    };

    sessionStorage.setItem(ENDERECO_KEY, JSON.stringify(dados));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit(event) {
    event.preventDefault();

    if (!validarTudo()) {
      // Foca o primeiro campo inválido para acessibilidade
      if (inputEndereco.getAttribute("aria-invalid") === "true") {
        inputEndereco.focus();
      } else if (inputNumero.getAttribute("aria-invalid") === "true") {
        inputNumero.focus();
      } else {
        selectBairro.focus();
      }
      return;
    }

    salvarEndereco();

    btnAvancar.disabled = true;
    window.location.href = DEFAULT_NEXT;
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    popularCidade();
    popularBairros();
    initRealtimeValidation();
    form?.addEventListener("submit", handleSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
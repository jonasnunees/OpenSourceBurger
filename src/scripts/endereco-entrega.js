/**
 * endereco-entrega.js
 * Script da página de coleta de endereço para entrega em domicílio.
 *
 * Responsabilidades:
 * - Popula o select de cidade com CONFIG.cidade (valor único, fixo)
 * - Popula o select de bairro com CONFIG.bairros (nome + taxa)
 * - Para clientes logados com endereços salvos, permite escolher um endereço
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
  const salvosSection   = document.getElementById("enderecos-salvos-section");
  const salvosLista     = document.getElementById("enderecos-salvos-lista");
  const salvosFeedback  = document.getElementById("enderecos-salvos-feedback");
  const formSection     = form?.closest("section");

  // ── Helpers ─────────────────────────────────────────────────────────────

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function buscarBairroAtendido(nome) {
    const bairroNormalizado = normalizarTexto(nome);
    return CONFIG.bairros.find((bairro) =>
      normalizarTexto(bairro.nome) === bairroNormalizado
    );
  }

  function getCidadeEnderecoSalvo(endereco) {
    if (endereco.uf) return `${endereco.cidade}/${endereco.uf}`;
    return endereco.cidade;
  }

  function toEnderecoCheckout(enderecoSalvo) {
    const bairroAtendido = buscarBairroAtendido(enderecoSalvo.bairro);

    return {
      id:          enderecoSalvo.id,
      titulo:      enderecoSalvo.titulo,
      cidade:      getCidadeEnderecoSalvo(enderecoSalvo),
      endereco:    enderecoSalvo.rua,
      numero:      enderecoSalvo.numero,
      bairro:      enderecoSalvo.bairro,
      taxa:        Number(bairroAtendido?.taxa) || 0,
      complemento: enderecoSalvo.complemento ?? "",
    };
  }

  function formatarEnderecoSalvo(endereco) {
    const partes = [
      `${endereco.rua}, ${endereco.numero}`,
      endereco.complemento ? endereco.complemento : null,
      `${endereco.bairro} - ${getCidadeEnderecoSalvo(endereco)}`,
    ].filter(Boolean);

    return partes.join(", ");
  }

  function salvarEnderecoCheckout(endereco) {
    sessionStorage.setItem(ENDERECO_KEY, JSON.stringify(endereco));
  }

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

  // ── Endereços salvos ────────────────────────────────────────────────────

  function mostrarFormularioManual() {
    if (salvosSection) salvosSection.hidden = true;
    if (formSection) formSection.hidden = false;
  }

  function mostrarEnderecosSalvos() {
    if (formSection) formSection.hidden = true;
    if (salvosSection) salvosSection.hidden = false;
  }

  function handleEscolherEndereco(endereco) {
    const bairroAtendido = buscarBairroAtendido(endereco.bairro);

    if (!bairroAtendido) {
      if (salvosFeedback) {
        salvosFeedback.textContent =
          "Esse endereço está fora da área de entrega. Cadastre ou escolha outro endereço.";
      }
      return;
    }

    salvarEnderecoCheckout(toEnderecoCheckout(endereco));
    window.location.href = DEFAULT_NEXT;
  }

  function htmlEnderecoSalvo(endereco) {
    const bairroAtendido = buscarBairroAtendido(endereco.bairro);
    const disabledAttr = bairroAtendido ? "" : "disabled aria-disabled=\"true\"";
    const status = endereco.principal ? "<span>Principal</span>" : "";
    const aviso = bairroAtendido ? "" : "<small>Fora da área de entrega</small>";

    return `
      <li>
        <button
          type="button"
          class="endereco-salvo-card"
          data-endereco-id="${endereco.id}"
          ${disabledAttr}
        >
          <span class="endereco-salvo-card__topo">
            <strong>${endereco.titulo}</strong>
            ${status}
          </span>
          <span class="endereco-salvo-card__texto">${formatarEnderecoSalvo(endereco)}</span>
          ${aviso}
        </button>
      </li>`;
  }

  async function carregarEnderecosSalvos() {
    const session = Auth.getSession?.();

    if (!session?.id) {
      mostrarFormularioManual();
      return;
    }

    const { data, error } = await SupabaseClient
      .from("enderecos")
      .select("id, titulo, rua, numero, complemento, bairro, cidade, uf, principal")
      .eq("user_id", session.id)
      .order("principal", { ascending: false })
      .order("created_at", { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      mostrarFormularioManual();
      return;
    }

    if (salvosLista) {
      salvosLista.innerHTML = data.map(htmlEnderecoSalvo).join("");
      salvosLista.addEventListener("click", (event) => {
        const card = event.target.closest("[data-endereco-id]");
        if (!card || card.disabled) return;

        const endereco = data.find((item) => item.id === card.dataset.enderecoId);
        if (endereco) handleEscolherEndereco(endereco);
      });
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("endereco_salvo") === "1" && salvosFeedback) {
      salvosFeedback.textContent = "Endereço salvo. Escolha um endereço para continuar.";
    }

    mostrarEnderecosSalvos();
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

  async function init() {
    popularCidade();
    popularBairros();
    initRealtimeValidation();
    form?.addEventListener("submit", handleSubmit);
    await carregarEnderecosSalvos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

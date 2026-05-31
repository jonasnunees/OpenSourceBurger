/**
 * utils/validators.js
 * Funções de validação de formulários e helpers de estado de campo.
 *
 * Não possui dependências externas.
 * Expõe o objeto global `Validators` para scripts clássicos.
 *
 * Ordem de carregamento: após config.js, antes dos scripts de página.
 */

const Validators = (() => {
  // ── Helpers de estado de campo ──────────────────────────────────────────────

  /**
   * Marca um campo como inválido e exibe a mensagem de erro.
   * @param {HTMLElement} input   - Campo do formulário
   * @param {HTMLElement} errorEl - Elemento que exibe o erro (aria-live)
   * @param {string}      message - Mensagem a ser exibida
   */
  function setFieldError(input, errorEl, message) {
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
  }

  /**
   * Limpa o estado de erro de um campo.
   * @param {HTMLElement} input   - Campo do formulário
   * @param {HTMLElement} errorEl - Elemento que exibe o erro
   */
  function clearFieldError(input, errorEl) {
    input.setAttribute("aria-invalid", "false");
    errorEl.textContent = "";
  }

  // ── Validadores de campo ────────────────────────────────────────────────────

  /**
   * Valida um campo de e-mail.
   * @param {HTMLInputElement} input   - Input de e-mail
   * @param {HTMLElement}      errorEl - Elemento de erro associado
   * @returns {boolean}
   */
  function validarEmail(input, errorEl) {
    const val = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!val) {
      setFieldError(input, errorEl, "Informe seu e-mail.");
      return false;
    }
    if (!emailRegex.test(val)) {
      setFieldError(input, errorEl, "E-mail inválido.");
      return false;
    }

    clearFieldError(input, errorEl);
    return true;
  }

  /**
   * Valida um campo de senha.
   * @param {HTMLInputElement} input        - Input de senha
   * @param {HTMLElement}      errorEl      - Elemento de erro associado
   * @param {number}           [minLength=6] - Tamanho mínimo exigido
   * @returns {boolean}
   */
  function validarSenha(input, errorEl, minLength = 6) {
    const val = input.value;

    if (!val) {
      setFieldError(input, errorEl, "Informe sua senha.");
      return false;
    }
    if (val.length < minLength) {
      setFieldError(input, errorEl, `A senha deve ter pelo menos ${minLength} caracteres.`);
      return false;
    }

    clearFieldError(input, errorEl);
    return true;
  }

  /**
   * Valida se um campo obrigatório não está vazio.
   * @param {HTMLInputElement} input   - Campo do formulário
   * @param {HTMLElement}      errorEl - Elemento de erro associado
   * @param {string}           message - Mensagem quando vazio
   * @returns {boolean}
   */
  function validarObrigatorio(input, errorEl, message = "Este campo é obrigatório.") {
    const val = input.value.trim();

    if (!val) {
      setFieldError(input, errorEl, message);
      return false;
    }

    clearFieldError(input, errorEl);
    return true;
  }

  // API pública
  return { setFieldError, clearFieldError, validarEmail, validarSenha, validarObrigatorio };
})();

/**
 * pedido-visitante.js
 * Script da página de identificação do visitante.
 *
 * Responsabilidades:
 * - Ajusta o href do botão "Voltar" preservando ?redirect= da URL
 * - Aplica máscara de telefone brasileiro ao digitar
 * - Valida os campos (nome e telefone) inline
 * - Persiste os dados em sessionStorage como 'osb_guest'
 * - Redireciona para o destino definido por ?redirect=
 *   ou para escolher-modalidade.html como próxima etapa do checkout
 *
 * Dependências: config.js, auth.js, common.js (Cart, UI)
 */

(function () {
  "use strict";

  // ── Constantes ──────────────────────────────────────────────────────────

  const GUEST_KEY      = "osb_guest";
  const DEFAULT_NEXT   = "escolher-modalidade.html";
  const MIN_NAME_LEN   = 3;
  // Telefone com DDD: mínimo 10 dígitos (fixo) ou 11 (celular)
  const MIN_PHONE_DIGITS = 10;

  // ── Elementos ───────────────────────────────────────────────────────────

  const form        = document.getElementById("guest-form");
  const nameInput   = document.getElementById("guest-name");
  const phoneInput  = document.getElementById("guest-phone");
  const nameError   = document.getElementById("name-error");
  const phoneError  = document.getElementById("phone-error");
  const feedback    = document.getElementById("guest-feedback");
  const btnVoltar   = document.getElementById("btn-voltar");
  const btnAvancar  = document.getElementById("btn-avancar");

  // ── URL helpers ─────────────────────────────────────────────────────────

  /**
   * Lê o parâmetro ?redirect= da URL atual.
   * Retorna o valor decodificado ou null.
   *
   * @returns {string|null}
   */
  function getRedirectParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  }

  /**
   * Retorna a URL de destino após o preenchimento do formulário.
   * Usa ?redirect= se presente e seguro; caso contrário usa DEFAULT_NEXT.
   *
   * @returns {string}
   */
  function getNextUrl() {
    const redirect = getRedirectParam();
    if (redirect && Auth.isSafeRedirectUrl
        ? Auth.isSafeRedirectUrl(redirect)
        : redirect && !redirect.startsWith("http") && !redirect.startsWith("//")) {
      return redirect;
    }
    return DEFAULT_NEXT;
  }

  // ── Botão Voltar ────────────────────────────────────────────────────────

  /**
   * Monta o href do botão Voltar preservando o ?redirect= para que,
   * caso o usuário decida fazer login, o fluxo não se perca.
   *
   * Ex: pedido-visitante.html?redirect=/src/pages/finalizar-pedido.html
   *   → voltar aponta para: login.html?redirect=/src/pages/finalizar-pedido.html
   */
  function initBtnVoltar() {
    if (!btnVoltar) return;

    const redirect = getRedirectParam();

    if (redirect) {
      btnVoltar.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
    }
    // Se não houver redirect, mantém o href padrão "login.html" do HTML
  }

  // ── Máscara de telefone ─────────────────────────────────────────────────

  /**
   * Remove tudo que não for dígito.
   *
   * @param {string} value
   * @returns {string}
   */
  function onlyDigits(value) {
    return value.replace(/\D/g, "");
  }

  /**
   * Formata uma string de dígitos no padrão brasileiro:
   * - 10 dígitos → (XX) XXXX-XXXX   (telefone fixo)
   * - 11 dígitos → (XX) XXXXX-XXXX  (celular)
   *
   * @param {string} digits
   * @returns {string}
   */
  function formatPhone(digits) {
    if (digits.length === 0) return "";

    // DDD
    let formatted = digits.length >= 2
      ? `(${digits.slice(0, 2)}) `
      : `(${digits}`;

    if (digits.length <= 2) return formatted;

    // Corpo: celular tem 9 dígitos, fixo tem 8
    const body = digits.slice(2);

    if (digits.length <= 6) {
      // Ainda digitando o início do número
      formatted += body;
    } else if (digits.length <= 10) {
      // Telefone fixo em formação: XXXX-XXXX
      formatted += `${body.slice(0, 4)}-${body.slice(4)}`;
    } else {
      // Celular: XXXXX-XXXX (máx 11 dígitos totais)
      const capped = body.slice(0, 9);
      formatted += `${capped.slice(0, 5)}-${capped.slice(5)}`;
    }

    return formatted;
  }

  /**
   * Handler do evento "input" no campo telefone.
   * Reposiciona o cursor corretamente após a formatação.
   */
  function handlePhoneMask() {
    const digits    = onlyDigits(phoneInput.value);
    const formatted = formatPhone(digits);

    phoneInput.value = formatted;
  }

  // ── Validação ───────────────────────────────────────────────────────────

  /**
   * Exibe ou limpa o erro de um campo.
   *
   * @param {HTMLInputElement} input
   * @param {HTMLElement}      errorEl
   * @param {string}           message  — vazio para limpar o erro
   */
  function setFieldError(input, errorEl, message) {
    const hasError = message.length > 0;
    input.setAttribute("aria-invalid", String(hasError));
    errorEl.textContent = message;
  }

  /**
   * Valida o campo nome.
   * Regras: obrigatório, mínimo MIN_NAME_LEN caracteres.
   *
   * @returns {boolean}
   */
  function validateName() {
    const value = nameInput.value.trim();

    if (!value) {
      setFieldError(nameInput, nameError, "Por favor, informe seu nome.");
      return false;
    }

    if (value.length < MIN_NAME_LEN) {
      setFieldError(nameInput, nameError, `O nome deve ter pelo menos ${MIN_NAME_LEN} caracteres.`);
      return false;
    }

    setFieldError(nameInput, nameError, "");
    return true;
  }

  /**
   * Valida o campo telefone.
   * Regras: obrigatório, mínimo MIN_PHONE_DIGITS dígitos numéricos.
   *
   * @returns {boolean}
   */
  function validatePhone() {
    const digits = onlyDigits(phoneInput.value);

    if (!digits) {
      setFieldError(phoneInput, phoneError, "Por favor, informe seu telefone.");
      return false;
    }

    if (digits.length < MIN_PHONE_DIGITS) {
      setFieldError(phoneInput, phoneError, "Informe um telefone válido com DDD.");
      return false;
    }

    setFieldError(phoneInput, phoneError, "");
    return true;
  }

  // ── Feedback geral ──────────────────────────────────────────────────────

  function showFeedbackError(message) {
    feedback.textContent = message;
    feedback.classList.add("is-visible", "form-feedback--error");
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("is-visible", "form-feedback--error");
  }

  // ── Persistência ────────────────────────────────────────────────────────

  /**
   * Salva os dados do visitante em sessionStorage.
   * Formato: { nome: string, telefone: string }
   *
   * Usa sessionStorage (não localStorage) intencionalmente:
   * os dados do visitante devem durar apenas enquanto a aba estiver aberta,
   * sem persistir entre sessões — diferente do carrinho (localStorage + TTL).
   *
   * @param {string} nome
   * @param {string} telefone
   */
  function saveGuestData(nome, telefone) {
    const data = { nome, telefone };
    sessionStorage.setItem(GUEST_KEY, JSON.stringify(data));
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  function handleSubmit(event) {
    event.preventDefault();
    clearFeedback();

    const isNameValid  = validateName();
    const isPhoneValid = validatePhone();

    if (!isNameValid || !isPhoneValid) {
      // Foca o primeiro campo inválido para acessibilidade
      if (!isNameValid) nameInput.focus();
      else phoneInput.focus();
      return;
    }

    const nome     = nameInput.value.trim();
    const telefone = phoneInput.value.trim();

    try {
      saveGuestData(nome, telefone);
    } catch {
      showFeedbackError("Não foi possível salvar seus dados. Tente novamente.");
      return;
    }

    btnAvancar.disabled = true;

    window.location.href = getNextUrl();
  }

  // ── Validação em tempo real (blur) ──────────────────────────────────────

  function initRealtimeValidation() {
    nameInput.addEventListener("blur", validateName);
    phoneInput.addEventListener("blur", validatePhone);

    // Limpa erro ao começar a digitar novamente
    nameInput.addEventListener("input", () => {
      if (nameInput.getAttribute("aria-invalid") === "true") {
        setFieldError(nameInput, nameError, "");
      }
    });

    phoneInput.addEventListener("input", () => {
      if (phoneInput.getAttribute("aria-invalid") === "true") {
        setFieldError(phoneInput, phoneError, "");
      }
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────

  function init() {
    initBtnVoltar();
    phoneInput.addEventListener("input", handlePhoneMask);
    initRealtimeValidation();
    form.addEventListener("submit", handleSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
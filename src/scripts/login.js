/**
 * pages/login.js
 * Controla o comportamento do formulário de login.
 *
 * Responsabilidades:
 * - Redirecionar usuário já logado
 * - Alternar visibilidade da senha
 * - Validar campos de e-mail e senha
 * - Exibir feedback de erro
 * - Simular autenticação enquanto o backend não existe
 * - Ocultar o link "Continuar como visitante" quando o acesso
 *   não vier do fluxo de checkout (ex: Minha Conta, Meus Pedidos)
 *
 * Dependências (nesta ordem no HTML):
 * config.js → auth.js → utils/validators.js → pages/login.js
 *
 * TODO: substituir o bloco `simulateLoginRequest()` pelo fetch() real
 * apontando para o endpoint de autenticação do Supabase.
 */

// ── Seletores ───────────────────────────────────────────────────────────────

const LOGIN_FORM_ID = "login-form";
const LOGIN_EMAIL_ID = "login-email";
const LOGIN_PASSWORD_ID = "login-password";
const TOGGLE_PASSWORD_ID = "toggle-password";
const EMAIL_ERROR_ID = "email-error";
const PASSWORD_ERROR_ID = "password-error";
const LOGIN_FEEDBACK_ID = "login-feedback";
const LOGIN_BUTTON_ID = "btn-login";

const LOADING_BUTTON_TEXT = "Entrando...";
const DEFAULT_BUTTON_TEXT = "ENTRAR";
const FAKE_API_DELAY_MS = 300;

/**
 * Páginas que fazem parte do fluxo de checkout como visitante.
 * O link "Continuar como visitante" só é exibido quando o ?redirect=
 * aponta para uma dessas páginas — ou quando não há redirect algum
 * e o acesso é direto à página de login (entrada orgânica).
 *
 * Adicionar futuras etapas do checkout aqui quando forem criadas.
 */
const CHECKOUT_PAGES = [
  "pedido-visitante.html",
  "escolher-modalidade.html",
  "finalizar-pedido.html",
];

// ── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Inicializa os ícones do Lucide se a biblioteca estiver disponível.
 *
 * @param {Element | Element[] | NodeList | null} nodes
 */
function createLucideIcons(nodes = null) {
  if (typeof lucide === "undefined") return;

  if (nodes) {
    lucide.createIcons({ nodes });
    return;
  }

  lucide.createIcons();
}

/**
 * Retorna todos os elementos usados pelo formulário de login.
 *
 * Centralizar a busca dos elementos evita repetição e deixa claro
 * quais partes do HTML este arquivo espera encontrar.
 */
function getLoginElements() {
  return {
    form: document.getElementById(LOGIN_FORM_ID),
    emailInput: document.getElementById(LOGIN_EMAIL_ID),
    passwordInput: document.getElementById(LOGIN_PASSWORD_ID),
    toggleButton: document.getElementById(TOGGLE_PASSWORD_ID),
    emailError: document.getElementById(EMAIL_ERROR_ID),
    passwordError: document.getElementById(PASSWORD_ERROR_ID),
    formFeedback: document.getElementById(LOGIN_FEEDBACK_ID),
    submitButton: document.getElementById(LOGIN_BUTTON_ID),
  };
}

/**
 * Redireciona imediatamente se o usuário já estiver logado.
 *
 * @returns {boolean} true quando houve redirecionamento
 */
function redirectIfAlreadyLoggedIn() {
  if (!Auth.isLoggedIn()) return false;

  window.location.replace(Auth.getRedirectUrl());
  return true;
}

/**
 * Oculta a mensagem geral de feedback do formulário.
 *
 * @param {HTMLElement} formFeedback
 */
function hideFormFeedback(formFeedback) {
  formFeedback.classList.remove("is-visible");
}

/**
 * Define o estado visual de carregamento do botão.
 *
 * @param {HTMLButtonElement} submitButton
 */
function setLoadingState(submitButton) {
  submitButton.disabled = true;
  submitButton.textContent = LOADING_BUTTON_TEXT;
}

/**
 * Restaura o estado original do botão de login.
 *
 * @param {HTMLButtonElement} submitButton
 */
function resetSubmitButton(submitButton) {
  submitButton.disabled = false;
  submitButton.textContent = DEFAULT_BUTTON_TEXT;
  createLucideIcons(submitButton.querySelectorAll("i[data-lucide]"));
}

/**
 * Exibe uma mensagem geral de erro no formulário.
 *
 * @param {HTMLElement} formFeedback
 * @param {string} message
 */
function showFormError(formFeedback, message) {
  formFeedback.textContent = message;
  formFeedback.classList.add("is-visible");
}

// ── Link "Continuar como visitante" ────────────────────────────────────────

/**
 * Verifica se o parâmetro ?redirect= aponta para uma página
 * do fluxo de checkout como visitante.
 *
 * A verificação usa includes() nas CHECKOUT_PAGES para ser robusta
 * a variações de path relativo (ex: "pages/pedido-visitante.html"
 * ou apenas "pedido-visitante.html").
 *
 * @returns {boolean}
 */
function isCheckoutFlow() {
  const params   = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  // Sem redirect: acesso direto à página de login — exibe o link
  if (!redirect) return true;

  return CHECKOUT_PAGES.some((page) => redirect.includes(page));
}

/**
 * Oculta o link "Continuar como visitante" quando o login
 * foi disparado por uma página que não faz parte do checkout.
 *
 * Usa display:none em vez de remover o elemento para preservar
 * o fluxo do DOM e não quebrar scripts que possam referenciar o link.
 */
function initGuestLink() {
  if (isCheckoutFlow()) return; // checkout: exibe normalmente

  const guestLink = document.querySelector(".guest-link");
  if (guestLink) guestLink.style.display = "none";
}

// ── Toggle de senha ────────────────────────────────────────────────────────

/**
 * Alterna a visibilidade do campo de senha.
 *
 * Também atualiza atributos ARIA e o ícone do botão para manter
 * boa acessibilidade e feedback visual.
 */
function togglePasswordVisibility(passwordInput, toggleButton) {
  const isVisible = passwordInput.type === "text";

  passwordInput.type = isVisible ? "password" : "text";
  toggleButton.setAttribute("aria-pressed", String(!isVisible));
  toggleButton.setAttribute("aria-label", isVisible ? "Mostrar senha" : "Ocultar senha");

  const iconElement = toggleButton.querySelector("i[data-lucide]");

  if (!iconElement) return;

  iconElement.setAttribute("data-lucide", isVisible ? "eye" : "eye-off");
  createLucideIcons([iconElement]);
}

/**
 * Inicializa o botão de mostrar/ocultar senha.
 */
function initPasswordToggle({ passwordInput, toggleButton }) {
  if (!passwordInput || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    togglePasswordVisibility(passwordInput, toggleButton);
  });
}

// ── Validação ──────────────────────────────────────────────────────────────

/**
 * Cria as funções de validação do formulário.
 *
 * A validação real fica no módulo Validators,
 * evitando duplicação de regras entre formulários.
 */
function createValidators({ emailInput, passwordInput, emailError, passwordError }) {
  return {
    validateEmail: () => Validators.validarEmail(emailInput, emailError),
    validatePassword: () => Validators.validarSenha(passwordInput, passwordError),
  };
}

/**
 * Inicializa a validação progressiva dos campos.
 *
 * Os campos são validados ao perder o foco, melhorando a experiência
 * sem mostrar erro antes do usuário interagir.
 */
function initFieldValidation(elements, validators) {
  const { emailInput, passwordInput } = elements;
  const { validateEmail, validatePassword } = validators;

  if (!emailInput || !passwordInput) return;

  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);
}

/**
 * Remove o feedback geral quando o usuário começa a corrigir os campos.
 */
function initFeedbackReset({ emailInput, passwordInput, formFeedback }) {
  if (!emailInput || !passwordInput || !formFeedback) return;

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => hideFormFeedback(formFeedback));
  });
}

/**
 * Valida o formulário inteiro antes de tentar login.
 *
 * @returns {boolean}
 */
function isFormValid(validators) {
  const emailOk = validators.validateEmail();
  const passwordOk = validators.validatePassword();

  return emailOk && passwordOk;
}

// ── Autenticação simulada ──────────────────────────────────────────────────

/**
 * Simula uma chamada de autenticação.
 *
 * TODO: substituir por fetch() ou SDK do Supabase quando o backend estiver pronto.
 *
 * Para testar o fluxo de sucesso, altere `simulateSuccess` para true.
 *
 * @returns {Promise<boolean>}
 */
// ── Autenticação real (Supabase) ───────────────────────────────────────────

/**
 * Autentica o usuário via Supabase Auth.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, errorMessage?: string }>}
 */
async function attemptLogin(email, password) {
  const { data, error } = await Auth.login(email, password);

  if (error) {
    // Supabase retorna "Invalid login credentials" para e-mail ou senha errados.
    // Normalizamos para uma mensagem amigável em português.
    return { success: false, errorMessage: "E-mail ou senha incorretos. Tente novamente." };
  }

  return { success: true };
}

// ── Submit ─────────────────────────────────────────────────────────────────

/**
 * Inicializa o submit do formulário de login.
 */
function initFormSubmit(elements, validators) {
  const { form, submitButton } = elements;

  if (!form || !submitButton) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isFormValid(validators)) return;

    setLoadingState(submitButton);

    const email    = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    const { success, errorMessage } = await attemptLogin(email, password);

    if (success) {
      window.location.replace(Auth.getRedirectUrl());
      return;
    }

    showFormError(elements.formFeedback, errorMessage);
    resetSubmitButton(submitButton);
    elements.emailInput.focus();
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  if (redirectIfAlreadyLoggedIn()) return;

  const elements = getLoginElements();

  if (!elements.form) return;

  const validators = createValidators(elements);

  initGuestLink();
  initPasswordToggle(elements);
  initFieldValidation(elements, validators);
  initFeedbackReset(elements);
  initFormSubmit(elements, validators);
});
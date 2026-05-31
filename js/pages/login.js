/**
 * pages/login.js
 * Controla o comportamento do formulário de login.
 *
 * Dependências (nesta ordem no HTML):
 *  config.js → auth.js → utils/validators.js → pages/login.js
 *
 * TODO: substituir o bloco `simulateSuccess` pelo fetch() real
 *       apontando para o endpoint de autenticação do Supabase.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Se já estiver logado, redireciona imediatamente para o destino
  if (Auth.isLoggedIn()) {
    window.location.replace(Auth.getRedirectUrl());
    return;
  }

  // ── Elementos ──────────────────────────────────────────────────────────────
  const form          = document.getElementById("login-form");
  const emailInput    = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const toggleBtn     = document.getElementById("toggle-password");
  const emailError    = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formFeedback  = document.getElementById("login-feedback");
  const submitBtn     = document.getElementById("btn-login");

  // ── Toggle de visibilidade da senha ───────────────────────────────────────
  toggleBtn.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    toggleBtn.setAttribute("aria-pressed", String(!isVisible));
    toggleBtn.setAttribute("aria-label", isVisible ? "Mostrar senha" : "Ocultar senha");

    const iconEl = toggleBtn.querySelector("i[data-lucide]");
    if (iconEl) {
      iconEl.setAttribute("data-lucide", isVisible ? "eye" : "eye-off");
      lucide.createIcons({ nodes: [iconEl] });
    }
  });

  // ── Validação por campo ────────────────────────────────────────────────────
  // Delega para Validators — sem duplicação de lógica entre formulários.

  const validateEmail    = () => Validators.validarEmail(emailInput, emailError);
  const validatePassword = () => Validators.validarSenha(passwordInput, passwordError);

  // Valida ao sair do campo (blur) para UX progressiva
  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);

  // Limpa o feedback geral ao digitar em qualquer campo
  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      formFeedback.classList.remove("is-visible");
    });
  });

  // ── Submit ─────────────────────────────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailOk    = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk || !passwordOk) return;

    // Estado de carregamento
    submitBtn.disabled     = true;
    submitBtn.textContent  = "Entrando...";

    /*
     * Simulação de chamada à API (300ms de latência fake).
     * TODO: substituir pelo fetch() ou SDK do Supabase quando o backend estiver pronto.
     * Para testar o fluxo de sucesso, altere `simulateSuccess` para true.
     */
    const simulateSuccess = false;

    setTimeout(() => {
      if (simulateSuccess) {
        Auth.login({
          name:  "Usuário Teste",
          email: emailInput.value.trim(),
        });
        window.location.replace(Auth.getRedirectUrl());
        return;
      }

      // Credenciais inválidas — exibe feedback e restaura o botão
      formFeedback.textContent = "E-mail ou senha incorretos. Tente novamente.";
      formFeedback.classList.add("is-visible");
      submitBtn.disabled = false;

      submitBtn.innerHTML = `
        <i data-lucide="circle-check-big"></i>
        ENTRAR
      `;
      lucide.createIcons({ nodes: submitBtn.querySelectorAll("i[data-lucide]") });

      // Move foco para o e-mail para facilitar a correção (acessibilidade)
      emailInput.focus();
    }, 300);
  });
});

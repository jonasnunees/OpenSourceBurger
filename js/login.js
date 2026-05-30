/**
 * login.js
 * Controla o comportamento do formulário de login.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Se já estiver logado, vai direto para o destino
  if (Auth.isLoggedIn()) {
    window.location.replace(Auth.getRedirectUrl());
    return;
  }

  /* ── Elementos ── */
  const form         = document.getElementById('login-form');
  const emailInput   = document.getElementById('login-email');
  const passwordInput= document.getElementById('login-password');
  const toggleBtn    = document.getElementById('toggle-password');
  const emailError   = document.getElementById('email-error');
  const passwordError= document.getElementById('password-error');
  const formFeedback = document.getElementById('login-feedback');
  const submitBtn    = document.getElementById('btn-login');

  /* ── Toggle visibilidade da senha ── */
  toggleBtn.addEventListener('click', () => {
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    toggleBtn.setAttribute('aria-pressed', String(!isVisible));
    toggleBtn.setAttribute('aria-label', isVisible ? 'Mostrar senha' : 'Ocultar senha');

    // Troca ícone via Lucide
    const iconEl = toggleBtn.querySelector('i[data-lucide]');
    if (iconEl) {
      iconEl.setAttribute('data-lucide', isVisible ? 'eye' : 'eye-off');
      lucide.createIcons({ nodes: [iconEl] });
    }
  });

  /* ── Validação individual de campo ── */
  function validateEmail() {
    const val = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!val) {
      setFieldError(emailInput, emailError, 'Informe seu e-mail.');
      return false;
    }
    if (!emailRegex.test(val)) {
      setFieldError(emailInput, emailError, 'E-mail inválido.');
      return false;
    }
    clearFieldError(emailInput, emailError);
    return true;
  }

  function validatePassword() {
    const val = passwordInput.value;

    if (!val) {
      setFieldError(passwordInput, passwordError, 'Informe sua senha.');
      return false;
    }
    if (val.length < 6) {
      setFieldError(passwordInput, passwordError, 'A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    clearFieldError(passwordInput, passwordError);
    return true;
  }

  /* ── Helpers de estado de campo ── */
  function setFieldError(input, errorEl, message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl) {
    input.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
  }

  /* Valida ao sair do campo (blur) para UX progressiva */
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);

  /* Limpa o feedback geral ao digitar */
  emailInput.addEventListener('input', () => {
    formFeedback.classList.remove('is-visible');
  });
  passwordInput.addEventListener('input', () => {
    formFeedback.classList.remove('is-visible');
  });

  /* ── Submit ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailOk    = validateEmail();
    const passwordOk = validatePassword();

    if (!emailOk || !passwordOk) return;

    // Feedback de carregamento
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    /*
     * Simulação de chamada à API (300ms de latência fake).
     * TODO: substituir pelo fetch() real quando o backend estiver pronto.
     * Por enquanto, sempre falha para demonstrar o fluxo completo.
     * Para testar o "sucesso", troque `simulateSuccess` para true.
     */
    const simulateSuccess = false;

    setTimeout(() => {
      if (simulateSuccess) {
        Auth.login({
          name: 'Usuário Teste',
          email: emailInput.value.trim(),
        });
        window.location.replace(Auth.getRedirectUrl());
      } else {
        // Credenciais inválidas
        formFeedback.textContent = 'E-mail ou senha incorretos. Tente novamente.';
        formFeedback.classList.add('is-visible');
        submitBtn.disabled = false;

        // Restaura ícone + texto do botão
        submitBtn.innerHTML = `
          <i data-lucide="circle-check-big"></i>
          ENTRAR
        `;
        lucide.createIcons({ nodes: submitBtn.querySelectorAll('i[data-lucide]') });

        // Move foco para o campo de e-mail para facilitar correção
        emailInput.focus();
      }
    }, 300);
  });
});

/**
 * recuperar-senha.js
 *
 * Responsabilidades:
 *  - Validar o campo de e-mail antes do envio
 *  - Simular (ou integrar) o envio do pedido de recuperação
 *  - Exibir o painel de sucesso após envio bem-sucedido
 *  - Gerenciar estados de loading e erro no formulário
 *
 * Dependências (carregadas antes deste script no HTML):
 *  - js/config.js        → configurações globais do projeto
 *  - js/auth.js          → serviço de autenticação
 *  - js/utils/validators.js → Validators.validarEmail(), Validators.clearFieldError()
 *  - js/common.js        → drawer, whatsapp, lucide.createIcons()
 */

(function () {
  'use strict';

  /* ══ Seletores ══ */
  const form         = document.getElementById('recover-form');
  const emailInput   = document.getElementById('recover-email');
  const emailError   = document.getElementById('recover-email-error');
  const feedback     = document.getElementById('recover-feedback');
  const btnRecover   = document.getElementById('btn-recover');
  const formPanel    = document.getElementById('recover-form-panel');
  const successPanel = document.getElementById('recover-success-panel');

  /* ══ Guard: todos os elementos precisam existir ══ */
  if (!form || !emailInput || !emailError || !feedback || !btnRecover || !formPanel || !successPanel) {
    console.warn('[recuperar-senha] Um ou mais elementos do DOM não foram encontrados.');
    return;
  }

  /* ══ Helpers de UI ══ */

  /**
   * Exibe ou oculta o bloco de feedback geral do formulário.
   * @param {string} message - String vazia oculta o bloco.
   */
  function setFeedback(message) {
    feedback.textContent = message;
    feedback.classList.toggle('is-visible', Boolean(message));
  }

  /**
   * Alterna o estado de carregamento do botão de envio.
   * @param {boolean} isLoading
   */
  function setLoading(isLoading) {
    btnRecover.disabled = isLoading;
    btnRecover.setAttribute('aria-busy', String(isLoading));
  }

  /* ══ Validação do campo ══ */

  /**
   * Valida o campo de e-mail delegando para Validators.validarEmail(),
   * que aplica o feedback visual diretamente no DOM e retorna booleano.
   * @returns {boolean}
   */
  function validateEmail() {
    return Validators.validarEmail(emailInput, emailError);
  }

  /* ══ Painel de sucesso ══ */

  /**
   * Oculta o painel do formulário e exibe o painel de sucesso.
   * Move o foco para o título do painel para leitores de tela.
   */
  function showSuccessPanel() {
    formPanel.hidden = true;
    formPanel.setAttribute('aria-hidden', 'true');

    successPanel.hidden = false;
    successPanel.removeAttribute('aria-hidden');

    /*
      Re-renderiza ícones Lucide: o painel estava oculto durante
      o createIcons() inicial do common.js, então o mail-check
      pode não ter sido processado.
    */
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    /* Move foco para o título — essencial para acessibilidade */
    const successTitle = document.getElementById('success-heading');
    if (successTitle) {
      successTitle.setAttribute('tabindex', '-1');
      successTitle.focus();
    }
  }

  /* ══ Limpeza de erro ao digitar ══ */
  emailInput.addEventListener('input', function () {
    if (emailInput.getAttribute('aria-invalid') === 'true') {
      Validators.clearFieldError(emailInput, emailError);
    }
    setFeedback('');
  });

  /* ══ Validação ao sair do campo (blur) ══ */
  emailInput.addEventListener('blur', function () {
    const value = emailInput.value.trim();
    /* Só valida se o usuário digitou algo — não penaliza campo intocado */
    if (value) {
      validateEmail();
    }
  });

  /* ══ Submit ══ */
  form.addEventListener('submit', async function (event) {
    /* Impede o comportamento padrão (recarregar a página) */
    event.preventDefault();

    /* Limpa feedbacks anteriores */
    setFeedback('');

    /* Valida antes de qualquer requisição */
    const isValid = validateEmail();
    if (!isValid) {
      emailInput.focus();
      return;
    }

    setLoading(true);

    try {
      const email = emailInput.value.trim();

      /*
        Ponto de integração com o back-end.
        Substitua simularEnvio() pela chamada real, por exemplo:
          await auth.recuperarSenha(email);
      */
      if (!SupabaseClient) throw new Error("Cliente não inicializado.");

      const { error } = await SupabaseClient.auth.resetPasswordForEmail(email, {
        // URL para onde o Supabase redireciona após o clique no e-mail.
        // Aponte para a página de redefinição de senha quando ela existir.
        // Por ora, redireciona para o login.
        redirectTo: `${window.location.origin}/login.html`,
      });

      // Supabase não informa se o e-mail existe ou não (segurança).
      // Mesmo que o e-mail não exista, retorna sucesso — não vazamos informação.
      if (error && !error.message.includes("rate limit")) {
        throw error;
      }

      showSuccessPanel();

    } catch (error) {
      /*
        Não informamos se o e-mail existe ou não (segurança).
        Diferenciamos apenas erro de rede vs erro de servidor.
      */
      const isNetworkError = error instanceof TypeError;
      setFeedback(
        isNetworkError
          ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
          : 'Não foi possível processar sua solicitação. Tente novamente em instantes.'
      );

    } finally {
      setLoading(false);
    }
  });

})();
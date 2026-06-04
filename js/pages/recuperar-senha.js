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
 *  - js/utils/validators.js → validarEmail() (usada se disponível)
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

  /* ══ Validação de e-mail ══ */

  /**
   * Regex de validação de e-mail.
   * Cobre os casos mais comuns: usuario@dominio.ext
   * Usa validarEmail() do validators.js se disponível,
   * caso contrário aplica esta regex como fallback seguro.
   */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /**
   * Retorna true se o e-mail for válido.
   * Prioriza validarEmail() do validators.js quando disponível.
   * @param {string} value
   * @returns {boolean}
   */
  function isEmailValid(value) {
    if (typeof validarEmail === 'function') {
      return validarEmail(value);
    }
    return EMAIL_REGEX.test(value);
  }

  /* ══ Helpers de UI ══ */

  /**
   * Exibe ou limpa a mensagem de erro inline do campo de e-mail.
   * @param {string} message - String vazia limpa o estado de erro.
   */
  function setEmailError(message) {
    emailError.textContent = message;
    emailInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

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
   * Valida o campo de e-mail e aplica feedback visual.
   * Retorna true se válido.
   * @returns {boolean}
   */
  function validateEmail() {
    const value = emailInput.value.trim();

    if (!value) {
      setEmailError('Informe seu e-mail.');
      return false;
    }

    if (!isEmailValid(value)) {
      setEmailError('Informe um e-mail válido. Ex: nome@dominio.com');
      return false;
    }

    setEmailError('');
    return true;
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
      setEmailError('');
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
      await simularEnvio(email);

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

  /* ══ Simulação de envio (remover ao integrar com back-end real) ══ */

  /**
   * Simula uma chamada assíncrona ao servidor com latência de 1.2s.
   * Substitua por: return auth.recuperarSenha(email);
   * @param {string} _email
   * @returns {Promise<void>}
   */
  function simularEnvio(_email) {
    return new Promise(function (resolve) {
      setTimeout(resolve, 1200);
    });
  }

})();
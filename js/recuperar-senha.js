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
 *  - js/utils/validators.js → validarEmail()
 *  - js/common.js        → drawer, whatsapp, lucide.createIcons()
 */

(function () {
  'use strict';

  /* ══ Seletores ══ */
  const form           = document.getElementById('recover-form');
  const emailInput     = document.getElementById('recover-email');
  const emailError     = document.getElementById('recover-email-error');
  const feedback       = document.getElementById('recover-feedback');
  const btnRecover     = document.getElementById('btn-recover');
  const formPanel      = document.getElementById('recover-form-panel');
  const successPanel   = document.getElementById('recover-success-panel');

  /* ══ Guard: sai silenciosamente se os elementos não existirem ══ */
  if (!form || !emailInput) return;

  /* ══ Helpers de UI ══ */

  /**
   * Exibe ou limpa a mensagem de erro inline do campo de e-mail.
   * @param {string} message - Mensagem de erro. String vazia limpa o estado.
   */
  function setEmailError(message) {
    emailError.textContent  = message;
    emailInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  /**
   * Exibe ou oculta o feedback geral do formulário (ex: e-mail não encontrado).
   * @param {string} message - Mensagem de erro. String vazia oculta o bloco.
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

    /*
      Atualiza aria-busy para comunicar o estado de carregamento
      a leitores de tela sem alterar o texto visível do botão.
    */
    btnRecover.setAttribute('aria-busy', String(isLoading));
  }

  /* ══ Validação ══ */

  /**
   * Valida o campo de e-mail usando o utilitário global validarEmail().
   * Retorna true se válido, false caso contrário.
   * @returns {boolean}
   */
  function validateEmail() {
    const value = emailInput.value.trim();

    if (!value) {
      setEmailError('Informe seu e-mail.');
      return false;
    }

    /*
      validarEmail() é definido em js/utils/validators.js.
      Retorna true para e-mails válidos, false caso contrário.
    */
    if (typeof validarEmail === 'function' && !validarEmail(value)) {
      setEmailError('Informe um e-mail válido.');
      return false;
    }

    setEmailError('');
    return true;
  }

  /* ══ Painel de sucesso ══ */

  /**
   * Oculta o formulário e exibe o painel de sucesso.
   * Move o foco para o título do painel de sucesso para garantir
   * que leitores de tela anunciem a mudança de estado.
   */
  function showSuccessPanel() {
    /* Oculta o painel do formulário */
    formPanel.hidden      = true;
    formPanel.setAttribute('aria-hidden', 'true');

    /* Revela o painel de sucesso */
    successPanel.hidden   = false;
    successPanel.removeAttribute('aria-hidden');

    /*
      Re-renderiza os ícones Lucide dentro do painel de sucesso,
      pois o elemento estava oculto durante o createIcons() inicial
      do common.js e o ícone mail-check pode não ter sido renderizado.
    */
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    /* Move o foco para o título do painel de sucesso */
    const successTitle = document.getElementById('success-heading');
    if (successTitle) {
      successTitle.setAttribute('tabindex', '-1');
      successTitle.focus();
    }
  }

  /* ══ Limpeza de erros ao digitar ══ */
  emailInput.addEventListener('input', function () {
    if (emailInput.getAttribute('aria-invalid') === 'true') {
      setEmailError('');
    }
    /* Limpa também o feedback geral se o usuário começar a corrigir */
    setFeedback('');
  });

  /* ══ Submit ══ */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    /* Limpa estados anteriores */
    setFeedback('');

    /* Valida antes de qualquer requisição */
    if (!validateEmail()) {
      emailInput.focus();
      return;
    }

    setLoading(true);

    try {
      const email = emailInput.value.trim();

      /*
        Ponto de integração com o back-end.
        Substitua o bloco abaixo pela chamada real à sua API ou ao auth.js.

        Exemplo com auth.js:
          await auth.recuperarSenha(email);

        O padrão de resposta esperado:
          - Sucesso: resolve normalmente (sem lançar erro)
          - E-mail não encontrado: lança erro com message descritiva
          - Erro de rede/servidor: lança erro genérico
      */
      await simularEnvio(email);

      /* Envio bem-sucedido → exibe painel de confirmação */
      showSuccessPanel();

    } catch (error) {
      /*
        Por segurança, não informamos se o e-mail existe ou não no sistema.
        Usamos uma mensagem genérica independentemente do tipo de erro,
        exceto para erros de rede onde o usuário precisa saber que deve tentar novamente.
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
   * Simula uma chamada assíncrona ao servidor.
   * Remove esta função ao integrar com auth.js ou sua API.
   * @param {string} email
   * @returns {Promise<void>}
   */
  function simularEnvio(email) {
    return new Promise(function (resolve) {
      /*
        Simula latência de rede (1.2s).
        Em produção, substitua por: return auth.recuperarSenha(email);
      */
      setTimeout(resolve, 1200);
    });
  }

})();

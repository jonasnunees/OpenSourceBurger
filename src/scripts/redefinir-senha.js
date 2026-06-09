/**
 * redefinir-senha.js
 *
 * Responsabilidades:
 *  - Ler o token de recuperação do hash da URL (#access_token=...&type=recovery)
 *  - Estabelecer a sessão Supabase com esse token
 *  - Exibir painel de erro se o token for inválido ou ausente
 *  - Exibir formulário de nova senha se o token for válido
 *  - Validar força da senha com medidor visual e checklist
 *  - Enviar a nova senha via supabase.auth.updateUser()
 *  - Redirecionar para login.html?senha=redefinida após sucesso
 *
 * Dependências (carregadas antes deste script no HTML):
 *  libs/supabase.js → config.js → auth.js → lucide → validators.js → common.js
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // CONSTANTES
  // ══════════════════════════════════════════════════════════

  const SENHA_FORTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  const SENHA_REQUISITOS = {
    length:  { regex: /.{8,}/,        id: 'redefine-req-length'  },
    upper:   { regex: /[A-Z]/,        id: 'redefine-req-upper'   },
    lower:   { regex: /[a-z]/,        id: 'redefine-req-lower'   },
    number:  { regex: /\d/,           id: 'redefine-req-number'  },
    special: { regex: /[!@#$%^&*]/,   id: 'redefine-req-special' },
  };

  const FORCA_LABELS = { 1: 'Fraca', 2: 'Regular', 3: 'Boa', 4: 'Forte' };

  // ══════════════════════════════════════════════════════════
  // SELETORES
  // ══════════════════════════════════════════════════════════

  const formPanel      = document.getElementById('redefine-form-panel');
  const invalidPanel   = document.getElementById('redefine-invalid-panel');
  const form           = document.getElementById('redefine-form');
  const feedback       = document.getElementById('redefine-feedback');
  const inputSenha     = document.getElementById('redefine-senha');
  const erroSenha      = document.getElementById('redefine-senha-error');
  const inputConfirmar = document.getElementById('redefine-confirmar');
  const erroConfirmar  = document.getElementById('redefine-confirmar-error');
  const toggleSenha    = document.getElementById('toggle-redefine-senha');
  const toggleConfirmar= document.getElementById('toggle-redefine-confirmar');
  const btnRedefine    = document.getElementById('btn-redefine');
  const strengthEl     = document.getElementById('redefine-strength');
  const strengthFill   = document.getElementById('redefine-strength-fill');
  const strengthLabel  = document.getElementById('redefine-strength-label');

  // ══════════════════════════════════════════════════════════
  // LEITURA DO TOKEN NO HASH
  // ══════════════════════════════════════════════════════════

  /**
   * Extrai os parâmetros do hash da URL.
   *
   * O Supabase envia o token no fragmento para que ele nunca
   * seja enviado ao servidor: .../redefinir-senha.html#access_token=xxx&type=recovery
   *
   * @returns {{ accessToken: string|null, refreshToken: string|null, type: string|null }}
   */
  function lerTokenDoHash() {
    const hash   = window.location.hash.substring(1); // remove o '#'
    const params = new URLSearchParams(hash);

    return {
      accessToken:  params.get('access_token'),
      refreshToken: params.get('refresh_token'),
      type:         params.get('type'),
    };
  }

  // ══════════════════════════════════════════════════════════
  // PAINÉIS
  // ══════════════════════════════════════════════════════════

  function mostrarPainelFormulario() {
    formPanel.hidden = false;
    formPanel.removeAttribute('aria-hidden');

    invalidPanel.hidden = true;
    invalidPanel.setAttribute('aria-hidden', 'true');

    // Foca o primeiro campo para acessibilidade
    if (inputSenha) inputSenha.focus();

    // Reinicia ícones Lucide no painel recém-exibido
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function mostrarPainelInvalido() {
    invalidPanel.hidden = false;
    invalidPanel.removeAttribute('aria-hidden');

    formPanel.hidden = true;
    formPanel.setAttribute('aria-hidden', 'true');

    // Move foco para o título do painel de erro
    const titulo = document.getElementById('invalid-heading');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ══════════════════════════════════════════════════════════
  // FEEDBACK
  // ══════════════════════════════════════════════════════════

  function setFeedback(message) {
    feedback.textContent = message;
    feedback.classList.toggle('is-visible', Boolean(message));
  }

  function setLoading(isLoading) {
    btnRedefine.disabled = isLoading;
    btnRedefine.setAttribute('aria-busy', String(isLoading));
    btnRedefine.textContent = isLoading ? 'Salvando...' : '';

    if (!isLoading) {
      // Restaura conteúdo original do botão
      btnRedefine.innerHTML = `
        <i data-lucide="circle-check-big" aria-hidden="true"></i>
        Salvar nova senha
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // ══════════════════════════════════════════════════════════
  // TOGGLE DE VISIBILIDADE DA SENHA
  // ══════════════════════════════════════════════════════════

  function setupToggle(btn, input) {
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const visivel = input.type === 'text';
      input.type = visivel ? 'password' : 'text';
      btn.setAttribute('aria-pressed', String(!visivel));
      btn.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');

      const icone = btn.querySelector('[data-lucide]');
      if (icone) {
        icone.setAttribute('data-lucide', visivel ? 'eye' : 'eye-off');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // MEDIDOR DE FORÇA DE SENHA
  // ══════════════════════════════════════════════════════════

  function calcularForca(senha) {
    if (!senha) return 0;
    return Object.values(SENHA_REQUISITOS).filter(({ regex }) => regex.test(senha)).length;
  }

  function atualizarMedidor(senha) {
    const forca = calcularForca(senha);

    if (senha.length > 0) {
      strengthEl.classList.add('is-visible');
    } else {
      strengthEl.classList.remove('is-visible');
    }

    if (forca > 0) {
      strengthFill.setAttribute('data-strength', forca);
      strengthLabel.setAttribute('data-strength', forca);
      strengthLabel.textContent = FORCA_LABELS[forca];
    } else {
      strengthFill.removeAttribute('data-strength');
      strengthLabel.removeAttribute('data-strength');
      strengthLabel.textContent = '';
    }

    Object.entries(SENHA_REQUISITOS).forEach(([, { regex, id }]) => {
      const item    = document.getElementById(id);
      if (!item) return;

      const atendido = regex.test(senha);
      const icone    = item.querySelector('[data-lucide]');

      item.classList.toggle('is-met', atendido);

      if (icone) {
        icone.setAttribute('data-lucide', atendido ? 'circle-check' : 'circle');
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ══════════════════════════════════════════════════════════
  // VALIDAÇÃO
  // ══════════════════════════════════════════════════════════

  function validarSenhaForte() {
    const val = inputSenha.value;

    if (!val) {
      Validators.setFieldError(inputSenha, erroSenha, 'Informe sua nova senha.');
      return false;
    }
    if (!SENHA_FORTE_REGEX.test(val)) {
      Validators.setFieldError(inputSenha, erroSenha, 'A senha não atende aos requisitos abaixo.');
      return false;
    }

    Validators.clearFieldError(inputSenha, erroSenha);
    return true;
  }

  function validarConfirmacao() {
    const senha    = inputSenha.value;
    const confirma = inputConfirmar.value;

    if (!confirma) {
      Validators.setFieldError(inputConfirmar, erroConfirmar, 'Confirme sua nova senha.');
      return false;
    }
    if (senha !== confirma) {
      Validators.setFieldError(inputConfirmar, erroConfirmar, 'As senhas não coincidem.');
      return false;
    }

    Validators.clearFieldError(inputConfirmar, erroConfirmar);
    return true;
  }

  // ══════════════════════════════════════════════════════════
  // INICIALIZAÇÃO DA SESSÃO COM O TOKEN
  // ══════════════════════════════════════════════════════════

  /**
   * Verifica o token do hash e decide qual painel exibir.
   *
   * O token de recuperação precisa ser passado ao Supabase via
   * setSession() para que updateUser() funcione corretamente.
   * Sem isso, a chamada seria rejeitada por falta de autenticação.
   */
  async function inicializar() {
    const { accessToken, refreshToken, type } = lerTokenDoHash();

    // Token ausente ou tipo diferente de recovery → link inválido
    if (!accessToken || type !== 'recovery') {
      mostrarPainelInvalido();
      return;
    }

    try {
      // Estabelece a sessão com o token recebido por e-mail
      const { error } = await SupabaseClient.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken ?? '',
      });

      if (error) {
        mostrarPainelInvalido();
        return;
      }

      // Token válido: exibe o formulário
      mostrarPainelFormulario();

    } catch {
      mostrarPainelInvalido();
    }
  }

  // ══════════════════════════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════════════════════════

  function initFormSubmit() {
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      setFeedback('');

      const senhaOk    = validarSenhaForte();
      const confirmOk  = validarConfirmacao();

      if (!senhaOk || !confirmOk) return;

      setLoading(true);

      try {
        const { error } = await SupabaseClient.auth.updateUser({
          password: inputSenha.value,
        });

        if (error) {
          setFeedback('Não foi possível redefinir a senha. Tente solicitar um novo link.');
          return;
        }

        // Sucesso: encerra a sessão de recuperação e vai para o login
        await SupabaseClient.auth.signOut();
        sessionStorage.removeItem('osb_session');

        window.location.href = 'login.html?senha=redefinida';

      } catch {
        setFeedback('Erro de conexão. Verifique sua internet e tente novamente.');
      } finally {
        setLoading(false);
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════════════════════

  function initEventListeners() {
    // Toggle de visibilidade
    setupToggle(toggleSenha,     inputSenha);
    setupToggle(toggleConfirmar, inputConfirmar);

    // Medidor de força em tempo real
    inputSenha.addEventListener('input', () => {
      atualizarMedidor(inputSenha.value);
      if (inputConfirmar.value) validarConfirmacao();
    });

    // Validação no blur
    inputSenha.addEventListener('blur',     validarSenhaForte);
    inputConfirmar.addEventListener('blur', validarConfirmacao);

    // Limpa erro de confirmação ao redigitar
    inputConfirmar.addEventListener('input', () => {
      if (inputConfirmar.getAttribute('aria-invalid') === 'true') {
        validarConfirmacao();
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // BOOTSTRAP
  // ══════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    initFormSubmit();
    await inicializar();
  });

})();
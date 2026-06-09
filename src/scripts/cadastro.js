/**
 * cadastro.js
 * Lógica da página de cadastro multistep do Open Source Burger.
 *
 * Responsabilidades:
 *  - Controle de navegação entre os 5 steps (avançar / voltar)
 *  - Animação de slide entre steps (direita ↔ esquerda)
 *  - Atualização da barra de progresso
 *  - Validação dos campos de cada step antes de avançar
 *  - Autocomplete de endereço via API ViaCEP (step 3)
 *  - Medidor de força de senha + lista de requisitos (step 4)
 *  - Toggle de visibilidade dos campos de senha
 *  - Submit final com validação completa
 *
 * Dependências (ordem de carregamento no HTML):
 *  config.js → auth.js → lucide → validators.js → common.js → cadastro.js
 *
 * Expõe: nada (IIFE sem namespace público necessário nesta página)
 */

(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════
  // CONSTANTES E CONFIGURAÇÃO
  // ══════════════════════════════════════════════════════════

  const TOTAL_STEPS = 5;
  const VIACEP_URL = "https://viacep.com.br/ws/{CEP}/json/";

  /**
   * Regex de senha forte:
   *  (?=.*[a-z])      → pelo menos 1 minúscula
   *  (?=.*[A-Z])      → pelo menos 1 maiúscula
   *  (?=.*\d)         → pelo menos 1 dígito
   *  (?=.*[!@#$%^&*]) → pelo menos 1 especial
   *  .{8,}            → mínimo 8 caracteres
   */
  const SENHA_FORTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  /** Requisitos individuais para o checklist visual */
  const SENHA_REQUISITOS = {
    length:  { regex: /.{8,}/,           label: "Mínimo 8 caracteres" },
    upper:   { regex: /[A-Z]/,           label: "Uma letra maiúscula" },
    lower:   { regex: /[a-z]/,           label: "Uma letra minúscula" },
    number:  { regex: /\d/,              label: "Um número" },
    special: { regex: /[!@#$%^&*]/,      label: "Um caractere especial" },
  };

  /** Rótulos de força por pontuação (1–4) */
  const FORCA_LABELS = {
    1: "Fraca",
    2: "Regular",
    3: "Boa",
    4: "Forte",
  };

  // ══════════════════════════════════════════════════════════
  // ESTADO
  // ══════════════════════════════════════════════════════════

  let currentStep = 1;

  // ══════════════════════════════════════════════════════════
  // SELETORES
  // ══════════════════════════════════════════════════════════

  const form           = document.getElementById("register-form");
  const feedbackEl     = document.getElementById("register-feedback");
  const progressFill   = document.getElementById("progress-fill");
  const progressLabel  = document.getElementById("progress-label");
  const progressBar    = progressFill.closest("[role='progressbar']");
  const btnAvancar     = document.getElementById("btn-avancar");
  const btnVoltar      = document.getElementById("btn-voltar");

  // Step 1
  const inputNome       = document.getElementById("reg-nome");
  const erroNome        = document.getElementById("nome-error");
  const inputNascimento = document.getElementById("reg-nascimento");
  const erroNascimento  = document.getElementById("nascimento-error");

  // Step 2
  const inputTelefone   = document.getElementById("reg-telefone");
  const erroTelefone    = document.getElementById("telefone-error");

  // Step 3
  const inputCep        = document.getElementById("reg-cep");
  const erroCep         = document.getElementById("cep-error");
  const cepSpinner      = document.getElementById("cep-spinner");
  const inputRua        = document.getElementById("reg-rua");
  const erroRua         = document.getElementById("rua-error");
  const inputNumero     = document.getElementById("reg-numero");
  const erroNumero      = document.getElementById("numero-error");
  const inputBairro     = document.getElementById("reg-bairro");
  const erroBairro      = document.getElementById("bairro-error");
  const inputCidade     = document.getElementById("reg-cidade");
  const erroCidade      = document.getElementById("cidade-error");
  const inputUf         = document.getElementById("reg-uf");
  const erroUf          = document.getElementById("uf-error");

  // Step 4
  const inputEmail         = document.getElementById("reg-email");
  const erroEmail          = document.getElementById("reg-email-error");
  const inputSenha         = document.getElementById("reg-senha");
  const erroSenha          = document.getElementById("reg-senha-error");
  const inputConfirmar     = document.getElementById("reg-confirmar-senha");
  const erroConfirmar      = document.getElementById("confirmar-senha-error");
  const toggleSenha        = document.getElementById("toggle-senha");
  const toggleConfirmar    = document.getElementById("toggle-confirmar-senha");
  const strengthEl         = document.getElementById("password-strength");
  const strengthFill       = document.getElementById("strength-fill");
  const strengthLabel      = document.getElementById("strength-label");

  // Step 5
  const inputTermos       = document.getElementById("reg-termos");
  const erroTermos        = document.getElementById("termos-error");
  const inputPrivacidade  = document.getElementById("reg-privacidade");
  const erroPrivacidade   = document.getElementById("privacidade-error");

  // ══════════════════════════════════════════════════════════
  // PROGRESSO
  // ══════════════════════════════════════════════════════════

  /**
   * Atualiza a barra de progresso e o label textual.
   * @param {number} step - Step atual (1–5)
   */
  function atualizarProgresso(step) {
    const pct = (step / TOTAL_STEPS) * 100;
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `Passo ${step} de ${TOTAL_STEPS}`;
    progressBar.setAttribute("aria-valuenow", step);
  }

  // ══════════════════════════════════════════════════════════
  // NAVEGAÇÃO ENTRE STEPS
  // ══════════════════════════════════════════════════════════

  /**
   * Transiciona do step atual para o próximo ou anterior.
   * Direção "forward": novo step entra da direita.
   * Direção "backward": novo step entra da esquerda.
   *
   * @param {number} de   - Step de origem
   * @param {number} para - Step de destino
   * @param {"forward"|"backward"} direcao
   */
  function transicionarStep(de, para, direcao) {
    const stepAtual = document.getElementById(`step-${de}`);
    const proxStep  = document.getElementById(`step-${para}`);

    const classeEntrada = direcao === "forward" ? "step--enter-right" : "step--enter-left";
    const classeSaida   = direcao === "forward" ? "step--exit-left"   : "step--exit-right";

    // Anima saída do step atual
    stepAtual.classList.add(classeSaida);

    // Após a animação de saída, esconde e limpa
    stepAtual.addEventListener("animationend", function handleSaida() {
      stepAtual.removeEventListener("animationend", handleSaida);
      stepAtual.classList.remove("step--active", classeSaida);
      stepAtual.hidden = true;
    }, { once: true });

    // Prepara e anima entrada do próximo step
    proxStep.hidden = false;
    proxStep.classList.add("step--active", classeEntrada);

    proxStep.addEventListener("animationend", function handleEntrada() {
      proxStep.removeEventListener("animationend", handleEntrada);
      proxStep.classList.remove(classeEntrada);
    }, { once: true });

    currentStep = para;
    atualizarProgresso(para);
    atualizarBotoesNav(para);

    // Foca o primeiro campo interativo do novo step para acessibilidade
    const primeiroCampo = proxStep.querySelector("input, select, textarea");
    if (primeiroCampo) primeiroCampo.focus();
  }

  /**
   * Atualiza rótulo e visibilidade dos botões de navegação.
   * @param {number} step
   */
  function atualizarBotoesNav(step) {
    // Botão Voltar: escondido no step 1
    btnVoltar.hidden = step === 1;

    // Botão Avançar: muda para "Criar conta" no último step
    if (step === TOTAL_STEPS) {
      btnAvancar.innerHTML = `
        <i data-lucide="circle-check-big" aria-hidden="true"></i>
        Criar conta
      `;
      btnAvancar.setAttribute("aria-label", "Criar conta");
    } else {
      btnAvancar.innerHTML = `
        Avançar
        <i data-lucide="arrow-right" aria-hidden="true"></i>
      `;
      btnAvancar.setAttribute("aria-label", "Avançar para o próximo passo");
    }

    // Reinicia os ícones Lucide para os botões recém-renderizados
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // ══════════════════════════════════════════════════════════
  // VALIDAÇÃO POR STEP
  // ══════════════════════════════════════════════════════════

  /**
   * Valida os campos do step informado.
   * Retorna true se tudo válido, false caso contrário.
   * @param {number} step
   * @returns {boolean}
   */
  function validarStep(step) {
    switch (step) {
      case 1: return validarStep1();
      case 2: return validarStep2();
      case 3: return validarStep3();
      case 4: return validarStep4();
      case 5: return validarStep5();
      default: return true;
    }
  }

  // ── Step 1: Dados pessoais ───────────────────────────────

  function validarStep1() {
    let valido = true;

    // Nome: obrigatório + mínimo 3 caracteres + pelo menos dois termos
    const nome = inputNome.value.trim();
    if (!nome) {
      Validators.setFieldError(inputNome, erroNome, "Informe seu nome completo.");
      valido = false;
    } else if (nome.length < 3) {
      Validators.setFieldError(inputNome, erroNome, "Nome muito curto.");
      valido = false;
    } else if (!nome.includes(" ")) {
      Validators.setFieldError(inputNome, erroNome, "Informe nome e sobrenome.");
      valido = false;
    } else {
      Validators.clearFieldError(inputNome, erroNome);
    }

    // Data de nascimento: obrigatório + não pode ser futura + mínimo 5 anos
    const nascVal = inputNascimento.value;
    if (!nascVal) {
      Validators.setFieldError(inputNascimento, erroNascimento, "Informe sua data de nascimento.");
      valido = false;
    } else {
      const nasc  = new Date(nascVal);
      const hoje  = new Date();
      const idade = calcularIdade(nasc, hoje);

      if (nasc > hoje) {
        Validators.setFieldError(inputNascimento, erroNascimento, "A data não pode ser futura.");
        valido = false;
      } else if (idade < 5) {
        Validators.setFieldError(inputNascimento, erroNascimento, "Data de nascimento inválida.");
        valido = false;
      } else {
        Validators.clearFieldError(inputNascimento, erroNascimento);
      }
    }

    return valido;
  }

  /**
   * Calcula a idade em anos completos.
   * @param {Date} nascimento
   * @param {Date} referencia
   * @returns {number}
   */
  function calcularIdade(nascimento, referencia) {
    let idade = referencia.getFullYear() - nascimento.getFullYear();
    const m = referencia.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && referencia.getDate() < nascimento.getDate())) idade--;
    return idade;
  }

  // ── Step 2: Contato ──────────────────────────────────────

  function validarStep2() {
    const tel = inputTelefone.value.replace(/\D/g, ""); // apenas dígitos

    if (!tel) {
      Validators.setFieldError(inputTelefone, erroTelefone, "Informe seu telefone.");
      return false;
    }
    // Aceita 10 dígitos (fixo com DDD) ou 11 dígitos (celular com DDD)
    if (tel.length < 10 || tel.length > 11) {
      Validators.setFieldError(inputTelefone, erroTelefone, "Telefone inválido. Ex: (22) 99999-9999");
      return false;
    }

    Validators.clearFieldError(inputTelefone, erroTelefone);
    return true;
  }

  // ── Step 3: Endereço ─────────────────────────────────────

  function validarStep3() {
    let valido = true;

    // CEP
    const cepVal = inputCep.value.replace(/\D/g, "");
    if (!cepVal) {
      Validators.setFieldError(inputCep, erroCep, "Informe o CEP.");
      valido = false;
    } else if (cepVal.length !== 8) {
      Validators.setFieldError(inputCep, erroCep, "CEP inválido.");
      valido = false;
    } else {
      Validators.clearFieldError(inputCep, erroCep);
    }

    // Rua
    if (!Validators.validarObrigatorio(inputRua, erroRua, "Informe a rua.")) valido = false;

    // Número
    if (!Validators.validarObrigatorio(inputNumero, erroNumero, "Informe o número.")) valido = false;

    // Bairro
    if (!Validators.validarObrigatorio(inputBairro, erroBairro, "Informe o bairro.")) valido = false;

    // Cidade
    if (!Validators.validarObrigatorio(inputCidade, erroCidade, "Informe a cidade.")) valido = false;

    // UF
    const uf = inputUf.value.trim();
    if (!uf) {
      Validators.setFieldError(inputUf, erroUf, "Informe o estado.");
      valido = false;
    } else if (!/^[A-Za-z]{2}$/.test(uf)) {
      Validators.setFieldError(inputUf, erroUf, "UF inválida.");
      valido = false;
    } else {
      Validators.clearFieldError(inputUf, erroUf);
    }

    return valido;
  }

  // ── Step 4: Acesso à conta ───────────────────────────────

  function validarStep4() {
    let valido = true;

    // E-mail
    if (!Validators.validarEmail(inputEmail, erroEmail)) valido = false;

    // Senha forte
    if (!validarSenhaForte(inputSenha, erroSenha)) valido = false;

    // Confirmação de senha
    if (!validarConfirmacaoSenha()) valido = false;

    return valido;
  }

  /**
   * Valida senha contra a regex de força.
   * Não altera o comportamento de Validators.validarSenha() existente.
   */
  function validarSenhaForte(input, errorEl) {
    const val = input.value;

    if (!val) {
      Validators.setFieldError(input, errorEl, "Informe sua senha.");
      return false;
    }
    if (!SENHA_FORTE_REGEX.test(val)) {
      Validators.setFieldError(input, errorEl, "A senha não atende aos requisitos abaixo.");
      return false;
    }

    Validators.clearFieldError(input, errorEl);
    return true;
  }

  function validarConfirmacaoSenha() {
    const senha    = inputSenha.value;
    const confirma = inputConfirmar.value;

    if (!confirma) {
      Validators.setFieldError(inputConfirmar, erroConfirmar, "Confirme sua senha.");
      return false;
    }
    if (senha !== confirma) {
      Validators.setFieldError(inputConfirmar, erroConfirmar, "As senhas não coincidem.");
      return false;
    }

    Validators.clearFieldError(inputConfirmar, erroConfirmar);
    return true;
  }

  // ── Step 5: Consentimentos ───────────────────────────────

  function validarStep5() {
    let valido = true;

    if (!inputTermos.checked) {
      Validators.setFieldError(inputTermos, erroTermos, "Você precisa aceitar os Termos de Uso.");
      valido = false;
    } else {
      Validators.clearFieldError(inputTermos, erroTermos);
    }

    if (!inputPrivacidade.checked) {
      Validators.setFieldError(inputPrivacidade, erroPrivacidade, "Você precisa aceitar a Política de Privacidade.");
      valido = false;
    } else {
      Validators.clearFieldError(inputPrivacidade, erroPrivacidade);
    }

    return valido;
  }

  // ══════════════════════════════════════════════════════════
  // MEDIDOR DE FORÇA DE SENHA
  // ══════════════════════════════════════════════════════════

  /**
   * Calcula a pontuação de força da senha (0–4).
   * Cada requisito atendido soma 1 ponto.
   * @param {string} senha
   * @returns {number} 0–4
   */
  function calcularForca(senha) {
    if (!senha) return 0;
    return Object.values(SENHA_REQUISITOS).filter(({ regex }) => regex.test(senha)).length;
  }

  /**
   * Atualiza o medidor visual e a lista de requisitos.
   * @param {string} senha
   */
  function atualizarMedidorForca(senha) {
    const forca = calcularForca(senha);

    // Exibe o medidor assim que o campo tem valor
    if (senha.length > 0) {
      strengthEl.classList.add("is-visible");
    } else {
      strengthEl.classList.remove("is-visible");
    }

    // Atualiza barra e rótulo
    if (forca > 0) {
      strengthFill.setAttribute("data-strength", forca);
      strengthLabel.setAttribute("data-strength", forca);
      strengthLabel.textContent = FORCA_LABELS[forca];
    } else {
      strengthFill.removeAttribute("data-strength");
      strengthLabel.removeAttribute("data-strength");
      strengthLabel.textContent = "";
    }

    // Atualiza cada requisito da lista
    Object.entries(SENHA_REQUISITOS).forEach(([key, { regex }]) => {
      const item = document.getElementById(`req-${key}`);
      if (!item) return;

      const atendido = regex.test(senha);
      const icone    = item.querySelector("[data-lucide]");

      item.classList.toggle("is-met", atendido);

      // Troca o ícone: circle → circle-check
      if (icone) {
        icone.setAttribute("data-lucide", atendido ? "circle-check" : "circle");
      }
    });

    // Reinicia ícones Lucide apenas nos requisitos
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // ══════════════════════════════════════════════════════════
  // TOGGLE DE VISIBILIDADE DE SENHA
  // ══════════════════════════════════════════════════════════

  /**
   * Alterna type="password" ↔ type="text" e atualiza ícone + aria-pressed.
   * @param {HTMLButtonElement} btn   - Botão toggle
   * @param {HTMLInputElement}  input - Campo de senha
   */
  function setupToggleSenha(btn, input) {
    btn.addEventListener("click", () => {
      const visivel = input.type === "text";
      input.type = visivel ? "password" : "text";
      btn.setAttribute("aria-pressed", String(!visivel));
      btn.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");

      const icone = btn.querySelector("[data-lucide]");
      if (icone) {
        icone.setAttribute("data-lucide", visivel ? "eye" : "eye-off");
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // MÁSCARA DE TELEFONE
  // ══════════════════════════════════════════════════════════

  /**
   * Aplica máscara brasileira: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
   * Funciona no evento input para formatar em tempo real.
   */
  function mascaraTelefone(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (val.length > 10) {
      // Celular: (XX) XXXXX-XXXX
      val = val.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    } else if (val.length > 6) {
      // Fixo: (XX) XXXX-XXXX
      val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      val = val.replace(/^(\d{0,2})/, "($1");
    }
    e.target.value = val;
  }

  // ══════════════════════════════════════════════════════════
  // MÁSCARA DE CEP
  // ══════════════════════════════════════════════════════════

  function mascaraCep(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (val.length > 5) {
      val = val.replace(/^(\d{5})(\d{0,3})/, "$1-$2");
    }
    e.target.value = val;
  }

  // ══════════════════════════════════════════════════════════
  // AUTOCOMPLETE VIA VIACEP
  // ══════════════════════════════════════════════════════════

  /**
   * Busca o endereço na API ViaCEP e preenche os campos.
   * Exibe spinner durante a requisição.
   * @param {string} cep - CEP sem formatação (8 dígitos)
   */
  async function buscarCep(cep) {
    if (cep.length !== 8) return;

    // Limpa erros anteriores e exibe spinner
    Validators.clearFieldError(inputCep, erroCep);
    cepSpinner.classList.add("is-loading");

    // Desabilita campos de endereço durante a busca
    setEnderecoDisabled(true);

    try {
      const url      = VIACEP_URL.replace("{CEP}", cep);
      const response = await fetch(url);

      if (!response.ok) throw new Error("Erro na requisição");

      const data = await response.json();

      if (data.erro) {
        Validators.setFieldError(inputCep, erroCep, "CEP não encontrado. Verifique e tente novamente.");
        limparCamposEndereco();
        return;
      }

      // Preenche os campos com os dados retornados
      inputRua.value    = data.logradouro  || "";
      inputBairro.value = data.bairro      || "";
      inputCidade.value = data.localidade  || "";
      inputUf.value     = data.uf          || "";

      // Limpa erros dos campos preenchidos automaticamente
      [
        [inputRua, erroRua],
        [inputBairro, erroBairro],
        [inputCidade, erroCidade],
        [inputUf, erroUf],
      ].forEach(([input, erro]) => Validators.clearFieldError(input, erro));

      // Foca no campo Número após preenchimento automático
      inputNumero.focus();

    } catch (_err) {
      Validators.setFieldError(inputCep, erroCep, "Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      cepSpinner.classList.remove("is-loading");
      setEnderecoDisabled(false);
    }
  }

  function setEnderecoDisabled(disabled) {
    [inputRua, inputBairro, inputCidade, inputUf].forEach(input => {
      input.disabled = disabled;
    });
  }

  function limparCamposEndereco() {
    [inputRua, inputBairro, inputCidade, inputUf].forEach(input => {
      input.value = "";
    });
    inputNumero.value = "";
  }

  // ══════════════════════════════════════════════════════════
  // FEEDBACK GERAL
  // ══════════════════════════════════════════════════════════

  function exibirFeedback(msg) {
    feedbackEl.textContent = msg;
    feedbackEl.classList.add("is-visible");
  }

  function limparFeedback() {
    feedbackEl.textContent = "";
    feedbackEl.classList.remove("is-visible");
  }

  // ══════════════════════════════════════════════════════════
  // SUBMIT FINAL
  // ══════════════════════════════════════════════════════════

  /**
   * Cadastra o usuário no Supabase Auth e insere o endereço no banco.
   *
   * Fluxo:
   *  1. signUp() com e-mail e senha.
   *     O campo `data` é lido pelo trigger `handle_new_user` no banco,
   *     que insere automaticamente a linha em public.profiles.
   *  2. Insert do endereço em public.enderecos usando o id do novo usuário.
   *  3. Redireciona para o login com parâmetro de sucesso.
   */
  async function submeterCadastro() {
    // Desabilita o botão para evitar duplo clique
    btnAvancar.disabled = true;
    btnAvancar.textContent = "Criando conta...";

    if (!SupabaseClient) {
      exibirFeedback("Erro interno. Tente novamente em instantes.");
      btnAvancar.disabled = false;
      return;
    }

    const email = inputEmail.value.trim().toLowerCase();
    const senha = inputSenha.value;

    // ── 1. Cria o usuário no Auth ──────────────────────────
    const { data: signUpData, error: signUpError } = await SupabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        // Esses dados são lidos pelo trigger handle_new_user
        // e inseridos em public.profiles automaticamente.
        data: {
          nome:       inputNome.value.trim(),
          nascimento: inputNascimento.value,
          telefone:   inputTelefone.value,
          marketing:  document.getElementById("reg-marketing").checked,
        },
      },
    });

    if (signUpError) {
      // E-mail já cadastrado é o erro mais comum
      const msgAmigavel = signUpError.message.includes("already registered")
        ? "Este e-mail já está cadastrado. Tente fazer login."
        : "Não foi possível criar sua conta. Tente novamente.";

      exibirFeedback(msgAmigavel);
      btnAvancar.disabled = false;
      atualizarBotoesNav(currentStep);
      return;
    }

    const userId = signUpData.user?.id;

    // ── 2. Insere o endereço ───────────────────────────────
    if (userId) {
      const { error: enderecoError } = await SupabaseClient
        .from("enderecos")
        .insert({
          user_id:     userId,
          cep:         inputCep.value,
          rua:         inputRua.value.trim(),
          numero:      inputNumero.value.trim(),
          complemento: document.getElementById("reg-complemento").value.trim(),
          bairro:      inputBairro.value.trim(),
          cidade:      inputCidade.value.trim(),
          uf:          inputUf.value.trim().toUpperCase(),
          principal:   true,
        });

      if (enderecoError) {
        // O usuário foi criado, mas o endereço falhou.
        // Não bloqueamos o cadastro por isso — o usuário pode
        // adicionar/corrigir o endereço depois no perfil.
        console.warn("[cadastro] Endereço não salvo:", enderecoError.message);
      }
    }

    // ── 3. Redireciona para o login ────────────────────────
    window.location.href = "login.html?cadastro=sucesso";
  }

  // ══════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════════════════════

  function init() {
    // ── Botão Avançar ────────────────────────────────────────
    btnAvancar.addEventListener("click", async () => {
      limparFeedback();

      if (!validarStep(currentStep)) {
        // Anuncia erro para leitores de tela via feedback
        exibirFeedback("Corrija os campos destacados antes de continuar.");
        return;
      }

      if (currentStep === TOTAL_STEPS) {
        // Último step: submete o cadastro
        await submeterCadastro();
        return;
      }

      transicionarStep(currentStep, currentStep + 1, "forward");
    });

    // ── Botão Voltar ─────────────────────────────────────────
    btnVoltar.addEventListener("click", () => {
      limparFeedback();
      transicionarStep(currentStep, currentStep - 1, "backward");
    });

    // ── Máscaras em tempo real ───────────────────────────────
    inputTelefone.addEventListener("input", mascaraTelefone);
    inputCep.addEventListener("input", mascaraCep);

    // ── Autocomplete CEP (blur) ──────────────────────────────
    inputCep.addEventListener("blur", () => {
      const cep = inputCep.value.replace(/\D/g, "");
      if (cep.length === 8) buscarCep(cep);
    });

    // ── Validação inline no blur (feedback imediato) ─────────
    inputNome.addEventListener("blur",       () => validarStep1());
    inputNascimento.addEventListener("blur", () => validarStep1());
    inputTelefone.addEventListener("blur",   () => validarStep2());
    inputEmail.addEventListener("blur",      () => Validators.validarEmail(inputEmail, erroEmail));
    inputSenha.addEventListener("blur",      () => validarSenhaForte(inputSenha, erroSenha));
    inputConfirmar.addEventListener("blur",  () => validarConfirmacaoSenha());

    // ── Medidor de força (input em tempo real) ───────────────
    inputSenha.addEventListener("input", () => {
      atualizarMedidorForca(inputSenha.value);
      // Revalida confirmação se já tiver valor
      if (inputConfirmar.value) validarConfirmacaoSenha();
    });

    // ── UF em maiúsculo (input) ──────────────────────────────
    inputUf.addEventListener("input", () => {
      inputUf.value = inputUf.value.toUpperCase();
    });

    // ── Toggle de senha ──────────────────────────────────────
    setupToggleSenha(toggleSenha,     inputSenha);
    setupToggleSenha(toggleConfirmar, inputConfirmar);

    // ── Limpa erro do checkbox ao marcar ────────────────────
    inputTermos.addEventListener("change", () => {
      if (inputTermos.checked) Validators.clearFieldError(inputTermos, erroTermos);
    });
    inputPrivacidade.addEventListener("change", () => {
      if (inputPrivacidade.checked) Validators.clearFieldError(inputPrivacidade, erroPrivacidade);
    });

    // ── Estado inicial da barra e botões ────────────────────
    atualizarProgresso(1);
    atualizarBotoesNav(1);
  }

  // ── Bootstrap ────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();
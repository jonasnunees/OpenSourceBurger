/**
 * meus-dados.js
 * Lógica da página Meus Dados do Open Source Burger.
 *
 * Responsabilidades:
 *  - Verificar autenticação e redirecionar para login se necessário
 *  - Popular a faixa do usuário com o nome da sessão
 *  - Buscar os dados do perfil no Supabase (public.profiles)
 *  - Preencher o formulário com os dados retornados
 *  - Aplicar máscara de telefone em tempo real
 *  - Validar campos antes de salvar
 *  - Salvar alterações no Supabase (public.profiles)
 *  - Sincronizar o nome atualizado no sessionStorage via Auth
 *  - Realizar logout via Auth.logout()
 *
 * Dependências (ordem de carregamento no HTML):
 *  supabase.js → config.js → auth.js → lucide → validators.js → common.js → meus-dados.js
 *
 * Tabela Supabase utilizada: public.profiles
 * Colunas: id (uuid), nome (text), telefone (text), marketing (bool)
 * O e-mail vem de auth.users — não é editável diretamente pelo usuário.
 *
 * Expõe: nada (IIFE sem namespace público necessário nesta página)
 */

(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════
  // SELETORES
  // ══════════════════════════════════════════════════════════

  const accountNameEl  = document.getElementById("account-name");
  const btnLogout      = document.getElementById("btn-logout");

  const form           = document.getElementById("dados-form");
  const feedbackEl     = document.getElementById("dados-feedback");
  const btnSalvar      = document.getElementById("btn-salvar");

  const inputNome      = document.getElementById("dados-nome");
  const erroNome       = document.getElementById("dados-nome-error");
  const inputEmail     = document.getElementById("dados-email");
  const inputTelefone  = document.getElementById("dados-telefone");
  const erroTelefone   = document.getElementById("dados-telefone-error");
  const inputMarketing = document.getElementById("dados-marketing");

  // ══════════════════════════════════════════════════════════
  // FAIXA DO USUÁRIO
  // ══════════════════════════════════════════════════════════

  function renderUserBanner() {
    const session = Auth.getSession();
    if (!session?.name) return;
    accountNameEl.textContent = session.name.toUpperCase();
  }

  // ══════════════════════════════════════════════════════════
  // MÁSCARA DE TELEFONE
  // ══════════════════════════════════════════════════════════

  /**
   * Aplica máscara brasileira em tempo real.
   * (XX) XXXXX-XXXX para celular | (XX) XXXX-XXXX para fixo
   */
  function mascaraTelefone(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 11);

    if (val.length > 10) {
      val = val.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    } else if (val.length > 6) {
      val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      val = val.replace(/^(\d{0,2})/, "($1");
    }

    e.target.value = val;
  }

  // ══════════════════════════════════════════════════════════
  // BUSCA DE DADOS
  // ══════════════════════════════════════════════════════════

  /**
   * Busca o perfil do usuário autenticado em public.profiles
   * e preenche o formulário com os dados retornados.
   *
   * O e-mail vem da sessão em cache — não requer query extra,
   * pois está disponível via Auth.getSession() e não é editável.
   */
  async function carregarDados() {
    const session = Auth.getSession();
    if (!session?.id) return;

    // E-mail: vem da sessão, não do profiles
    inputEmail.value = session.email ?? "";

    const { data, error } = await SupabaseClient
      .from("profiles")
      .select("nome, telefone, marketing")
      .eq("id", session.id)
      .single();

    if (error) {
      exibirFeedback("Não foi possível carregar seus dados. Tente novamente.", "error");
      return;
    }

    inputNome.value          = data.nome      ?? "";
    inputTelefone.value      = data.telefone  ?? "";
    inputMarketing.checked   = data.marketing ?? false;
  }

  // ══════════════════════════════════════════════════════════
  // VALIDAÇÃO
  // ══════════════════════════════════════════════════════════

  function validarFormulario() {
    let valido = true;

    // Nome: obrigatório + mínimo 3 caracteres + nome e sobrenome
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

    // Telefone: opcional, mas se preenchido deve ser válido
    const tel = inputTelefone.value.replace(/\D/g, "");
    if (tel && (tel.length < 10 || tel.length > 11)) {
      Validators.setFieldError(
        inputTelefone,
        erroTelefone,
        "Telefone inválido. Ex: (22) 99999-9999"
      );
      valido = false;
    } else {
      Validators.clearFieldError(inputTelefone, erroTelefone);
    }

    return valido;
  }

  // ══════════════════════════════════════════════════════════
  // FEEDBACK
  // ══════════════════════════════════════════════════════════

  /**
   * Exibe o banner de feedback com a classe de estado correta.
   * @param {string} msg
   * @param {"error"|"success"} tipo
   */
  function exibirFeedback(msg, tipo) {
    feedbackEl.textContent = msg;
    feedbackEl.classList.remove("is-error", "is-success");
    feedbackEl.classList.add("is-visible", `is-${tipo}`);
  }

  function limparFeedback() {
    feedbackEl.textContent = "";
    feedbackEl.classList.remove("is-visible", "is-error", "is-success");
  }

  // ══════════════════════════════════════════════════════════
  // SALVAR ALTERAÇÕES
  // ══════════════════════════════════════════════════════════

  /**
   * Persiste os dados alterados em public.profiles.
   *
   * Após salvar com sucesso, sincroniza o nome no sessionStorage
   * para que a faixa do usuário e outras páginas reflitam
   * o novo nome sem precisar de nova consulta ao Supabase.
   */
  async function salvarDados() {
    if (!validarFormulario()) return;

    const session = Auth.getSession();
    if (!session?.id) return;

    btnSalvar.disabled    = true;
    btnSalvar.textContent = "Salvando...";
    limparFeedback();

    const { error } = await SupabaseClient
      .from("profiles")
      .update({
        nome:      inputNome.value.trim(),
        telefone:  inputTelefone.value.trim() || null,
        marketing: inputMarketing.checked,
      })
      .eq("id", session.id);

    if (error) {
      exibirFeedback("Não foi possível salvar as alterações. Tente novamente.", "error");
      btnSalvar.disabled    = false;
      btnSalvar.textContent = "Salvar Alterações";
      return;
    }

    // Atualiza o nome no espelho local da sessão
    const sessaoAtualizada = { ...session, name: inputNome.value.trim() };
    sessionStorage.setItem("osb_session", JSON.stringify(sessaoAtualizada));

    // Atualiza a faixa do usuário na página atual
    accountNameEl.textContent = sessaoAtualizada.name.toUpperCase();

    exibirFeedback("Dados salvos com sucesso!", "success");
    btnSalvar.disabled    = false;
    btnSalvar.textContent = "Salvar Alterações";
  }

  // ══════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════

  function initLogout() {
    btnLogout.addEventListener("click", () => {
      Auth.logout();
    });
  }

  // ══════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════════════════════

  function initEventListeners() {
    // Máscara de telefone em tempo real
    inputTelefone.addEventListener("input", mascaraTelefone);

    // Validação inline no blur
    inputNome.addEventListener("blur", validarFormulario);
    inputTelefone.addEventListener("blur", validarFormulario);

    // Limpa feedback ao editar
    [inputNome, inputTelefone].forEach((input) => {
      input.addEventListener("input", limparFeedback);
    });

    // Submit
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      salvarDados();
    });
  }

  // ══════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════

  async function init() {
    // Valida sessão — redireciona para login se não autenticado
    Auth.requireAuth();

    renderUserBanner();
    initLogout();
    initEventListeners();

    // Carrega os dados do perfil — operação assíncrona,
    // feita após inicializar os listeners para não bloquear a UI
    await carregarDados();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
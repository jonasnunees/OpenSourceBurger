/**
 * editar-endereco.js
 * Lógica da página de criação e edição de endereço.
 *
 * Responsabilidades:
 *  - Detectar modo: criação (sem ?id=) ou edição (com ?id=uuid)
 *  - Atualizar o título da topbar conforme o modo
 *  - Popular o formulário com os dados do endereço no modo edição
 *  - Autocomplete de endereço via ViaCEP
 *  - Validar campos obrigatórios antes de salvar
 *  - Criar ou atualizar o endereço no Supabase
 *  - Garantir que ao marcar como principal, o anterior perde a flag
 *  - Verificar limite de 5 endereços no modo criação
 *  - Excluir o endereço no modo edição com confirmação
 *  - Redirecionar para enderecos.html após operação bem-sucedida
 *
 * Dependências:
 *  supabase.js → config.js → auth.js → lucide → validators.js → common.js → editar-endereco.js
 *
 * Expõe: nada (IIFE)
 */

(() => {
  "use strict";

  const LIMITE_ENDERECOS = 5;
  const VIACEP_URL = "https://viacep.com.br/ws/{CEP}/json/";

  // ── Estado ─────────────────────────────────────────────────
  let enderecoId = null; // null = modo criação

  // ── Seletores ──────────────────────────────────────────────
  const accountNameEl  = document.getElementById("account-name");
  const btnLogout      = document.getElementById("btn-logout");
  const topbarTitulo   = document.getElementById("topbar-titulo");
  const feedbackEl     = document.getElementById("endereco-feedback");
  const form           = document.getElementById("endereco-form");
  const btnSalvar      = document.getElementById("btn-salvar-endereco");
  const btnExcluir     = document.getElementById("btn-excluir-endereco");

  const selectTitulo   = document.getElementById("end-titulo");
  const inputCep       = document.getElementById("end-cep");
  const erroCep        = document.getElementById("end-cep-error");
  const cepSpinner     = document.getElementById("cep-spinner");
  const inputRua       = document.getElementById("end-rua");
  const erroRua        = document.getElementById("end-rua-error");
  const inputNumero    = document.getElementById("end-numero");
  const erroNumero     = document.getElementById("end-numero-error");
  const inputCompl     = document.getElementById("end-complemento");
  const inputBairro    = document.getElementById("end-bairro");
  const erroBairro     = document.getElementById("end-bairro-error");
  const inputCidade    = document.getElementById("end-cidade");
  const erroCidade     = document.getElementById("end-cidade-error");
  const inputUf        = document.getElementById("end-uf");
  const erroUf         = document.getElementById("end-uf-error");
  const checkPrincipal = document.getElementById("end-principal");

  // ── Faixa do usuário ───────────────────────────────────────
  function renderUserBanner() {
    const session = Auth.getSession();
    if (!session?.name) return;
    accountNameEl.textContent = session.name.toUpperCase();
  }

  // ── Feedback ───────────────────────────────────────────────
  function exibirFeedback(msg, tipo) {
    feedbackEl.textContent = msg;
    feedbackEl.classList.remove("is-error", "is-success");
    feedbackEl.classList.add("is-visible", `is-${tipo}`);
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function limparFeedback() {
    feedbackEl.textContent = "";
    feedbackEl.classList.remove("is-visible", "is-error", "is-success");
  }

  // ── Máscara de CEP ─────────────────────────────────────────
  function mascaraCep(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (val.length > 5) val = val.replace(/^(\d{5})(\d{0,3})/, "$1-$2");
    e.target.value = val;
  }

  // ── ViaCEP ─────────────────────────────────────────────────
  function setEnderecoDisabled(disabled) {
    [inputRua, inputBairro, inputCidade, inputUf].forEach(
      (el) => (el.disabled = disabled)
    );
  }

  async function buscarCep(cep) {
    if (cep.length !== 8) return;

    Validators.clearFieldError(inputCep, erroCep);
    cepSpinner.classList.add("is-loading");
    setEnderecoDisabled(true);

    try {
      const res  = await fetch(VIACEP_URL.replace("{CEP}", cep));
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.erro) {
        Validators.setFieldError(inputCep, erroCep, "CEP não encontrado.");
        [inputRua, inputBairro, inputCidade, inputUf].forEach(
          (el) => (el.value = "")
        );
        return;
      }

      inputRua.value    = data.logradouro || "";
      inputBairro.value = data.bairro     || "";
      inputCidade.value = data.localidade || "";
      inputUf.value     = data.uf         || "";

      [
        [inputRua, erroRua],
        [inputBairro, erroBairro],
        [inputCidade, erroCidade],
        [inputUf, erroUf],
      ].forEach(([el, err]) => Validators.clearFieldError(el, err));

      inputNumero.focus();
    } catch {
      Validators.setFieldError(inputCep, erroCep, "Erro ao buscar CEP. Tente novamente.");
    } finally {
      cepSpinner.classList.remove("is-loading");
      setEnderecoDisabled(false);
    }
  }

  // ── Validação ──────────────────────────────────────────────
  function validarFormulario() {
    let valido = true;

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

    if (!Validators.validarObrigatorio(inputRua,    erroRua,    "Informe a rua."))    valido = false;
    if (!Validators.validarObrigatorio(inputNumero, erroNumero, "Informe o número.")) valido = false;
    if (!Validators.validarObrigatorio(inputBairro, erroBairro, "Informe o bairro.")) valido = false;
    if (!Validators.validarObrigatorio(inputCidade, erroCidade, "Informe a cidade.")) valido = false;

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

  // ── Carregar endereço (modo edição) ────────────────────────
  async function carregarEndereco(id) {
    const session = Auth.getSession();

    const { data, error } = await SupabaseClient
      .from("enderecos")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.id)
      .single();

    if (error || !data) {
      // ID inválido ou não pertence ao usuário — redireciona
      window.location.replace("enderecos.html");
      return;
    }

    // Preenche o formulário
    selectTitulo.value      = data.titulo;
    inputCep.value          = data.cep;
    inputRua.value          = data.rua;
    inputNumero.value       = data.numero;
    inputCompl.value        = data.complemento ?? "";
    inputBairro.value       = data.bairro;
    inputCidade.value       = data.cidade;
    inputUf.value           = data.uf;
    checkPrincipal.checked  = data.principal;

    // Modo edição: exibe botão excluir e atualiza topbar
    topbarTitulo.textContent = "Editar Endereço";
    btnExcluir.hidden = false;
  }

  // ── Salvar (criar ou atualizar) ────────────────────────────
  async function salvarEndereco() {
    if (!validarFormulario()) return;

    const session = Auth.getSession();
    btnSalvar.disabled    = true;
    btnSalvar.textContent = "Salvando...";
    limparFeedback();

    const payload = {
      titulo:      selectTitulo.value,
      cep:         inputCep.value,
      rua:         inputRua.value.trim(),
      numero:      inputNumero.value.trim(),
      complemento: inputCompl.value.trim() || null,
      bairro:      inputBairro.value.trim(),
      cidade:      inputCidade.value.trim(),
      uf:          inputUf.value.trim().toUpperCase(),
      principal:   checkPrincipal.checked,
    };

    try {
      // Se marcar como principal, remove a flag dos outros endereços primeiro.
      // O índice único do banco garante consistência, mas fazemos aqui também
      // para evitar o erro de constraint.
      if (payload.principal) {
        await SupabaseClient
          .from("enderecos")
          .update({ principal: false })
          .eq("user_id", session.id)
          .neq("id", enderecoId ?? "00000000-0000-0000-0000-000000000000");
      }

      if (enderecoId) {
        // Modo edição: atualiza
        const { error } = await SupabaseClient
          .from("enderecos")
          .update(payload)
          .eq("id", enderecoId)
          .eq("user_id", session.id);

        if (error) throw error;
      } else {
        // Modo criação: verifica limite antes de inserir
        const { count, error: countError } = await SupabaseClient
          .from("enderecos")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.id);

        if (countError) throw countError;

        if (count >= LIMITE_ENDERECOS) {
          exibirFeedback(
            `Limite de ${LIMITE_ENDERECOS} endereços atingido.`,
            "error"
          );
          return;
        }

        const { error } = await SupabaseClient
          .from("enderecos")
          .insert({ ...payload, user_id: session.id });

        if (error) throw error;
      }

      window.location.replace("enderecos.html");

    } catch {
      exibirFeedback("Não foi possível salvar o endereço. Tente novamente.", "error");
    } finally {
      btnSalvar.disabled    = false;
      btnSalvar.textContent = "Salvar Endereço";
    }
  }

  // ── Excluir ────────────────────────────────────────────────

  /**
   * Exclui o endereço após confirmação do usuário.
   * Endereço principal não pode ser excluído diretamente —
   * o usuário precisa definir outro como principal antes.
   */
  async function excluirEndereco() {
    if (!enderecoId) return;

    if (checkPrincipal.checked) {
      exibirFeedback(
        "Não é possível excluir o endereço principal. Defina outro endereço como principal antes.",
        "error"
      );
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    btnExcluir.disabled = true;

    const { error } = await SupabaseClient
      .from("enderecos")
      .delete()
      .eq("id", enderecoId)
      .eq("user_id", Auth.getSession().id);

    if (error) {
      exibirFeedback("Não foi possível excluir o endereço. Tente novamente.", "error");
      btnExcluir.disabled = false;
      return;
    }

    window.location.replace("enderecos.html");
  }

  // ── Event listeners ────────────────────────────────────────
  function initEventListeners() {
    inputCep.addEventListener("input", mascaraCep);
    inputUf.addEventListener("input", () => {
      inputUf.value = inputUf.value.toUpperCase();
    });

    inputCep.addEventListener("blur", () => {
      const cep = inputCep.value.replace(/\D/g, "");
      if (cep.length === 8) buscarCep(cep);
    });

    // Validação inline no blur
    inputRua.addEventListener("blur",    () => Validators.validarObrigatorio(inputRua,    erroRua,    "Informe a rua."));
    inputNumero.addEventListener("blur", () => Validators.validarObrigatorio(inputNumero, erroNumero, "Informe o número."));
    inputBairro.addEventListener("blur", () => Validators.validarObrigatorio(inputBairro, erroBairro, "Informe o bairro."));
    inputCidade.addEventListener("blur", () => Validators.validarObrigatorio(inputCidade, erroCidade, "Informe a cidade."));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      salvarEndereco();
    });

    btnExcluir.addEventListener("click", excluirEndereco);
  }

  // ── Logout ─────────────────────────────────────────────────
  function initLogout() {
    btnLogout.addEventListener("click", () => Auth.logout());
  }

  // ── Init ───────────────────────────────────────────────────
  async function init() {
    Auth.requireAuth();
    renderUserBanner();
    initLogout();
    initEventListeners();

    // Detecta modo pela query string
    const params = new URLSearchParams(window.location.search);
    enderecoId = params.get("id") ?? null;

    if (enderecoId) {
      await carregarEndereco(enderecoId);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
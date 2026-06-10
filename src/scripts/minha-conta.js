/**
 * minha-conta.js
 * Lógica da página Minha Conta do Open Source Burger.
 *
 * Responsabilidades:
 *  - Verificar autenticação e redirecionar para login se necessário
 *  - Popular o nome do usuário na faixa superior via sessão em cache
 *  - Realizar logout via Auth.logout()
 *  - Acionar fluxo de exclusão de conta (placeholder até implementação)
 *
 * Dependências (ordem de carregamento no HTML):
 *  supabase.js → config.js → auth.js → lucide → common.js → minha-conta.js
 *
 * Expõe: nada (IIFE sem namespace público necessário nesta página)
 */

(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════
  // SELETORES
  // ══════════════════════════════════════════════════════════

  const accountName     = document.getElementById("account-name");
  const btnLogout       = document.getElementById("btn-logout");
  const btnDeleteAccount = document.getElementById("btn-delete-account");

  // ══════════════════════════════════════════════════════════
  // USUÁRIO
  // ══════════════════════════════════════════════════════════

  /**
   * Popula o nome do usuário na faixa superior.
   * O nome vem de user_metadata.nome salvo no Supabase durante o cadastro
   * e espelhado no sessionStorage via Auth._syncSession().
   */
  function renderUserBanner() {
    const session = Auth.getSession();
    if (!session?.name) return;

    accountName.textContent = session.name.toUpperCase();
  }

  // ══════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════

  /**
   * Encerra a sessão no Supabase, limpa o sessionStorage
   * e redireciona para a home. Tudo tratado pelo Auth.logout().
   */
  function initLogout() {
    btnLogout.addEventListener("click", () => {
      Auth.logout();
    });
  }

  // ══════════════════════════════════════════════════════════
  // EXCLUIR CONTA
  // ══════════════════════════════════════════════════════════

  /**
   * Aciona o fluxo de exclusão de conta.
   *
   * A exclusão de um usuário no Supabase Auth requer a service_role key,
   * que nunca deve ser exposta no frontend. O fluxo correto é:
   *  1. Exibir modal de confirmação acessível
   *  2. Chamar uma Edge Function autenticada que usa a service_role
   *     para executar auth.admin.deleteUser() no servidor
   *
   * TODO: implementar modal de confirmação acessível
   * TODO: criar Edge Function para exclusão segura da conta
   */
  function initDeleteAccount() {
    btnDeleteAccount.addEventListener("click", () => {
      // TODO: substituir pelo modal de confirmação
      alert("Funcionalidade em desenvolvimento.");
    });
  }

  // ══════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════

  function init() {
    // Valida sessão — redireciona para login se não autenticado.
    // Usa o cache do sessionStorage (síncrono): não bloqueia o render.
    Auth.requireAuth();

    renderUserBanner();
    initLogout();
    initDeleteAccount();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
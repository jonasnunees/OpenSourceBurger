/**
 * auth.js
 * Módulo de autenticação integrado ao Supabase Auth.
 *
 * Responsável por:
 * - Verificar se o usuário está logado via sessão do Supabase
 * - Redirecionar para login.html quando necessário
 * - Realizar login, logout e manter a API pública estável
 *
 * API pública (não mudou — o restante do projeto não precisa de ajustes):
 *   Auth.getSession()    → dados do usuário logado ou null
 *   Auth.isLoggedIn()    → boolean
 *   Auth.login()         → realiza signInWithPassword (chamado por login.js)
 *   Auth.logout()        → realiza signOut e redireciona para home
 *   Auth.requireAuth()   → redireciona para login se não autenticado
 *   Auth.getRedirectUrl()→ URL de retorno pós-login
 *
 * Dependências:
 *   config.js (SupabaseClient) deve ser carregado antes.
 */

const Auth = (() => {
  "use strict";

  const HOME_PAGE  = "index.html";
  const LOGIN_PAGE = "login.html";

  // ── Sessão ────────────────────────────────────────────────────────────────

  /**
   * Retorna os dados da sessão ativa do Supabase, ou null.
   *
   * Usa getSession() síncrono do cache local do SDK —
   * não faz requisição de rede, é seguro chamar a qualquer momento.
   *
   * @returns {{ id: string, name: string, email: string } | null}
   */
  function getSession() {
    if (!SupabaseClient) return null;

    // getSession() do SDK retorna uma Promise, mas o SDK também expõe
    // a sessão em cache via auth.session (síncrono, legado) e via
    // storage interno. Para manter a API síncrona do Auth, usamos
    // sessionStorage como espelho da sessão Supabase.
    try {
      const raw = sessionStorage.getItem("osb_session");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Sincroniza a sessão do Supabase com o sessionStorage local.
   * Chamado internamente após login bem-sucedido.
   *
   * @param {import('@supabase/supabase-js').User} user
   */
  function _syncSession(user) {
    const data = {
      id:    user.id,
      name:  user.user_metadata?.nome ?? user.email,
      email: user.email,
    };
    sessionStorage.setItem("osb_session", JSON.stringify(data));
  }

  /**
   * Verifica se há sessão ativa.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  /**
   * Autentica o usuário com e-mail e senha via Supabase Auth.
   *
   * Retorna { data, error } no padrão do SDK:
   *   - data.user  → objeto do usuário autenticado
   *   - error      → objeto de erro ou null
   *
   * Em caso de sucesso, sincroniza a sessão no sessionStorage.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ data: object|null, error: object|null }>}
   */
  async function login(email, password) {
    if (!SupabaseClient) {
      return { data: null, error: { message: "Cliente Supabase não inicializado." } };
    }

    const { data, error } = await SupabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      _syncSession(data.user);
    }

    return { data, error };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  /**
   * Encerra a sessão no Supabase e limpa o cache local.
   * Redireciona para a home após o logout.
   */
  async function logout() {
    if (SupabaseClient) {
      await SupabaseClient.auth.signOut();
    }

    sessionStorage.removeItem("osb_session");
    window.location.href = HOME_PAGE;
  }

  // ── Proteção de rota ──────────────────────────────────────────────────────

  /**
   * Guarda a URL atual e redireciona para o login se não autenticado.
   *
   * Para páginas protegidas que precisam de sessão ativa.
   * Usa a sessão em cache (síncrona) para não bloquear o render.
   */
  function requireAuth() {
    if (isLoggedIn()) return;

    const currentUrl  = window.location.pathname + window.location.search;
    const destination = encodeURIComponent(currentUrl);

    window.location.replace(`${LOGIN_PAGE}?redirect=${destination}`);
  }

  // ── Redirect URL ──────────────────────────────────────────────────────────

  /**
   * Verifica se a URL de redirecionamento é segura (sem URLs externas).
   * @param {string | null} redirect
   * @returns {boolean}
   */
  function isSafeRedirectUrl(redirect) {
    if (!redirect) return false;
    return !redirect.startsWith("http") && !redirect.startsWith("//");
  }

  /**
   * Retorna a URL de redirecionamento pós-login.
   * Se não houver parâmetro seguro, retorna index.html.
   * @returns {string}
   */
  function getRedirectUrl() {
    const params   = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (isSafeRedirectUrl(redirect)) return redirect;

    return HOME_PAGE;
  }

  // ── Restauração de sessão na inicialização ────────────────────────────────

  /**
   * Verifica com o Supabase se a sessão em cache ainda é válida.
   *
   * Executado silenciosamente no carregamento: se o token expirou
   * ou foi revogado, limpa o sessionStorage local para evitar
   * que o usuário fique "logado" com uma sessão inválida.
   *
   * Não bloqueia o carregamento da página (fire-and-forget).
   */
  (async function restoreSession() {
    if (!SupabaseClient) return;

    const { data } = await SupabaseClient.auth.getSession();

    if (data?.session?.user) {
      // Sessão válida: mantém/atualiza o espelho local
      _syncSession(data.session.user);
    } else {
      // Sessão expirada ou inválida: limpa o cache
      sessionStorage.removeItem("osb_session");
    }
  })();

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    getSession,
    isLoggedIn,
    login,
    logout,
    requireAuth,
    getRedirectUrl,
  };
})();
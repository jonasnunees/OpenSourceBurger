/**
 * auth.js
 * Módulo de autenticação simulada (sem backend).
 *
 * Responsável por:
 * - Verificar se o usuário está "logado" via sessionStorage
 * - Redirecionar para login.html quando necessário
 * - Realizar login/logout simulados
 *
 * Quando integrar backend real: substitua apenas as funções
 * getSession(), login() e logout() mantendo a mesma API pública.
 */

const Auth = (() => {
  const SESSION_KEY = 'osb_session';
  const HOME_PAGE = 'index.html';
  const LOGIN_PAGE = 'login.html';

  /**
   * Retorna os dados da sessão atual ou null.
   *
   * @returns {{ name: string, email: string } | null}
   */
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);

      if (!raw) return null;

      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Verifica se há sessão ativa.
   *
   * @returns {boolean}
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  /**
   * Persiste uma sessão simulada.
   *
   * @param {{ name: string, email: string }} userData
   */
  function login(userData) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  }

  /**
   * Encerra a sessão e redireciona para a home.
   */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = HOME_PAGE;
  }

  /**
   * Guarda a URL atual e redireciona para o login.
   *
   * Lê o parâmetro ?redirect= para saber onde voltar.
   */
  function requireAuth() {
    if (isLoggedIn()) return; // tudo certo, usuário logado

    const currentUrl = window.location.pathname + window.location.search;
    const destination = encodeURIComponent(currentUrl);

    window.location.replace(`${LOGIN_PAGE}?redirect=${destination}`);
  }

  /**
   * Verifica se a URL de redirecionamento é segura.
   *
   * Segurança básica:
   * - Não aceita URLs externas começando com http
   * - Não aceita URLs externas começando com //
   *
   * @param {string | null} redirect
   * @returns {boolean}
   */
  function isSafeRedirectUrl(redirect) {
    if (!redirect) return false;

    return !redirect.startsWith('http') && !redirect.startsWith('//');
  }

  /**
   * Retorna a URL de redirecionamento pós-login.
   *
   * Se não houver parâmetro, retorna index.html.
   *
   * @returns {string}
   */
  function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (isSafeRedirectUrl(redirect)) {
      return redirect;
    }

    return HOME_PAGE;
  }

  // API pública
  return {
    getSession,
    isLoggedIn,
    login,
    logout,
    requireAuth,
    getRedirectUrl,
  };
})();
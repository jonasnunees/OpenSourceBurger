/**
 * auth.js
 * Módulo de autenticação simulada (sem backend).
 * Responsável por:
 *  - Verificar se o usuário está "logado" via sessionStorage
 *  - Redirecionar para login.html quando necessário
 *  - Realizar login/logout simulados
 *
 * Quando integrar backend real: substitua apenas as funções
 * getSession(), login() e logout() mantendo a mesma API pública.
 */

const Auth = (() => {
  const SESSION_KEY = 'osb_session';

  /**
   * Retorna os dados da sessão atual ou null.
   * @returns {{ name: string, email: string } | null}
   */
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se há sessão ativa.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  /**
   * Persiste uma sessão simulada.
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
    window.location.href = 'index.html';
  }

  /**
   * Guarda a URL atual e redireciona para o login.
   * Lê o parâmetro ?redirect= para saber onde voltar.
   */
  function requireAuth() {
    if (isLoggedIn()) return; // tudo certo, usuário logado

    const destination = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`login.html?redirect=${destination}`);
  }

  /**
   * Retorna a URL de redirecionamento pós-login.
   * Se não houver parâmetro, retorna index.html.
   * @returns {string}
   */
  function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    // Segurança básica: só aceita paths relativos (sem http//)
    if (redirect && !redirect.startsWith('http') && !redirect.startsWith('//')) {
      return redirect;
    }
    return 'index.html';
  }

  // API pública
  return { getSession, isLoggedIn, login, logout, requireAuth, getRedirectUrl };
})();

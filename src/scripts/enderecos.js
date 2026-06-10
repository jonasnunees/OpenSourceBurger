/**
 * enderecos.js
 * Lógica da página Meus Endereços do Open Source Burger.
 *
 * Responsabilidades:
 *  - Verificar autenticação
 *  - Popular a faixa do usuário
 *  - Buscar endereços do Supabase (public.enderecos)
 *  - Renderizar cards clicáveis que levam para editar-endereco.html
 *  - Exibir aviso e desabilitar botão quando limite de 5 for atingido
 *  - Realizar logout
 *
 * Dependências:
 *  supabase.js → config.js → auth.js → lucide → common.js → enderecos.js
 *
 * Expõe: nada (IIFE)
 */

(() => {
  "use strict";

  const LIMITE_ENDERECOS = 5;

  // ── Seletores ──────────────────────────────────────────────
  const accountNameEl  = document.getElementById("account-name");
  const btnLogout      = document.getElementById("btn-logout");
  const loadingEl      = document.getElementById("enderecos-loading");
  const listaEl        = document.getElementById("enderecos-lista");
  const limiteEl       = document.getElementById("enderecos-limite");
  const actionsEl      = document.getElementById("enderecos-actions");
  const btnNovo        = document.getElementById("btn-novo-endereco");

  // ── Faixa do usuário ───────────────────────────────────────
  function renderUserBanner() {
    const session = Auth.getSession();
    if (!session?.name) return;
    accountNameEl.textContent = session.name.toUpperCase();
  }

  // ── Formatação ─────────────────────────────────────────────

  /**
   * Monta a string de endereço formatada para exibição no card.
   * Ex: "Rua Carlota Serpa, 382, (Casa) - Baleia, São Pedro da Aldeia/RJ"
   */
  function formatarEndereco(end) {
    const partes = [
      `${end.rua}, ${end.numero}`,
      end.complemento ? `(${end.complemento})` : null,
      `${end.bairro} - ${end.cidade}/${end.uf}`,
    ].filter(Boolean);

    return partes.join(", ");
  }

  // ── Renderização ───────────────────────────────────────────

  /**
   * Gera o HTML de um card de endereço.
   * O card é um <a> que navega para a página de edição com o id na URL.
   */
  function htmlCard(end) {
    return `
      <li>
        <a
          href="editar-endereco.html?id=${end.id}"
          class="endereco-card"
          aria-label="Editar endereço: ${end.titulo}"
        >
          <p class="endereco-card__titulo">${end.titulo}</p>
          <p class="endereco-card__endereco">${formatarEndereco(end)}</p>
        </a>
      </li>`;
  }

  // ── Busca de dados ─────────────────────────────────────────

  async function carregarEnderecos() {
    const session = Auth.getSession();

    const { data, error } = await SupabaseClient
      .from("enderecos")
      .select("id, titulo, rua, numero, complemento, bairro, cidade, uf, principal")
      .eq("user_id", session.id)
      .order("principal", { ascending: false })  // principal primeiro
      .order("created_at", { ascending: true });

    loadingEl.hidden = true;

    if (error) {
      actionsEl.hidden = false;
      return;
    }

    if (data.length > 0) {
      listaEl.innerHTML = data.map(htmlCard).join("");
      listaEl.hidden = false;
    }

    // Controla o botão e aviso de limite
    const limiteAtingido = data.length >= LIMITE_ENDERECOS;
    limiteEl.hidden  = !limiteAtingido;

    if (limiteAtingido) {
      btnNovo.setAttribute("aria-disabled", "true");
      btnNovo.style.pointerEvents = "none";
      btnNovo.style.opacity = "0.5";
    }

    actionsEl.hidden = false;
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
    await carregarEnderecos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
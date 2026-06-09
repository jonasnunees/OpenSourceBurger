/**
 * config.js
 * Arquivo central de configurações do OpenSourceBurger.
 *
 * Responsável por armazenar dados reutilizados em várias páginas, como:
 * - configurações do carrinho
 * - dados de contato
 * - endereço
 * - tempos estimados
 * - horários de funcionamento
 * - bairros atendidos e taxas de entrega
 * - credenciais e client do Supabase
 *
 * Importante:
 * Este arquivo deve ser carregado antes dos demais scripts que dependem de CONFIG.
 */

// ── Constantes de configuração ──────────────────────────────────────────────

const CART_TTL_HOURS = 4;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;

const CART_TTL_MS =
  CART_TTL_HOURS * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;

// ── Configuração global do projeto ──────────────────────────────────────────

const CONFIG = {
  settings: {
    cartStorageKey: "osb_cart",

    // Tempo de vida do carrinho salvo no navegador.
    cartTTL: CART_TTL_MS,
  },

  contato: {
    // Número usado para montar links automáticos do WhatsApp.
    numero: "5522981104103",

    // Número exibido visualmente para o usuário.
    formatado: "(22) 9-8110-4103",

    // Mensagem inicial enviada ao abrir o WhatsApp.
    whatsappMensagem: "Olá!+Gostaria+de+fazer+um+pedido.",
  },

  endereco: {
    texto: "São Pedro da Aldeia",
    completo: "Estr. do Boqueirão, Baleia, São Pedro da Aldeia – RJ",
    mapLink: "https://share.google/J5IHdEkIUK4utzDgb",
  },

  tempos: {
    entrega: "30 min",
    retirada: "20 min",
  },

  /**
   * Horários de funcionamento.
   *
   * A ordem precisa seguir o padrão do JavaScript:
   * 0 = Domingo
   * 1 = Segunda
   * 2 = Terça
   * 3 = Quarta
   * 4 = Quinta
   * 5 = Sexta
   * 6 = Sábado
   */
  horarios: [
    { dia: "Domingo",  abertura: "18:00", fechamento: "23:59" },
    { dia: "Segunda",  abertura: "18:00", fechamento: "23:59" },
    { dia: "Terça",    abertura: "18:00", fechamento: "23:59" },
    { dia: "Quarta",   abertura: "18:00", fechamento: "23:59" },
    { dia: "Quinta",   abertura: "18:00", fechamento: "23:59" },
    { dia: "Sexta",    abertura: "18:00", fechamento: "23:59" },
    { dia: "Sábado",   abertura: "18:00", fechamento: "23:59" },
  ],

  cidade: "São Pedro da Aldeia/RJ",

  /**
   * Bairros atendidos e respectivas taxas de entrega.
   *
   * As taxas são valores numéricos para facilitar cálculos futuros.
   */
  bairros: [
    { nome: "Baleia",           taxa: 3.0  },
    { nome: "Base Aero Naval",  taxa: 10.0 },
    { nome: "Boqueirão",        taxa: 3.0  },
    { nome: "Camerum",          taxa: 4.0  },
    { nome: "Centro",           taxa: 5.0  },
    { nome: "Estação",          taxa: 10.0 },
    { nome: "Fluminense",       taxa: 10.0 },
    { nome: "Mossoró",          taxa: 4.0  },
    { nome: "Nova São Pedro",   taxa: 5.0  },
    { nome: "Poço Fundo",       taxa: 3.0  },
    { nome: "Ponta da Areia",   taxa: 3.0  },
    { nome: "Porto da Aldeia",  taxa: 4.0  },
    { nome: "Praia do Sudoeste",taxa: 3.0  },
    { nome: "São José",         taxa: 10.0 },
  ],

  // ── Supabase ────────────────────────────────────────────────────────────

  /**
   * Credenciais do projeto Supabase.
   *
   * A `anonKey` é a chave pública (anon/public) — segura para o frontend.
   * NUNCA coloque a `service_role` key aqui: ela bypassa o RLS.
   */
  supabase: {
    url:     "https://qlccitpvpmmbgywppnct.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsY2NpdHB2cG1tYmd5d3BwbmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NjU5NzUsImV4cCI6MjA5NjU0MTk3NX0.qFAfX88962hHX2UOduAs3K6_siC7ZUBYniJnGCl_B48",
  },
};

// ── Client Supabase ─────────────────────────────────────────────────────────

/**
 * Instância global do client Supabase.
 *
 * Inicializada aqui para estar disponível a todos os scripts carregados
 * depois de config.js (auth.js, page scripts, etc.).
 *
 * Depende do SDK carregado via CDN antes deste script no HTML:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *
 * O objeto `supabase` global é exposto pelo SDK como `window.supabase`.
 * Usamos a factory `supabase.createClient()` para instanciar.
 */
const SupabaseClient = (() => {
  /**
   * Cria e retorna o client, ou null se o SDK não estiver carregado.
   * O guard evita erros silenciosos caso o CDN falhe.
   */
  function init() {
    if (typeof window.supabase === "undefined") {
      console.error(
        "[config] SDK do Supabase não encontrado. " +
        "Verifique se o CDN está carregado antes de config.js."
      );
      return null;
    }

    return window.supabase.createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey
    );
  }

  return init();
})();
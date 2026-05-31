/**
 * utils/formatters.js
 * Funções utilitárias de formatação reutilizáveis entre páginas.
 *
 * Não possui dependências externas.
 * Expõe o objeto global `Formatters` para scripts clássicos.
 *
 * Ordem de carregamento: após config.js, antes dos scripts de página.
 */

const Formatters = (() => {
  /**
   * Formata um número como moeda brasileira (BRL).
   * @param {number} valor
   * @returns {string} Ex: "R$ 3,00"
   */
  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  /**
   * Formata uma data para o padrão brasileiro.
   * @param {Date|string} data
   * @returns {string} Ex: "30/05/2025"
   */
  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  /**
   * Formata um número de telefone para exibição.
   * Suporta formatos com ou sem DDI.
   * @param {string} numero Ex: "5522981104103"
   * @returns {string} Ex: "(22) 9-8110-4103"
   */
  function formatarTelefone(numero) {
    const digits = numero.replace(/\D/g, "");
    // Remove DDI 55 se presente e formata DDD + número
    const local = digits.startsWith("55") ? digits.slice(2) : digits;
    if (local.length === 11) {
      return `(${local.slice(0, 2)}) ${local[2]}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    return numero; // Retorna original se não reconhecer o formato
  }

  // API pública
  return { formatarMoeda, formatarData, formatarTelefone };
})();

/**
 * meus-cupons.js
 * Valida cupons no Supabase e aplica o desconto ao carrinho.
 *
 * Dependências:
 *  supabase.js → config.js → auth.js → lucide → common.js → meus-cupons.js
 */

(() => {
  "use strict";

  const COUPON_FORM_ID = "coupon-form";
  const COUPON_CODE_ID = "coupon-code";
  const COUPON_FEEDBACK_ID = "coupon-feedback";

  const DEFAULT_BUTTON_TEXT = "Aplicar cupom";
  const LOADING_BUTTON_TEXT = "Validando...";

  function getCartSubtotal() {
    return Object.values(Cart.get()).reduce((total, item) => {
      return total + parsePreco(item.preco) * item.qty;
    }, 0);
  }

  function parsePreco(precoStr) {
    const match = String(precoStr).match(/[\d]+[,.][\d]{2}/);
    return match ? parseFloat(match[0].replace(",", ".")) : 0;
  }

  function getAppliedCouponStorageKey() {
    return CONFIG.settings?.appliedCouponStorageKey || "osb_applied_coupon";
  }

  function normalizeCouponCode(value) {
    return value.trim().toUpperCase().replace(/\s+/g, "");
  }

  function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.innerHTML = isLoading
      ? LOADING_BUTTON_TEXT
      : `<i data-lucide="badge-percent"></i>${DEFAULT_BUTTON_TEXT}`;

    if (!isLoading && typeof lucide !== "undefined") {
      lucide.createIcons({ nodes: button.querySelectorAll("i[data-lucide]") });
    }
  }

  function showFeedback(element, message, type = "error") {
    element.textContent = message;
    element.dataset.type = type;
  }

  function saveAppliedCoupon(coupon) {
    const payload = {
      id: coupon.coupon_id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      maxDiscountValue: coupon.max_discount_value === null
        ? null
        : Number(coupon.max_discount_value),
      appliedAt: new Date().toISOString(),
    };

    localStorage.setItem(getAppliedCouponStorageKey(), JSON.stringify(payload));
  }

  async function validateCoupon(code) {
    const { data, error } = await SupabaseClient.rpc("validate_coupon", {
      p_code: code,
      p_order_total: getCartSubtotal(),
    });

    if (error) throw error;

    return Array.isArray(data) ? data[0] : data;
  }

  function redirectToCart() {
    window.location.href = "meu-carrinho.html";
  }

  function initCouponForm() {
    const form = document.getElementById(COUPON_FORM_ID);
    const input = document.getElementById(COUPON_CODE_ID);
    const feedback = document.getElementById(COUPON_FEEDBACK_ID);
    const submitButton = form?.querySelector("button[type='submit']");

    if (!form || !input || !feedback || !submitButton) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const code = normalizeCouponCode(input.value);

      if (!code) {
        input.setAttribute("aria-invalid", "true");
        showFeedback(feedback, "Digite o código do cupom.");
        input.focus();
        return;
      }

      input.value = code;
      input.setAttribute("aria-invalid", "false");
      showFeedback(feedback, "");
      setButtonLoading(submitButton, true);

      try {
        const coupon = await validateCoupon(code);

        if (!coupon?.valid) {
          input.setAttribute("aria-invalid", "true");
          showFeedback(feedback, coupon?.message || "Cupom inválido.");
          input.focus();
          return;
        }

        saveAppliedCoupon(coupon);
        showFeedback(feedback, "Cupom aplicado. Abrindo seu carrinho...", "success");
        window.setTimeout(redirectToCart, 500);
      } catch (_error) {
        showFeedback(
          feedback,
          "Não foi possível validar o cupom agora. Tente novamente."
        );
      } finally {
        setButtonLoading(submitButton, false);
      }
    });

    input.addEventListener("input", () => {
      input.setAttribute("aria-invalid", "false");
      showFeedback(feedback, "");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    Auth.requireAuth();
    initCouponForm();
  });
})();

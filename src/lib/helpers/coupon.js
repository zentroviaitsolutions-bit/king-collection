function matchesCouponCategory(coupon, cart = []) {
  if (!coupon?.category_id) return true;

  return cart.some((item) => item.category_id === coupon.category_id);
}

export function getCouponValidationMessage(coupon, subtotal, cart = []) {
  if (!coupon) return "Invalid coupon code";
  if (subtotal <= 0) return "Your cart is empty";
  if (subtotal < Number(coupon.min_order_amount || 0)) {
    return coupon.min_order_amount
      ? `Minimum order should be ₹${Number(coupon.min_order_amount).toFixed(0)}`
      : "Coupon is not applicable";
  }
  if (!matchesCouponCategory(coupon, cart)) {
    return "This coupon is only valid for a specific category in your cart";
  }

  return "";
}

export function formatCouponValue(coupon) {
  if (!coupon) return "";

  if (coupon.type === "percent") {
    return `${Number(coupon.value || 0)}% OFF`;
  }

  return `Save ₹${Number(coupon.value || 0)}`;
}

export function getCouponSummary(coupon) {
  if (!coupon) return "";

  const parts = [formatCouponValue(coupon)];

  if (Number(coupon.min_order_amount || 0) > 0) {
    parts.push(`on orders above ₹${Number(coupon.min_order_amount)}`);
  }

  if (coupon.type === "percent" && Number(coupon.max_discount || 0) > 0) {
    parts.push(`up to ₹${Number(coupon.max_discount)}`);
  }

  return parts.join(" ");
}

export function calculateCouponDiscount(coupon, subtotal, cart = []) {
  if (getCouponValidationMessage(coupon, subtotal, cart)) return 0;

  let discount = 0;

  if (coupon.type === "percent") {
    discount = (subtotal * Number(coupon.value || 0)) / 100;
    if (coupon.max_discount) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value || 0);
  }

  return Math.max(0, Math.min(discount, subtotal));
}

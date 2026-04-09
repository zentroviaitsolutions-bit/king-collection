export function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0;

  if (subtotal < (coupon.min_order_amount || 0)) return 0;

  let discount = 0;

  if (coupon.type === "percent") {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.max_discount) {
      discount = Math.min(discount, coupon.max_discount);
    }
  } else if (coupon.type === "fixed") {
    discount = coupon.value;
  }

  return Math.max(0, discount);
}
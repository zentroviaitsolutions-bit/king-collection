export function getOrderItemTotal(item) {
  return Number(item.price || 0) * Number(item.quantity || 0);
}

export function getRemainingOrderPayload(order, removedItemId) {
  const remainingItems = (order.order_items || []).filter(
    (item) => item.id !== removedItemId
  );
  const subtotal = remainingItems.reduce(
    (sum, item) => sum + getOrderItemTotal(item),
    0
  );
  const shipping = Number(order.shipping_amount || 0);
  const discount = Math.min(Number(order.discount_amount || 0), subtotal);
  const hasItems = remainingItems.length > 0;

  return {
    remainingItems,
    payload: {
      subtotal,
      discount_amount: hasItems ? discount : 0,
      total_amount: hasItems ? Math.max(0, subtotal + shipping - discount) : 0,
      order_status: hasItems ? order.order_status : "cancelled",
      updated_at: new Date().toISOString(),
    },
  };
}

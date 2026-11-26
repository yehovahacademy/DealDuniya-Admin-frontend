import api from "./api";

// Backend: src/routes/adminOrderRoutes.js (protect + ADMIN on all routes)
//
// GET /api/admin/orders → { success, data: Order[] }
//   Order: { id, orderNumber, status, paymentStatus, paymentMethod, totalAmount, createdAt,
//            user: { id, name, email, avatarUrl }, items: OrderItem[] }
export const getOrders = async () => {
  const { data } = await api.get("/admin/orders");
  return data.data ?? data.orders ?? [];
};

// GET /api/admin/orders/:id → { success, data: Order }
//   Order also includes: subtotal, shippingFee, shipping* address fields, items: OrderItem[]
//   OrderItem: { id, productName, productSku, unitPrice, quantity, lineTotal, productId }
export const getOrderById = async (id) => {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data ?? data.order;
};

// PATCH /api/admin/orders/:id/status { status } → { success, message, data: Order (no items/user) }
export const updateOrderStatus = async (id, updates) => {
  const { data } = await api.patch(`/admin/orders/${id}/status`, updates);
  return data;
};

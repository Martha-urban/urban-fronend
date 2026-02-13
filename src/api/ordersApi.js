import { api } from "./api";

export async function fetchOrders({ page = 0, size = 10, sort = "createdAt,desc" }) {
  const res = await api.get("/api/v1/orders", {
    params: { page, size, sort },
  });

  return res.data; // Spring Page<Order>
}

import { apiFetch } from "./axios";

export const productsApi = {
  getAll: () => apiFetch.get("/products"),

  getOne: (id) => apiFetch.get(`/products/${id}`),

  getBatches: (productId) =>
    apiFetch.get(`/batches?productId=${productId}`),

  create: (body) => apiFetch.post("/products", body),

  update: (id, body) => apiFetch.put(`/products/${id}`, body),

  remove: (id) => apiFetch.delete(`/products/${id}`),
};
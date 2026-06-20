import { api } from "./axios";

export const productsApi = {
  getAll: () => api.get("/products"),

  getOne: (id) => api.get(`/products/${id}`),

  getBatches: (productId) =>
    api.get(`/batches?productId=${productId}`),

  create: (body) => api.post("/products", body),

  update: (id, body) => api.put(`/products/${id}`, body),

  remove: (id) => api.delete(`/products/${id}`),
};
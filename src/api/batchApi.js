import { api } from "./axios";

export const batchesApi = {
  getAll: (productId) =>
    api.get(`/batches`, { params: productId ? { productId } : {} }),

  getBySeries: (series) =>
    api.get(`/batches/by-series/${encodeURIComponent(series)}`),

  getOne: (id) => api.get(`/batches/${id}`),

  create: (body) => api.post("/batches", body),

  update: (id, body) => api.put(`/batches/${id}`, body),

  remove: (id) => api.delete(`/batches/${id}`),
};
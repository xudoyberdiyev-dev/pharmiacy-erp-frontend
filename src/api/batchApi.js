import { apiFetch } from "./axios";

export const batchesApi = {
  getAll: (productId) =>
    apiFetch.get(`/batches`, { params: productId ? { productId } : {} }),

  getBySeries: (series) =>
    apiFetch.get(`/batches/by-series/${encodeURIComponent(series)}`),

  getOne: (id) => apiFetch.get(`/batches/${id}`),

  create: (body) => apiFetch.post("/batches", body),

  update: (id, body) => apiFetch.put(`/batches/${id}`, body),

  remove: (id) => apiFetch.delete(`/batches/${id}`),
};
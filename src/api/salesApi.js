import { apiFetch } from "./axios";

export const salesApi = {
  getAll: (params = {}) =>
    apiFetch.get("/sales", { params }),

  getOne: (id) => apiFetch.get(`/sales/${id}`),

  scanSeries: (body) =>
    apiFetch.post("/sales/scan-series", body),

  create: (body) =>
    apiFetch.post("/sales", body),

  remove: (id) =>
    apiFetch.delete(`/sales/${id}`),
};
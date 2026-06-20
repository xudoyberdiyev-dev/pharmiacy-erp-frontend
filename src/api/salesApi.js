import { api } from "./axios";

export const salesApi = {
  getAll: (params = {}) =>
    api.get("/sales", { params }),

  getOne: (id) => api.get(`/sales/${id}`),

  scanSeries: (body) =>
    api.post("/sales/scan-series", body),

  create: (body) =>
    api.post("/sales", body),

  remove: (id) =>
    api.delete(`/sales/${id}`),
};
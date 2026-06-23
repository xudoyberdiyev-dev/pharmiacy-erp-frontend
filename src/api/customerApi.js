import { apiFetch } from "./axios";

export const customersApi = {
  getAll: (search) =>
    apiFetch.get("/customers", {
      params: search ? { search } : {},
    }),

  getOne: (id) => apiFetch.get(`/customers/${id}`),

  getHistory: (id) => apiFetch.get(`/customers/${id}/history`),

  create: (body) => apiFetch.post("/customers", body),

  update: (id, body) => apiFetch.put(`/customers/${id}`, body),

  remove: (id) => apiFetch.delete(`/customers/${id}`),
};
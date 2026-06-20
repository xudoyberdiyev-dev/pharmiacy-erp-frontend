import { api } from "./axios";

export const customersApi = {
  getAll: (search) =>
    api.get("/customers", {
      params: search ? { search } : {},
    }),

  getOne: (id) => api.get(`/customers/${id}`),

  getHistory: (id) => api.get(`/customers/${id}/history`),

  create: (body) => api.post("/customers", body),

  update: (id, body) => api.put(`/customers/${id}`, body),

  remove: (id) => api.delete(`/customers/${id}`),
};
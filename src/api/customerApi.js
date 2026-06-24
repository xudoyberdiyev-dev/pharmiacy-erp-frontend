// src/api/customerApi.js
import api from './axios'

export const customersApi = {
  // GET /customers?search=&page=&limit=
  getAll: (params = {}) =>
    api.get('/customers', { params }),

  // GET /customers/:id
  getOne: (id) => api.get(`/customers/${id}`),

  // POST /customers
  create: (body) => api.post('/customers', body),

  // PATCH /customers/:id
  update: (id, body) => api.patch(`/customers/${id}`, body),

  // DELETE /customers/:id
  remove: (id) => api.delete(`/customers/${id}`),
}

// backward compat export
export const customerApi = customersApi

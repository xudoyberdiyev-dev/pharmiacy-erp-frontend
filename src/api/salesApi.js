// src/api/salesApi.js
import api from './axios'

export const salesApi = {
  // GET /sales?customerId=&dateFrom=&dateTo=&contractNumber=&invoiceNumber=&ikpuCode=&page=&limit=
  getAll: (params = {}) =>
    api.get('/sales', { params }),

  // GET /sales/:id
  getOne: (id) => api.get(`/sales/${id}`),

  // POST /sales
  // Body: { customerId, items: [{ productId, batchId, quantity, price, markingCodeId? }] }
  create: (body) => api.post('/sales', body),

  // DELETE /sales/:id/cancel
  cancel: (id) => api.delete(`/sales/${id}/cancel`),

  // GET /sales/report
  report: (params = {}) => api.get('/sales/report', { params }),
}

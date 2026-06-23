// src/api/batchApi.js
import api from './axios'

// ─── Universal transformer ─────────────────────────────────────
// Backend 2 xil format qaytaradi:
// 1. contractController: { items: [...], meta: {...} }           ← to'g'ridan
// 2. batchController:    { success, data: [...], meta: {...} }   ← ok() orqali
const makeListTransform = () => [(raw) => {
  try {
    const p = JSON.parse(raw)
    // Format 1: { items, meta }
    if (Array.isArray(p.items)) {
      return { items: p.items, meta: p.meta ?? {} }
    }
    // Format 2: { success, data: [...], meta }
    if (p.data !== undefined) {
      return { items: Array.isArray(p.data) ? p.data : [], meta: p.meta ?? {} }
    }
    // Fallback: to'g'ridan array
    if (Array.isArray(p)) {
      return { items: p, meta: { total: p.length, page: 1, limit: p.length, totalPages: 1 } }
    }
    return { items: [], meta: {} }
  } catch {
    return { items: [], meta: {} }
  }
}]

// ─── CONTRACTS ─────────────────────────────────────────────────
export const getContracts = (query = {}) =>
  api.get('/contracts', { params: query, transformResponse: makeListTransform() })

export const getContractById = (id) => api.get(`/contracts/${id}`)
export const createContract  = (payload) => api.post('/contracts', payload)
export const updateContract  = (id, payload) => api.patch(`/contracts/${id}`, payload)
export const deleteContract  = (id) => api.delete(`/contracts/${id}`)

// ─── INVOICES ──────────────────────────────────────────────────
export const getInvoices = (query = {}) =>
  api.get('/invoices', { params: query, transformResponse: makeListTransform() })

export const getInvoiceById = (id) => api.get(`/invoices/${id}`)
export const createInvoice  = (payload) => api.post('/invoices', payload)
export const updateInvoice  = (id, payload) => api.patch(`/invoices/${id}`, payload)
export const deleteInvoice  = (id) => api.delete(`/invoices/${id}`)

// ─── BATCHES ───────────────────────────────────────────────────
export const getBatches = (query = {}) =>
  api.get('/batches', { params: query, transformResponse: makeListTransform() })

export const getBatchById  = (id) => api.get(`/batches/${id}`)
export const createBatch   = (payload) => api.post('/batches', payload)
export const updateBatch   = (id, payload) => api.patch(`/batches/${id}`, payload)
export const deleteBatch   = (id) => api.delete(`/batches/${id}`)
export const getNearExpiry = (days = 30) =>
  api.get('/batches/near-expiry', { params: { days } })

// Marking kodlar
export const getMarkingCodes    = (batchId, onlyAvailable = false) =>
  api.get(`/batches/${batchId}/marking-codes`, { params: onlyAvailable ? { available: true } : {} })
export const addMarkingCodes    = (batchId, codes) =>
  api.post(`/batches/${batchId}/marking-codes`, { codes })
export const exportMarkingCodes = (batchId) =>
  api.get(`/batches/${batchId}/marking-codes/export`)
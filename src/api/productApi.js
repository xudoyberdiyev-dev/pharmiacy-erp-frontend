// src/api/productApi.js
import api from './axios'

// ─── PRODUCTS ──────────────────────────────────────────────────

/** GET /products?search=&page=1&limit=20 */
export const getProducts = (query = {}) =>
  api.get('/products', {
    params: query,
    // interceptorni bypass qilib to'liq javobni olish uchun
    transformResponse: [
      (data) => {
        try {
          const parsed = JSON.parse(data)
          // { items: [...], meta: {...} } formatiga normalize qilamiz
          return {
            items: parsed.data ?? [],
            meta:  parsed.meta ?? { total: 0, page: 1, limit: 8, totalPages: 1 },
          }
        } catch {
          return { items: [], meta: { total: 0, page: 1, limit: 8, totalPages: 1 } }
        }
      },
    ],
  })

/** GET /products/:id */
export const getProductById = (id) =>
  api.get(`/products/${id}`)

/** GET /products/barcode/:barcode */
export const getProductByBarcode = (barcode) =>
  api.get(`/products/barcode/${barcode}`)

/** GET /products/:id/stock */
export const getProductStock = (id) =>
  api.get(`/products/${id}/stock`)

/** POST /products */
export const createProduct = (payload) =>
  api.post('/products', payload)

/** PATCH /products/:id */
export const updateProduct = (id, payload) =>
  api.patch(`/products/${id}`, payload)

/** DELETE /products/:id */
export const deleteProduct = (id) =>
  api.delete(`/products/${id}`)

// ─── BARCODES ──────────────────────────────────────────────────

/** POST /products/:id/barcodes */
export const addBarcode = (productId, payload) =>
  api.post(`/products/${productId}/barcodes`, payload)

/** PATCH /products/:id/barcodes/:barcodeId/primary */
export const setPrimaryBarcode = (productId, barcodeId) =>
  api.patch(`/products/${productId}/barcodes/${barcodeId}/primary`)

/** DELETE /products/:id/barcodes/:barcodeId */
export const deleteBarcode = (productId, barcodeId) =>
  api.delete(`/products/${productId}/barcodes/${barcodeId}`)

// ─── BATCHES ───────────────────────────────────────────────────

/** POST /batches */
export const createBatch = (payload) =>
  api.post('/batches', payload)

/** PATCH /batches/:id */
export const updateBatch = (id, payload) =>
  api.patch(`/batches/${id}`, payload)

/** DELETE /batches/:id */
export const deleteBatch = (id) =>
  api.delete(`/batches/${id}`)
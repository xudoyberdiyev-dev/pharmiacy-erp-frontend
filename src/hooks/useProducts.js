// src/hooks/useProducts.js
import { useState, useEffect, useCallback, useRef } from 'react'
import * as productApi from '../api/productApi'

const PAGE_SIZE = 8

const isExpired      = (e) => e && new Date(e) < new Date()
const isExpiringSoon = (e) => {
  if (!e) return false
  const d = (new Date(e).getTime() - Date.now()) / 86400000
  return d > 0 && d <= 30
}

export function useProducts() {
  const [products,     setProducts]     = useState([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  const searchTimer = useRef()

  // ─── FETCH ────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (q) => {
    setLoading(true)
    setError(null)
    try {
      const result = await productApi.getProducts(q)
      // axios interceptor data.data ?? data qaytaradi
      // backend: { items: [...], meta: { total, page, limit, totalPages } }
      setProducts(result.items ?? [])
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (e) {
      setError(e.message ?? 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [])

  // Qidiruv o'zgarganda — debounce
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchProducts({ search, page: 1, limit: PAGE_SIZE })
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search]) // eslint-disable-line

  // Sahifa o'zgarganda
  useEffect(() => {
    fetchProducts({ search, page, limit: PAGE_SIZE })
  }, [page]) // eslint-disable-line

  // ─── PRODUCT CRUD ─────────────────────────────────────────────
  // ✅ FIX: saving ni bu yerda boshqarmaymiz — AddProductWizard o'zi boshqaradi
  const handleCreateProduct = useCallback(async (data) => {
    const product = await productApi.createProduct(data)
    // ro'yxatni qayta yuklaymiz (yangi mahsulot ko'rinsin)
    fetchProducts({ search, page: 1, limit: PAGE_SIZE })
    setPage(1)
    return product
  }, [search, fetchProducts])

  const handleUpdateProduct = useCallback(async (id, data) => {
    setSaving(true)
    try {
      const updated = await productApi.updateProduct(id, data)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      return updated
    } finally {
      setSaving(false)
    }
  }, [])

  const handleDeleteProduct = useCallback(async (id) => {
    setSaving(true)
    try {
      await productApi.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotal(t => t - 1)
    } finally {
      setSaving(false)
    }
  }, [])

  // ─── BATCH CRUD ───────────────────────────────────────────────
  // ✅ FIX: saving ni bu yerda ham boshqarmaymiz — Product.jsx o'zi boshqaradi
  const handleCreateBatch = useCallback(async (data) => {
    const batch = await productApi.createBatch(data)
    setProducts(prev => prev.map(p =>
      p.id === data.productId
        ? {
            ...p,
            batches: [batch, ...(p.batches ?? [])],
            _count: { ...p._count, batches: (p._count?.batches ?? 0) + 1 },
          }
        : p
    ))
    return batch
  }, [])

  const handleUpdateBatch = useCallback(async (id, data) => {
    setSaving(true)
    try {
      const updated = await productApi.updateBatch(id, data)
      setProducts(prev => prev.map(p => ({
        ...p,
        batches: (p.batches ?? []).map(b => b.id === id ? { ...b, ...updated } : b),
      })))
      return updated
    } finally {
      setSaving(false)
    }
  }, [])

  const handleDeleteBatch = useCallback(async (batchId, productId) => {
    setSaving(true)
    try {
      await productApi.deleteBatch(batchId)
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, batches: (p.batches ?? []).filter(b => b.id !== batchId) }
          : p
      ))
    } finally {
      setSaving(false)
    }
  }, [])

  // ─── BARCODE MANAGEMENT ───────────────────────────────────────
  const handleAddBarcode = useCallback(async (productId, data) => {
    const bc = await productApi.addBarcode(productId, data)
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const barcodes = data.isPrimary
        ? [...(p.barcodes ?? []).map(b => ({ ...b, isPrimary: false })), bc]
        : [...(p.barcodes ?? []), bc]
      return { ...p, barcodes }
    }))
    return bc
  }, [])

  const handleSetPrimaryBarcode = useCallback(async (productId, barcodeId) => {
    await productApi.setPrimaryBarcode(productId, barcodeId)
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, barcodes: (p.barcodes ?? []).map(b => ({ ...b, isPrimary: b.id === barcodeId })) }
        : p
    ))
  }, [])

  const handleDeleteBarcode = useCallback(async (productId, barcodeId) => {
    await productApi.deleteBarcode(productId, barcodeId)
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, barcodes: (p.barcodes ?? []).filter(b => b.id !== barcodeId) }
        : p
    ))
  }, [])

  // ─── Client-side status filter ────────────────────────────────
  const filteredProducts = filterStatus && filterStatus !== 'all'
    ? products.filter(p => {
        const batches  = p.batches ?? []
        const totalQty = batches.reduce((s, b) => s + (b.remainingQty ?? 0), 0)
        const hasExp   = batches.some(b => isExpired(b.expiry))
        const hasSoon  = batches.some(b => isExpiringSoon(b.expiry))
        if (filterStatus === 'expired') return hasExp
        if (filterStatus === 'soon')    return hasSoon && !hasExp
        if (filterStatus === 'empty')   return totalQty === 0
        if (filterStatus === 'ok')      return totalQty > 0 && !hasExp && !hasSoon
        return true
      })
    : products

  return {
    products: filteredProducts,
    allProducts: products,
    total,
    totalPages,
    page,         setPage,
    search,       setSearch,
    filterStatus, setFilterStatus,
    loading,
    saving,       setSaving,
    error,
    refetch: () => fetchProducts({ search, page, limit: PAGE_SIZE }),
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleCreateBatch,
    handleUpdateBatch,
    handleDeleteBatch,
    handleAddBarcode,
    handleSetPrimaryBarcode,
    handleDeleteBarcode,
  }
}
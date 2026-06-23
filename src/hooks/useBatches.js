import { useState, useEffect, useCallback, useRef } from 'react'
import * as batchApi from '../api/batchApi'
import * as productApi from '../api/productApi'

const PAGE_SIZE = 15

export function useBatches() {
  const [batches,      setBatches]      = useState([])
  const [products,     setProducts]     = useState([])
  const [contracts,    setContracts]    = useState([])
  const [invoices,     setInvoices]     = useState([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  const searchTimer = useRef()

  // ─── Fetch batches ────────────────────────────────────────────
  const fetchBatches = useCallback(async (q = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await batchApi.getBatches(q)
      setBatches(result.items ?? [])
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (e) {
      setError(e.message ?? 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Fetch products (limit: 100 — backend max) ────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const result = await productApi.getProducts({ limit: 100, page: 1 })
      setProducts(result.items ?? [])
    } catch { /* silent */ }
  }, [])

  // ─── Fetch contracts ──────────────────────────────────────────
  const fetchContracts = useCallback(async () => {
    try {
      const result = await batchApi.getContracts({ limit: 100, page: 1 })
      setContracts(result.items ?? [])
    } catch { /* silent */ }
  }, [])

  // ─── Fetch invoices by contractId ─────────────────────────────
  const fetchInvoices = useCallback(async (contractId) => {
    try {
      const result = await batchApi.getInvoices({ contractId: Number(contractId), limit: 100, page: 1 })
      setInvoices(result.items ?? [])
    } catch { /* silent */ }
  }, [])

  // Qidiruv debounce
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchBatches({ series: search || undefined, page: 1, limit: PAGE_SIZE })
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search]) // eslint-disable-line

  // Sahifa o'zgarganda
  useEffect(() => {
    fetchBatches({ page, limit: PAGE_SIZE })
  }, [page]) // eslint-disable-line

  // Dastlabki yuklash
  useEffect(() => {
    fetchProducts()
    fetchContracts()
  }, [fetchProducts, fetchContracts])

  // ─── BATCH CRUD ───────────────────────────────────────────────
  const handleCreateBatch = async (data) => {
    const batch = await batchApi.createBatch(data)
    await fetchBatches({ page: 1, limit: PAGE_SIZE })
    setPage(1)
    return batch
  }

  const handleUpdateBatch = async (id, data) => {
    setSaving(true)
    try {
      const updated = await batchApi.updateBatch(id, data)
      setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b))
      return updated
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBatch = async (id) => {
    setSaving(true)
    try {
      await batchApi.deleteBatch(id)
      setBatches(prev => prev.filter(b => b.id !== id))
      setTotal(t => t - 1)
    } finally {
      setSaving(false)
    }
  }

  // ─── CONTRACT CRUD ────────────────────────────────────────────
  const handleCreateContract = async (data) => {
    const contract = await batchApi.createContract(data)
    setContracts(prev => [contract, ...prev])
    return contract
  }

  const handleUpdateContract = async (id, data) => {
    const updated = await batchApi.updateContract(id, data)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    return updated
  }

  const handleDeleteContract = async (id) => {
    await batchApi.deleteContract(id)
    setContracts(prev => prev.filter(c => c.id !== id))
  }

  // ─── INVOICE CRUD ─────────────────────────────────────────────
  const handleCreateInvoice = async (data) => {
    const invoice = await batchApi.createInvoice(data)
    setInvoices(prev => [invoice, ...prev])
    return invoice
  }

  const handleUpdateInvoice = async (id, data) => {
    const updated = await batchApi.updateInvoice(id, data)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i))
    return updated
  }

  const handleDeleteInvoice = async (id) => {
    await batchApi.deleteInvoice(id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  // ─── Client-side status filter ────────────────────────────────
  const isExpired      = (e) => e && new Date(e) < new Date()
  const isExpiringSoon = (e) => {
    if (!e) return false
    const d = (new Date(e).getTime() - Date.now()) / 86400000
    return d > 0 && d <= 30
  }

  const filteredBatches = filterStatus === 'all'
    ? batches
    : batches.filter(b => {
        if (filterStatus === 'expired') return isExpired(b.expiry)
        if (filterStatus === 'soon')    return isExpiringSoon(b.expiry) && !isExpired(b.expiry)
        if (filterStatus === 'ok')      return !isExpired(b.expiry) && !isExpiringSoon(b.expiry)
        return true
      })

  return {
    batches: filteredBatches,
    allBatches: batches,
    products,
    contracts,
    invoices,
    total,
    totalPages,
    page,         setPage,
    search,       setSearch,
    filterStatus, setFilterStatus,
    loading,
    saving,       setSaving,
    error,
    refetch: () => fetchBatches({ page, limit: PAGE_SIZE }),
    fetchInvoices,
    handleCreateBatch,
    handleUpdateBatch,
    handleDeleteBatch,
    handleCreateContract,
    handleUpdateContract,
    handleDeleteContract,
    handleCreateInvoice,
    handleUpdateInvoice,
    handleDeleteInvoice,
  }
}
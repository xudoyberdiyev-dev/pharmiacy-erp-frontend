// src/hooks/useContracts.js
import { useState, useEffect, useCallback, useRef } from 'react'
import * as batchApi from '../api/batchApi'

const PAGE_SIZE = 20

export function useContracts() {
  const [contracts,  setContracts]  = useState([])
  const [invoices,   setInvoices]   = useState([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const searchTimer = useRef()

  const fetchContracts = useCallback(async (q = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await batchApi.getContracts(q)
      setContracts(result.items ?? [])
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (e) {
      setError(e.message ?? 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fakturalarni contractId bo'yicha yuklash
  const fetchInvoices = useCallback(async (contractId) => {
    if (!contractId) { setInvoices([]); return }
    try {
      const result = await batchApi.getInvoices({ contractId: Number(contractId), limit: 100, page: 1 })
      setInvoices(result.items ?? [])
    } catch { setInvoices([]) }
  }, [])

  // Shartnoma detali (fakturalar bilan)
  const fetchContractDetail = useCallback(async (id) => {
    try {
      const result = await batchApi.getContractById(id)
      return result
    } catch { return null }
  }, [])

  // Qidiruv debounce
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchContracts({ search: search || undefined, page: 1, limit: PAGE_SIZE })
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search]) // eslint-disable-line

  useEffect(() => {
    fetchContracts({ page, limit: PAGE_SIZE })
  }, [page]) // eslint-disable-line

  const handleCreate = async (data) => {
    const contract = await batchApi.createContract(data)
    await fetchContracts({ page: 1, limit: PAGE_SIZE })
    setPage(1)
    return contract
  }

  const handleUpdate = async (id, data) => {
    setSaving(true)
    try {
      const updated = await batchApi.updateContract(id, data)
      setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
      return updated
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await batchApi.deleteContract(id)
    setContracts(prev => prev.filter(c => c.id !== id))
    setTotal(t => t - 1)
  }

  // Invoice CRUD
  const handleCreateInvoice = async (data) => {
    const invoice = await batchApi.createInvoice(data)
    setInvoices(prev => [invoice, ...prev])
    // Shartnomalar ro'yxatini ham yangilash (_count.invoices uchun)
    await fetchContracts({ page, limit: PAGE_SIZE })
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
    await fetchContracts({ page, limit: PAGE_SIZE })
  }

  return {
    contracts,
    invoices,
    total,
    totalPages,
    page,    setPage,
    search,  setSearch,
    loading,
    saving,  setSaving,
    error,
    refetch: () => fetchContracts({ page, limit: PAGE_SIZE }),
    fetchInvoices,
    fetchContractDetail,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleCreateInvoice,
    handleUpdateInvoice,
    handleDeleteInvoice,
  }
}

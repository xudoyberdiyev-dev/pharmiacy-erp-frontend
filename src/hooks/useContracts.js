// src/hooks/useContracts.js
import { useState, useEffect, useCallback, useRef } from 'react'
import * as batchApi from '../api/batchApi'

const PAGE_SIZE = 20

export function useContracts() {
  const [contracts,    setContracts]    = useState([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

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

  // Qidiruv debounce
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchContracts({ search: search || undefined, page: 1, limit: PAGE_SIZE })
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [search]) // eslint-disable-line

  // Sahifa
  useEffect(() => {
    fetchContracts({ page, limit: PAGE_SIZE })
  }, [page]) // eslint-disable-line

  // Client-side status filter
  const filtered = statusFilter === 'all'
    ? contracts
    : contracts.filter(c => c.status === statusFilter)

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

  return {
    contracts: filtered,
    allContracts: contracts,
    total: filtered.length,
    totalPages,
    page,         setPage,
    search,       setSearch,
    statusFilter, setStatusFilter,
    loading,
    saving,       setSaving,
    error,
    refetch: () => fetchContracts({ page, limit: PAGE_SIZE }),
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
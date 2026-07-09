import api from './axios';

// ===== AUTH =====
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ===== CLIENTS =====
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  toggleActive: (id) => api.patch(`/clients/${id}/toggle`),
};

// ===== ORDERS =====
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (formData) => api.post('/orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/orders/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  startPicking: (id) => api.patch(`/orders/${id}/start-picking`),
  completePicking: (id) => api.patch(`/orders/${id}/complete-picking`),
  completeMarking: (id, formData) => api.patch(`/orders/${id}/complete-marking`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitEtirov: (id, data) => api.post(`/orders/${id}/etirov`, data),
  completeChecking: (id, data) => api.patch(`/orders/${id}/complete-checking`, data),
  assignDriver: (data) => api.post('/orders/assign-driver', data),
  deliver: (id, formData) => api.patch(`/orders/${id}/deliver`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  adminConfirm: (id) => api.patch(`/orders/${id}/admin-confirm`),
  accountantConfirm: (id) => api.patch(`/orders/${id}/accountant-confirm`),
  updateLocation: (data) => api.post('/orders/location', data),
  getConfirmationHistory: (params) => api.get('/orders/confirmation-history', { params }),
};

// ===== PICKER =====
export const pickerAPI = {
  getStats: () => api.get('/picker/stats'),
  getAvailable: () => api.get('/picker/orders/available'),
  getMine: () => api.get('/picker/orders/mine'),
  getLate: (params) => api.get('/picker/orders/late', { params }),
  getHistory: (params) => api.get('/picker/orders/late', { params }),
  getEtirozli: () => api.get('/picker/orders/etirozli'),
  getOrder: (id) => api.get(`/picker/orders/${id}`),
  accept: (id) => api.patch(`/picker/orders/${id}/accept`),
  complete: (id) => api.patch(`/picker/orders/${id}/complete`),
  acceptEtirov: (etirovId) => api.patch(`/picker/etirozlar/${etirovId}/accept`),
  rejectEtirov: (etirovId, data) => api.patch(`/picker/etirozlar/${etirovId}/reject`, data),
};

// ===== MARKER =====
export const markerAPI = {
  getAvailable: () => api.get('/marker/orders/available'),
  getMine: () => api.get('/marker/orders/mine'),
  getReturned: () => api.get('/marker/orders/returned'),
  getEtirozli: () => api.get('/marker/orders/etirozli'),
  accept: (id) => api.patch(`/marker/orders/${id}/accept`),
  complete: (id, formData) => api.patch(`/marker/orders/${id}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  completeNoFile: (id) => api.patch(`/marker/orders/${id}/complete`),
  raiseEtirov: (id, data) => api.post(`/marker/orders/${id}/etirov`, data),
  openEtirovWindow: (id) => api.patch(`/marker/orders/${id}/etirov/open`),
  closeEtirovWindow: (id) => api.patch(`/marker/orders/${id}/etirov/close`),
  getHistory: (params) => api.get('/marker/orders/history', { params }),
};

// ===== CHECKER =====
export const checkerAPI = {
  getAvailable: () => api.get('/checker/orders/available'),
  getMine:      () => api.get('/checker/orders/mine'),
  getHistory:   (params) => api.get('/checker/orders/history', { params }),
  accept:       (id) => api.patch(`/checker/orders/${id}/accept`),
  returnToMarking: (id, reason) => api.patch(`/checker/orders/${id}/return-to-marking`, { reason }),
  complete:     (id, data) => api.patch(`/checker/orders/${id}/complete`, data),
};

// ===== DOCUMENT =====
export const documentAPI = {
  getPending:          () => api.get('/document/orders/pending'),
  getAwaitingDocument: () => api.get('/document/orders/awaiting-document'),
  getReady:            () => api.get('/document/orders/ready'),
  exportExcel: (orderIds, columns, footer) => api.post(
    '/document/export', { orderIds, columns, footer }, { responseType: 'blob' }
  ),
  assignTrip:  (data) => api.post('/document/assign-trip', data),
  returnToPending: (orderIds) => api.patch('/document/orders/return-to-pending', { orderIds }),
  updateAmount: (id, totalAmount) => api.patch(`/document/orders/${id}/amount`, { totalAmount }),
  getHistory:   (date) => api.get('/document/orders/history', { params: date ? { date } : {} }),
  getReturned:  () => api.get('/document/orders/returned'),
  getOrderFull: (id) => api.get(`/document/orders/${id}`),
  submitReturn: (id, formData) => api.patch(`/document/orders/${id}/return`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadReturnReport: (id) => api.get(`/document/orders/${id}/return-report`, { responseType: 'blob' }),
};

// ===== PUBLIC (login talab qilmaydi — QR skan uchun) =====
export const publicAPI = {
  getOrderInfo: (id) => api.get(`/public/orders/${id}`),
};

// ===== USERS =====
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle`),
  regenerateQr: (id) => api.post(`/users/${id}/regenerate-qr`),
};

// ===== VEHICLES =====
export const vehicleAPI = {
  getAll:       (params) => api.get('/vehicles', { params }),
  getOne:       (id)     => api.get(`/vehicles/${id}`),
  create:       (data)   => api.post('/vehicles', data),
  update:       (id, data) => api.put(`/vehicles/${id}`, data),
  toggleActive: (id)     => api.patch(`/vehicles/${id}/toggle`),
  remove:       (id)     => api.delete(`/vehicles/${id}`),
};

// ===== STATS =====
export const statsAPI = {
  getStats: (params) => api.get('/stats', { params }),
  getMonitoring: (params) => api.get('/monitoring', { params }),
  getActivityLog: (params) => api.get('/activity-log', { params }),
  getSales: (params) => api.get('/stats/sales', { params }),
  getRegional: (params) => api.get('/stats/regional', { params }),
  getDriverLocations: () => api.get('/stats/driver-locations'),
  getOrdersDetail: (params) => api.get('/stats/orders-detail', { params }),
  getTopClients: (params) => api.get('/stats/top-clients', { params }),
};

// ===== NOTIFICATIONS =====
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

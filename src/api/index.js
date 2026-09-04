import api from './axios';

// ===== AUTH =====
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  qrLogin: (data) => api.post('/auth/qr-login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  requestCredentialChange: (data) => api.post('/auth/request-credential-change', data),
  confirmCredentialChange: (data) => api.post('/auth/confirm-credential-change', data),
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
  driverConfirm: (orderIds) => api.patch('/orders/driver-confirm', { orderIds }),
  // Bir nechta rasm (har biri 15MB gacha) sekin mobil internetda uzatilishi
  // mumkin — umumiy 15s limit yetarli emas edi va hato chiqarardi, hatto
  // yuklash aslida davom etayotgan bo'lsa ham.
  deliver: (id, formData) => api.patch(`/orders/${id}/deliver`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  adminConfirm: (id) => api.patch(`/orders/${id}/admin-confirm`),
  accountantConfirm: (id) => api.patch(`/orders/${id}/accountant-confirm`),
  startDelivery: (id) => api.patch(`/orders/${id}/start-delivery`),
  updateLocation: (data) => api.post('/orders/location', data),
  getConfirmationHistory: (params) => api.get('/orders/confirmation-history', { params }),
  getAccountantHistory: (params) => api.get('/orders/accountant-history', { params }),
  adjustLateness: (id, data) => api.post(`/orders/${id}/lateness-adjustment`, data),
  raiseDocumentEtirov: (id, data) => api.post(`/orders/${id}/document-etirov`, data),
  returnToDocument: (id, reason) => api.patch(`/orders/${id}/return-to-document`, { reason }),
  returnToAccountant1: (id, reason) => api.patch(`/orders/${id}/return-to-accountant1`, { reason }),
  getReturnedFromAccountant2: () => api.get('/orders/returned-from-accountant2'),
  driverReturnToDocument: (id, reason) => api.patch(`/orders/${id}/driver-return-to-document`, { reason }),
};

// ===== PICKER =====
export const pickerAPI = {
  getStats: () => api.get('/picker/stats'),
  getAvailable: () => api.get('/picker/orders/available'),
  getMine: () => api.get('/picker/orders/mine'),
  getReturned: () => api.get('/picker/orders/returned'),
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
  getEtirozliReceived: () => api.get('/marker/etirozlar-received'),
  acceptEtirov: (etirovId) => api.patch(`/marker/etirozlar/${etirovId}/accept`),
  rejectEtirov: (etirovId, data) => api.patch(`/marker/etirozlar/${etirovId}/reject`, data),
  accept: (id) => api.patch(`/marker/orders/${id}/accept`),
  complete: (id, formData) => api.patch(`/marker/orders/${id}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  completeNoFile: (id) => api.patch(`/marker/orders/${id}/complete`),
  returnToPicking: (id, reason) => api.patch(`/marker/orders/${id}/return-to-picking`, { reason }),
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
  returnToPicking: (id, reason) => api.patch(`/checker/orders/${id}/return-to-picking`, { reason }),
  complete:     (id, data) => api.patch(`/checker/orders/${id}/complete`, data),
  updateBoxes:  (id, data) => api.patch(`/checker/orders/${id}/boxes`, data),
  updateLabel:  (id, data) => api.patch(`/checker/orders/${id}/label`, data),
  getReturned: () => api.get('/checker/orders/returned'),
  getEtirozli: () => api.get('/checker/etirozlar'),
  respondEtirov: (id, data) => api.patch(`/checker/etirozlar/${id}/respond`, data),
  raiseEtirov: (id, data) => api.post(`/checker/orders/${id}/etirov`, data),
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
  reassignTrip: (id, data) => api.patch(`/document/orders/${id}/reassign-trip`, data),
  fullReturn:  (id, reason) => api.patch(`/document/orders/${id}/full-return`, { reason }),
  getFullyReturned: () => api.get('/document/orders/fully-returned'),
  returnToChecking: (id, reason) => api.patch(`/document/orders/${id}/return-to-checking`, { reason }),
  getReturnedFromAccountant: () => api.get('/document/orders/returned-from-accountant'),
  getReturnedFromDriver: () => api.get('/document/orders/returned-from-driver'),
  resendToAccountant: (id, totalAmount) => api.patch(`/document/orders/${id}/resend`, { totalAmount }),
  returnToPending: (orderIds) => api.patch('/document/orders/return-to-pending', { orderIds }),
  updateAmount: (id, totalAmount) => api.patch(`/document/orders/${id}/amount`, { totalAmount }),
  getHistory:   (date) => api.get('/document/orders/history', { params: date ? { date } : {} }),
  getReturned:  () => api.get('/document/orders/returned'),
  getOrderFull: (id) => api.get(`/document/orders/${id}`),
  submitReturn: (id, formData) => api.patch(`/document/orders/${id}/return`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadReturnReport: (id) => api.get(`/document/orders/${id}/return-report`, { responseType: 'blob' }),
  cancelOrder: (id, reason) => api.patch(`/document/orders/${id}/cancel`, { reason }),
  restoreOrder: (id, reason) => api.patch(`/document/orders/${id}/restore`, { reason }),
  getEtirozli: () => api.get('/document/etirozlar'),
  respondEtirov: (id, data) => api.patch(`/document/etirozlar/${id}/respond`, data),
  raiseCheckerEtirov: (id, data) => api.post(`/document/orders/${id}/etirov`, data),
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
  updateMe: (data) => api.patch('/users/me', data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle`),
  getCascadeImpact: () => api.get('/users/cascade-impact'),
  regenerateQr: (id) => api.post(`/users/${id}/regenerate-qr`),
  getPenalties: (id) => api.get(`/users/${id}/penalties`),
  getPerformance: (id, params) => api.get(`/users/${id}/performance`, { params }),
  voidPenalty: (id, reason) => api.patch(`/penalties/${id}/void`, { reason }),
  voidEtirov: (id, reason) => api.patch(`/etirozlar/${id}/void`, { reason }),
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
  getCancelledOrders: (params) => api.get('/stats/cancelled-orders', { params }),
  getReturnedOrders: () => api.get('/stats/returned-orders'),
  getRegional: (params) => api.get('/stats/regional', { params }),
  getDriverLocations: () => api.get('/stats/driver-locations'),
  getOrdersDetail: (params) => api.get('/stats/orders-detail', { params }),
  getTopClients: (params) => api.get('/stats/top-clients', { params }),
  getEmployeePerformance: (params) => api.get('/stats/employee-performance', { params }),
  getAccountantStats: () => api.get('/stats/accountant'),
};

// ===== SYSTEM OWNER: DATA RETENTION =====
export const dataRetentionAPI = {
  getPurgePreview: (params) => api.get('/system-owner/orders-purge-preview', { params }),
  exportOrders: (params) => api.get('/system-owner/orders-export', { params, responseType: 'blob' }),
  purgeOrders: (data) => api.delete('/system-owner/orders-purge', { data }),
};

// ===== NOTIFICATIONS =====
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

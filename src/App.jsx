import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import MainLayout from './components/layout/MainLayout';
import AdminHeaderLayout from './components/layout/AdminHeaderLayout';
import OperatorLayout from './components/layout/OperatorLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientsPage from './pages/admin/ClientsPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import UsersPage from './pages/admin/UsersPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import OrdersApprovalPage from './pages/admin/OrdersApprovalPage';
import OverdueOrdersPage from './pages/admin/OverdueOrdersPage';
import ConfirmationHistoryPage from './pages/admin/ConfirmationHistoryPage';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import OperatorOrdersPage from './pages/operator/OperatorOrdersPage';
import OperatorCreateOrder from './pages/operator/OperatorCreateOrder';
import OperatorOrderDetail from './pages/operator/OperatorOrderDetail';
import OperatorProfile from './pages/operator/OperatorProfile';
import PickerLayout from './components/layout/PickerLayout';
import PickerAvailablePage from './pages/picker/PickerAvailablePage';
import PickerMinePage from './pages/picker/PickerMinePage';
import PickerLatePage from './pages/picker/PickerLatePage';
import PickerEtirozliPage from './pages/picker/PickerEtirozliPage';
import MarkerLayout from './components/layout/MarkerLayout';
import MarkerAvailablePage from './pages/marker/MarkerAvailablePage';
import MarkerMinePage from './pages/marker/MarkerMinePage';
import MarkerReturnedPage from './pages/marker/MarkerReturnedPage';
import MarkerEtirozliPage from './pages/marker/MarkerEtirozliPage';
import MarkerHistoryPage from './pages/marker/MarkerHistoryPage';
import CheckerLayout from './components/layout/CheckerLayout';
import CheckerAvailablePage from './pages/checker/CheckerAvailablePage';
import CheckerMinePage from './pages/checker/CheckerMinePage';
import CheckerHistoryPage from './pages/checker/CheckerHistoryPage';
import CheckerPrintPage from './pages/checker/CheckerPrintPage';
import DocumentLayout from './components/layout/DocumentLayout';
import DocumentPendingPage from './pages/document/DocumentPendingPage';
import DocumentDocumentedPage from './pages/document/DocumentDocumentedPage';
import DocumentReadyPage from './pages/document/DocumentReadyPage';
import DocumentHistoryPage from './pages/document/DocumentHistoryPage';
import DocumentReturnedPage from './pages/document/DocumentReturnedPage';
import DocumentReturnDetailPage from './pages/document/DocumentReturnDetailPage';
import PublicOrderInfoPage from './pages/public/PublicOrderInfoPage';
import DriverMobileLayout from './components/layout/DriverMobileLayout';
import DriverPanel from './pages/driver/DriverPanel';
import DriverOrderDetail from './pages/driver/DriverOrderDetail';
import DriverProfile from './pages/driver/DriverProfile';
import BugalterPanelOne from './pages/accountant/BugalterPanelOne';
import BugalterPanelTvo from './pages/accountant/BugalterPanelTvo';
import SuperAdminStats from './pages/superadmin/SuperAdminStats';
import SuperAdminMonitoring from './pages/superadmin/SuperAdminMonitoring';
import SuperAdminActivity from './pages/superadmin/SuperAdminActivity';
import SuperAdminAdminsPage from './pages/superadmin/SuperAdminAdminsPage';
import SuperAdminSalesPage from './pages/superadmin/SuperAdminSalesPage';
import SuperAdminRegionsPage from './pages/superadmin/SuperAdminRegionsPage';
import SuperAdminAlertsPage from './pages/superadmin/SuperAdminAlertsPage';
import SuperAdminDriversMapPage from './pages/superadmin/SuperAdminDriversMapPage';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ruxsat yo'q</h2>
          <p className="text-gray-500 text-sm">Bu sahifaga kirishga vakolatingiz yo'q</p>
        </div>
      </div>
    );
  }

  return children;
}

const ROOT_REDIRECTS = {
  ADMIN: '/admin', SUPER_ADMIN: '/superadmin',
  OPERATOR: '/operator',
  PICKER: '/picker', MARKER: '/marker',
  CHECKER: '/checker', DRIVER: '/driver',
  ACCOUNTANT1: '/accountant1', ACCOUNTANT2: '/accountant2',
  DOCUMENT: '/document',
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={user ? <Navigate to={ROOT_REDIRECTS[user.role] || '/login'} replace /> : <Navigate to="/login" replace />} />

      {/* QR skan orqali — login talab qilmaydi */}
      <Route path="/public/orders/:id" element={<PublicOrderInfoPage />} />

      {/* ADMIN */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminHeaderLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="approvals" element={<OrdersApprovalPage />} />
        <Route path="overdue" element={<OverdueOrdersPage />} />
        <Route path="confirmation-history" element={<ConfirmationHistoryPage />} />
        <Route path="monitoring" element={<SuperAdminMonitoring />} />
      </Route>

      {/* OPERATOR */}
      <Route path="/operator" element={<ProtectedRoute roles={['OPERATOR']}><OperatorLayout /></ProtectedRoute>}>
        <Route index element={<OperatorDashboard />} />
        <Route path="orders" element={<OperatorOrdersPage />} />
        <Route path="orders/new" element={<OperatorCreateOrder />} />
        <Route path="orders/:id" element={<OperatorOrderDetail />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="profile" element={<OperatorProfile />} />
      </Route>

      {/* PICKER */}
      <Route path="/picker" element={<ProtectedRoute roles={['PICKER']}><PickerLayout /></ProtectedRoute>}>
        <Route index element={<PickerAvailablePage />} />
        <Route path="mine" element={<PickerMinePage />} />
        <Route path="late" element={<PickerLatePage />} />
        <Route path="etirozli" element={<PickerEtirozliPage />} />
      </Route>
      {/* MARKER */}
      <Route path="/marker" element={<ProtectedRoute roles={['MARKER']}><MarkerLayout /></ProtectedRoute>}>
        <Route index element={<MarkerAvailablePage />} />
        <Route path="mine" element={<MarkerMinePage />} />
        <Route path="returned" element={<MarkerReturnedPage />} />
        <Route path="history" element={<MarkerHistoryPage />} />
      </Route>
      {/* CHECKER */}
      <Route path="/checker" element={<ProtectedRoute roles={['CHECKER']}><CheckerLayout /></ProtectedRoute>}>
        <Route index element={<CheckerAvailablePage />} />
        <Route path="mine" element={<CheckerMinePage />} />
        <Route path="history" element={<CheckerHistoryPage />} />
        <Route path="print/:id" element={<CheckerPrintPage />} />
      </Route>
      {/* DOCUMENT */}
      <Route path="/document" element={<ProtectedRoute roles={['DOCUMENT']}><DocumentLayout /></ProtectedRoute>}>
        <Route index element={<DocumentPendingPage />} />
        <Route path="documented" element={<DocumentDocumentedPage />} />
        <Route path="ready" element={<DocumentReadyPage />} />
        <Route path="history" element={<DocumentHistoryPage />} />
        <Route path="returned" element={<DocumentReturnedPage />} />
        <Route path="orders/:id/return" element={<DocumentReturnDetailPage />} />
      </Route>

      <Route path="/driver" element={<ProtectedRoute roles={['DRIVER']}><DriverMobileLayout /></ProtectedRoute>}>
        <Route index element={<DriverPanel />} />
        <Route path="orders/:id" element={<DriverOrderDetail />} />
        <Route path="profile" element={<DriverProfile />} />
      </Route>

      {/* ACCOUNTANT 1 */}
      <Route path="/accountant1" element={<ProtectedRoute roles={['ACCOUNTANT1']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<BugalterPanelOne />} />
      </Route>
      {/* ACCOUNTANT 2 */}
      <Route path="/accountant2" element={<ProtectedRoute roles={['ACCOUNTANT2']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<BugalterPanelTvo />} />
      </Route>

      {/* SUPER ADMIN */}
      <Route path="/superadmin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AdminHeaderLayout /></ProtectedRoute>}>
        <Route index element={<SuperAdminStats />} />
        <Route path="admins" element={<SuperAdminAdminsPage />} />
        <Route path="sales" element={<SuperAdminSalesPage />} />
        <Route path="regions" element={<SuperAdminRegionsPage />} />
        <Route path="monitoring" element={<SuperAdminMonitoring />} />
        <Route path="alerts" element={<SuperAdminAlertsPage />} />
        <Route path="drivers-map" element={<SuperAdminDriversMapPage />} />
        <Route path="activity" element={<SuperAdminActivity />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px' } }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

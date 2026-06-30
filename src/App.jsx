import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import MainLayout from './components/layout/MainLayout';
import OperatorLayout from './components/layout/OperatorLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientsPage from './pages/admin/ClientsPage';
import OrdersPage from './pages/admin/OrdersPage';
import CreateOrderPage from './pages/admin/CreateOrderPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import DocumentPanel from './pages/admin/DocumentPanel';
import UsersPage from './pages/admin/UsersPage';
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
import MarkerPanel from './pages/marker/MarkerPanel';
import CheckerPanel from './pages/checker/CheckerPanel';
import DriverPanel from './pages/driver/DriverPanel';
import AccountantPanel from './pages/accountant/AccountantPanel';
import SuperAdminStats from './pages/superadmin/SuperAdminStats';
import SuperAdminMonitoring from './pages/superadmin/SuperAdminMonitoring';
import SuperAdminActivity from './pages/superadmin/SuperAdminActivity';

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
  ADMIN: '/admin', SUPER_ADMIN: '/admin',
  OPERATOR: '/operator',
  PICKER: '/picker', MARKER: '/marker',
  CHECKER: '/checker', DRIVER: '/driver', ACCOUNTANT: '/accountant',
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={user ? <Navigate to={ROOT_REDIRECTS[user.role] || '/login'} replace /> : <Navigate to="/login" replace />} />

      {/* ADMIN */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<CreateOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="document" element={<DocumentPanel />} />
        <Route path="users" element={<UsersPage />} />
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
      <Route path="/marker" element={<ProtectedRoute roles={['MARKER']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<MarkerPanel />} />
      </Route>
      <Route path="/checker" element={<ProtectedRoute roles={['CHECKER']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<CheckerPanel />} />
      </Route>
      <Route path="/driver" element={<ProtectedRoute roles={['DRIVER']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<DriverPanel />} />
      </Route>

      {/* ACCOUNTANT */}
      <Route path="/accountant" element={<ProtectedRoute roles={['ACCOUNTANT']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<AccountantPanel />} />
      </Route>

      {/* SUPER ADMIN */}
      <Route path="/superadmin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><MainLayout /></ProtectedRoute>}>
        <Route index element={<SuperAdminStats />} />
        <Route path="monitoring" element={<SuperAdminMonitoring />} />
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

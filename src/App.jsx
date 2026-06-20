import { Route, Routes, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Product } from "./pages/Product";
import { Customer } from "./pages/Customer";
import { Sales } from "./pages/Sales";
import { AuthProvider } from "./layout/AuthProvider";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ProtectedRoute from "./layout/ProtectedRoute";
import { Batch } from "./pages/Batch";
import Employees from "./pages/Emplouees";
import { Contract } from "./pages/Contract";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes (with sidebar layout) */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Product />} />
          <Route path="batches" element={<Batch />} />
          <Route path="customers" element={<Customer />} />
          <Route path="sales" element={<Sales />} />
          <Route path="employees" element={<Employees />} />
          <Route path="contract" element={<Contract/>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
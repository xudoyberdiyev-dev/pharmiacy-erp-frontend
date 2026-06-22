import { Route, Routes, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { AuthProvider } from "./layout/AuthProvider";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import ProtectedRoute from "./layout/ProtectedRoute";
import { Batch } from "./pages/Batch";
import { Contract } from "./pages/Contract";
import { Markirovka } from "./pages/Marcerofka";
import { History } from "./pages/History";
import { Excelimport } from "./pages/Excelimport";
import { Customer } from "./pages/Customer";
import { Employee } from "./pages/Emplouees";
import { Product } from "./pages/product/Product";
import  Sales  from "./pages/Sales";
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        {/* Umumiy panel — admin ham, xodim ham shu yerga kiradi */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "employee"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Product/>} />
          <Route path="batches" element={<Batch />} />
          <Route path="customers" element={<Customer />} />
          <Route path="sales" element={<Sales />} />
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Employee />
              </ProtectedRoute>
            }
          />
          <Route path="contract" element={<Contract />} />
          <Route path="marking" element={<Markirovka />} />
          <Route
            path="history"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <History />
              </ProtectedRoute>
            }
          />
          <Route path="import" element={<Excelimport />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
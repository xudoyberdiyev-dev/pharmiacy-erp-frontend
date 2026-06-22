import "./Toast.css";
import { CheckCircle, AlertTriangle, X } from "lucide-react";

export default function ToastStack({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={15} strokeWidth={2.5} />
          ) : (
            <AlertTriangle size={15} strokeWidth={2.5} />
          )}

          <span>{toast.msg}</span>

          <button onClick={() => remove(toast.id)}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
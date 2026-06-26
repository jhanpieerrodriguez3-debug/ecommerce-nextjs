"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback
} from "react";

// Incluye "warning" para uso en dashboard/admin
export type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-[#064e3b]/90 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
      case "error":
        return "bg-[#7f1d1d]/90 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]";
      case "warning":
        return "bg-[#78350f]/90 border-yellow-500/40 text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
      case "info":
      default:
        return "bg-black/90 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)]";
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      case "info": default: return "ℹ️";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* FLOATING TOAST CONTAINER */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer p-4 rounded-2xl backdrop-blur-xl border flex items-center justify-between dm-toast-enter ${getToastStyles(toast.type)}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">
                {getToastIcon(toast.type)}
              </span>
              <p className="text-sm font-semibold tracking-wide leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button className="ml-4 text-xs opacity-50 hover:opacity-100 transition shrink-0">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un ToastProvider");
  }
  return context;
}

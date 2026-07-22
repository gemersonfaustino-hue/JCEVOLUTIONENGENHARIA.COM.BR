import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        id="toast-notification-container"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.15 } }}
              layout
              className={`pointer-events-auto p-4 rounded-xl border flex items-start justify-between gap-3 shadow-2xl backdrop-blur-md transition-all ${
                toast.type === "success"
                  ? "bg-slate-900/95 border-emerald-500/30 text-emerald-50"
                  : toast.type === "error"
                  ? "bg-slate-900/95 border-red-500/30 text-red-50"
                  : "bg-slate-900/95 border-blue-500/30 text-blue-50"
              }`}
              id={`toast-item-${toast.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" id={`toast-icon-${toast.id}`} />}
                  {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-red-400" id={`toast-icon-${toast.id}`} />}
                  {toast.type === "info" && <Info className="w-5 h-5 text-blue-400" id={`toast-icon-${toast.id}`} />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold leading-relaxed">{toast.text}</p>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors shrink-0 mt-0.5 cursor-pointer"
                aria-label="Fechar notificação"
                id={`toast-close-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[120] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass shadow-2xl border border-[var(--glass-border)] text-sm font-medium"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : toast.type === 'info' ? (
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="text-[var(--text-main)] truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastStyles: Record<ToastType, { bg: string; border: string; Icon: any; iconColor: string; textColor: string }> = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      Icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      textColor: 'text-slate-800',
    },
    error: {
      bg: 'bg-white',
      border: 'border-rose-200',
      Icon: AlertTriangle,
      iconColor: 'text-rose-600',
      textColor: 'text-slate-800',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200',
      Icon: Info,
      iconColor: 'text-blue-600',
      textColor: 'text-slate-800',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const { bg, border, Icon, iconColor, textColor } = toastStyles[toast.type];
          return (
            <div
              key={toast.id}
              className={`${bg} ${border} border backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className={`text-sm ${textColor} font-medium flex-1 leading-snug`}>{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

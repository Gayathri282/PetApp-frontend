import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-down"
            style={{
              pointerEvents: 'auto',
              padding: '14px 22px',
              borderRadius: 14,
              color: toast.type === 'info' ? '#FFE58F' : '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              maxWidth: 360,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: toast.type === 'info' ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              background:
                toast.type === 'success'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))'
                  : toast.type === 'error'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))'
                  : 'linear-gradient(135deg, rgba(15,29,20,0.95), rgba(10,18,13,0.95))',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';
import Loading from '../components/Loading';

interface AppContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType; duration: number }>({
    show: false,
    message: '',
    type: 'info',
    duration: 3000,
  });
  const [loading, setLoading] = useState<{ show: boolean; message: string }>({
    show: false,
    message: 'جاري التحميل...',
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ show: true, message, type, duration });
  };

  const showLoading = (message: string = 'جاري التحميل...') => {
    setLoading({ show: true, message });
  };

  const hideLoading = () => {
    setLoading({ show: false, message: 'جاري التحميل...' });
  };

  return (
    <AppContext.Provider value={{ showToast, showLoading, hideLoading }}>
      {children}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <Loading show={loading.show} message={loading.message} />
    </AppContext.Provider>
  );
};

import React from 'react';
import Toast from './Toast';

export interface ToastData {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;



import React, { useEffect, useState } from 'react';
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon } from './Icons';

interface ToastProps {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: (id: number) => void;
}

const toastConfig = {
    error: {
        bg: 'bg-red-500',
        icon: <ErrorIcon className="h-7 w-7 text-white" />,
    },
    success: {
        bg: 'bg-green-500',
        icon: <SuccessIcon className="h-7 w-7 text-white" />, 
    },
    info: {
        bg: 'bg-blue-500',
        icon: <InfoIcon className="h-7 w-7 text-white" />,
    },
};

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000); // Auto-close after 5 seconds

        return () => clearTimeout(timer);
    }, [id]);

    const handleClose = () => {
        setIsFadingOut(true);
        setTimeout(() => onClose(id), 300); // Match animation duration
    };

    const config = toastConfig[type];

    return (
        <div 
            role="alert"
            className={`
                relative flex items-center p-4 rounded-lg shadow-lg text-white w-full transition-all duration-300 ease-in-out transform
                ${config.bg}
                ${isFadingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
        >
            <div className="flex-shrink-0">{config.icon}</div>
            <div className="ml-3 mr-6 text-sm font-medium">{message}</div>
            <button
                onClick={handleClose}
                aria-label="Fechar notificação"
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            >
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>
    );
};

export default Toast;
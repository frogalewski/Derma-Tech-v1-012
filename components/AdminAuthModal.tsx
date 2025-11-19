import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon, LockIcon } from './Icons';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onUnlock }) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUnlock(password);
        setPassword('');
    };
    
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm m-4 p-6 relative animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <CloseIcon className="h-7 w-7" />
                </button>
                
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('adminControls')}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400">{t('enterAdminPassword')}</p>
                    <div>
                        <label htmlFor="admin-password" className="sr-only">{t('passwordLabel')}</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <LockIcon className="h-8 w-8 text-gray-400" />
                            </span>
                            <input
                              type="password"
                              id="admin-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t('passwordPlaceholder')}
                              className="w-full pl-14 pr-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                              autoFocus
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {t('unlockButton')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminAuthModal;
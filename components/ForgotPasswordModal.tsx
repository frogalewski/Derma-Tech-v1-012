

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import * as authService from '../services/authService';
import { CloseIcon, MailIcon, LockIcon, CheckIcon } from './Icons';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'password' | 'success';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const resetState = () => {
        setStep('email');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setIsLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await authService.getUserByEmail(email);
            if (user) {
                setStep('password');
            } else {
                setError(t('emailNotFound'));
            }
        } catch (err) {
            setError(t('emailNotFound'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError(t('passwordMinLength'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(email, password);
            setStep('success');
            setTimeout(handleClose, 3000); // Auto-close after success
        } catch (err: any) {
            setError(err.message || t('toastErrorUnknown'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md m-4 p-6 relative animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={handleClose} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <CloseIcon className="h-7 w-7" />
                </button>
                
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('resetPasswordTitle')}</h2>
                
                {error && <p className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-lg my-4 text-sm text-center">{error}</p>}
                
                {step === 'email' && (
                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">{t('resetPasswordInstructions')}</p>
                        <div>
                            <label htmlFor="reset-email" className="sr-only">{t('emailLabel')}</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                  <MailIcon className="h-8 w-8 text-gray-400" />
                                </span>
                                <input
                                  type="email"
                                  id="reset-email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder={t('emailPlaceholder')}
                                  className="w-full pl-14 pr-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? t('verifying') : t('verifyEmailButton')}
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                         <p className="text-sm text-center text-gray-600 dark:text-gray-400">{t('enterNewPassword')}</p>
                         <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPasswordLabel')}</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-8 w-8 text-gray-400" />
                                </span>
                                <input type="password" id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className="w-full pl-14 pr-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                            </div>
                         </div>
                         <div>
                             <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmNewPasswordLabel')}</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-8 w-8 text-gray-400" />
                                </span>
                                <input type="password" id="confirm-new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('confirmPasswordPlaceholder')} className="w-full pl-14 pr-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                            </div>
                         </div>
                         <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                             {isLoading ? t('resetting') : t('resetPasswordButton')}
                         </button>
                    </form>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <CheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg text-gray-800 dark:text-gray-200">{t('passwordResetSuccess')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;

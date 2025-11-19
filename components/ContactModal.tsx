


import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon, CloseIcon, CopyIcon, MailIcon } from './Icons';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
    const email = 'suporte@dermatologica.com.br';

    const handleCopy = () => {
        navigator.clipboard.writeText(email).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        });
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 relative animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <CloseIcon className="h-7 w-7" />
                    <span className="sr-only">{t('closeModal')}</span>
                </button>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <MailIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contactUs')}</h2>
                </div>
                
                <div className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t('contactEmailPrompt')}
                    </p>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                        <span className="font-mono text-blue-700 dark:text-blue-300">{email}</span>
                        <button onClick={handleCopy} title={t('copyEmail')} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {copied ? <CheckIcon className="h-6 w-6 text-green-500" /> : <CopyIcon className="h-6 w-6" />}
                            <span className="sr-only">{t('copyEmail')}</span>
                        </button>
                    </div>
                    <a
                        href={`mailto:${email}`}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
                    >
                        {t('openEmailClient')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
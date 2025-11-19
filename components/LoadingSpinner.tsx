
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoadingSpinner: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
        <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-100"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('loadingText')}</p>
    </div>
  );
};

export default LoadingSpinner;
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon, TrashIcon } from './Icons';

interface DeleteUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteUserConfirmModal: React.FC<DeleteUserConfirmModalProps> = ({ isOpen, onClose, onConfirm, isDeleting }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 relative animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                        <TrashIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                        {t('deleteAccountConfirmTitle')}
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('deleteAccountConfirmMessage')}
                        </p>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {t('cancelButton')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-400"
                    >
                        {isDeleting ? t('deleting') : t('deleteAccountConfirmButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserConfirmModal;

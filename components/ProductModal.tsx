



import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon, PackageIcon } from './Icons';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setDescription(productToEdit.description);
                setCategory(productToEdit.category || '');
            } else {
                setName('');
                setDescription('');
                setCategory('');
            }
            setError(null);
        }
    }, [isOpen, productToEdit]);

    const handleSave = () => {
        if (!name.trim()) {
            setError(t('productNameRequired'));
            return;
        }

        const productData: Product = {
            id: productToEdit ? productToEdit.id : Date.now().toString(),
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
        };

        onSave(productData);
        onClose();
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
                        <PackageIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {productToEdit ? t('editProduct') : t('addProduct')}
                    </h2>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('productNameLabel')}</label>
                            <input
                                type="text"
                                id="product-name"
                                value={name}
                                onChange={e => { setName(e.target.value); if (error) setError(null); }}
                                required
                                autoFocus
                                aria-invalid={!!error}
                                aria-describedby="product-name-error"
                                className={`w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-lg focus:ring-2 focus:border-blue-500 transition duration-200 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                            />
                            {error && <p id="product-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
                        </div>
                        <div>
                            <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('categoryLabel')}</label>
                             <input
                                type="text"
                                id="product-category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder={t('categoryPlaceholder')}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            />
                        </div>
                        <div>
                            <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('descriptionLabel')}</label>
                            <textarea
                                id="product-description"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder={t('descriptionPlaceholder')}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            ></textarea>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                        >
                            {t('cancelButton')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            {t('saveButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
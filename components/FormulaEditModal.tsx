



import React, { useState, useEffect } from 'react';
import { Formula } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon, EditIcon, PlusIcon, TrashIcon } from './Icons';

interface FormulaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formula: Formula) => void;
  formula: Formula | null;
}

const FormulaEditModal: React.FC<FormulaEditModalProps> = ({ isOpen, onClose, onSave, formula }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [instructions, setInstructions] = useState('');
    const [averageValue, setAverageValue] = useState('');
    const [newIngredient, setNewIngredient] = useState('');
    const [nameError, setNameError] = useState('');
    const { t } = useLanguage();

    useEffect(() => {
        if (formula) {
            setName(formula.name);
            setDescription(formula.description || '');
            setIngredients([...formula.ingredients]);
            setInstructions(formula.instructions);
            setAverageValue(formula.averageValue || '');
            setNewIngredient('');
            setNameError('');
        }
    }, [formula]);

    if (!isOpen || !formula) {
        return null;
    }

    const handleAddIngredient = () => {
        if (newIngredient.trim()) {
            setIngredients(prev => [...prev, newIngredient.trim()]);
            setNewIngredient('');
        }
    };

    const handleRemoveIngredient = (indexToRemove: number) => {
        setIngredients(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = () => {
        if (!name.trim()) {
            setNameError(t('formulaNameRequired'));
            return;
        }
        const updatedFormula: Formula = {
            ...formula,
            name: name.trim(),
            description: description.trim(),
            ingredients,
            instructions: instructions.trim(),
            averageValue: averageValue.trim(),
        };
        onSave(updatedFormula);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl m-4 relative animate-fade-in flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                         <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-full">
                           <EditIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="edit-modal-title">{t('editFormulaTitle')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <CloseIcon className="h-7 w-7" />
                        <span className="sr-only">{t('closeButton')}</span>
                    </button>
                </header>

                <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="formula-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('formulaNameLabel')}</label>
                            <input
                                type="text"
                                id="formula-name"
                                value={name}
                                onChange={e => { setName(e.target.value); if(nameError) setNameError(''); }}
                                className={`w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-lg focus:ring-2 focus:border-blue-500 transition duration-200 ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                            />
                            {nameError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{nameError}</p>}
                        </div>

                        <div>
                            <label htmlFor="formula-average-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('averageValueLabel')}</label>
                            <input
                                type="text"
                                id="formula-average-value"
                                value={averageValue}
                                onChange={e => setAverageValue(e.target.value)}
                                placeholder={t('averageValuePlaceholder')}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            />
                        </div>

                        <div>
                            <label htmlFor="formula-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('formulaActionLabel')}</label>
                            <textarea
                                id="formula-description"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder={t('formulaActionPlaceholder')}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('ingredientsLabel')}</label>
                            <ul className="mt-2 space-y-2">
                                {ingredients.map((ingredient, index) => (
                                    <li key={index} className="flex justify-between items-center group bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                        <span className="text-gray-800 dark:text-gray-200">{ingredient}</span>
                                        <button onClick={() => handleRemoveIngredient(index)} title={t('removeIngredient')} className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500">
                                            <TrashIcon className="h-6 w-6"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newIngredient}
                                    onChange={e => setNewIngredient(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                    placeholder={t('newIngredientPlaceholder')}
                                    className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                />
                                <button
                                    onClick={handleAddIngredient}
                                    className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    aria-label={t('addIngredientAria')}
                                >
                                    <PlusIcon className="h-7 w-7" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="formula-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('instructionsLabel')}</label>
                            <textarea
                                id="formula-instructions"
                                rows={4}
                                value={instructions}
                                onChange={e => setInstructions(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            ></textarea>
                        </div>
                    </div>
                </main>

                <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        {t('cancelButton')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        {t('saveChangesButton')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FormulaEditModal;
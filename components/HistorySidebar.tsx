import React, { useRef, useState } from 'react';
import { HistoryItem, Formula, Product, SavedPrescription } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ActiveTab } from '../App';
import { BookmarkIcon, ClockIcon, CloseIcon, CogIcon, DownloadIcon, EditIcon, ImportIcon, PackageIcon, PlusIcon, ScanIcon, TrashIcon, ClipboardListIcon, ChevronDownIcon, UserCircleIcon, LogoutIcon, LockIcon, UnlockIcon, InstallIcon, CheckIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface HistorySidebarProps {
  history: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onClearHistory: () => void;
  selectedItemId: string | null;
  savedFormulas: Formula[];
  onRemoveSaved: (formula: Formula) => void;
  onClearSaved: () => void;
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onImportProducts: (products: Omit<Product, 'id'>[]) => void;
  onExportProducts: () => void;
  savedPrescriptions: SavedPrescription[];
  onSavedPrescriptionClick: (item: SavedPrescription) => void;
  onDeleteSavedPrescription: (id: string) => void;
  onClearSavedPrescriptions: () => void;
  isSidebarOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  showDoctorName: boolean;
  onShowDoctorNameChange: (show: boolean) => void;
  showPatientName: boolean;
  onShowPatientNameChange: (show: boolean) => void;
  onDeleteAccount: () => void;
  isAdminMode: boolean;
  onUnlockAdmin: () => void;
  onLockAdmin: () => void;
  onBackup: () => void;
  onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
  installPromptEvent: any | null;
  onInstallClick: () => void;
  isPwaInstalled: boolean;
}

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <label htmlFor={label} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <div className="relative">
            <input
                type="checkbox"
                id={label}
                className="sr-only peer"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <div className="block h-6 w-10 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 transition-colors"></div>
            <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
        </div>
    </label>
);

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
    history, onItemClick, onClearHistory, selectedItemId,
    savedFormulas, onRemoveSaved, onClearSaved,
    products, onAddProduct, onEditProduct, onDeleteProduct, onImportProducts, onExportProducts,
    savedPrescriptions, onSavedPrescriptionClick, onDeleteSavedPrescription, onClearSavedPrescriptions,
    isSidebarOpen, onClose, activeTab, onTabChange,
    showDoctorName, onShowDoctorNameChange, showPatientName, onShowPatientNameChange,
    onDeleteAccount,
    isAdminMode, onUnlockAdmin, onLockAdmin,
    onBackup, onRestore,
    installPromptEvent, onInstallClick, isPwaInstalled
}) => {
    const productsFileInputRef = useRef<HTMLInputElement>(null);
    const restoreFileInputRef = useRef<HTMLInputElement>(null);
    const { t, language, setLanguage } = useLanguage();
    const { currentUser, logout } = useAuth();
    const [expandedSavedFormulaId, setExpandedSavedFormulaId] = useState<string | null>(null);

    const handleImportProductsClick = () => {
        productsFileInputRef.current?.click();
    };

    const handleRestoreClick = () => {
        restoreFileInputRef.current?.click();
    };

    const handleProductsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    alert(t('alertCsvEmpty'));
                    return;
                }
                const headerLine = lines.shift()!;
                
                const parseCsvLine = (line: string): string[] => {
                    const fields: string[] = [];
                    let currentField = '';
                    let inQuotes = false;

                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                                currentField += '"';
                                i++;
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            fields.push(currentField);
                            currentField = '';
                        } else {
                            currentField += char;
                        }
                    }
                    fields.push(currentField);
                    return fields;
                };
                
                const header = parseCsvLine(headerLine).map(h => h.trim().toLowerCase());
                const nameIndex = header.indexOf('name');
                const descriptionIndex = header.indexOf('description');
                const categoryIndex = header.indexOf('category');

                if (nameIndex === -1) {
                    alert(t('alertCsvNoNameColumn'));
                    return;
                }

                const newProducts: Omit<Product, 'id'>[] = lines.map(line => {
                    const data = parseCsvLine(line);
                    const name = (data[nameIndex] || '').trim();
                    const description = descriptionIndex > -1 ? ((data[descriptionIndex] || '').trim()) : '';
                    const category = categoryIndex > -1 ? ((data[categoryIndex] || '').trim()) : '';
                    return { name, description, category };
                }).filter(p => p.name);

                if (newProducts.length > 0) {
                    onImportProducts(newProducts);
                } else {
                    alert(t('alertNoValidProducts'));
                }

            } catch (error) {
                console.error("Error importing CSV:", error);
                alert(t('alertCsvError'));
            } finally {
                if(productsFileInputRef.current) {
                    productsFileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

  return (
    <aside className={`transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                     fixed inset-y-0 left-0 z-30 w-full max-w-xs sm:max-w-sm bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen 
                     md:max-w-none md:w-80 lg:w-96 md:translate-x-0 md:relative`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white whitespace-nowrap">
            {t('controlPanel')}
        </h2>
        <button onClick={onClose} className="p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden" aria-label={t('closeModal')}>
            <CloseIcon className="h-6 w-6"/>
        </button>
      </div>

       <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/50 rounded-lg shadow-sm hover:bg-red-200 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                title={t('logout')}
            >
                <LogoutIcon className="h-8 w-8" />
                <span>{t('logout')}</span>
            </button>
        </div>

      <div className="flex flex-col flex-grow min-h-0">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => onTabChange('history')}
                    title={t('history')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <ClockIcon className="h-8 w-8" />
                </button>
                 <button 
                    onClick={() => onTabChange('prescription')}
                    title={t('prescriptionReader')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeTab === 'prescription' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <ScanIcon className="h-8 w-8" />
                </button>
                <button 
                    onClick={() => onTabChange('saved')}
                    title={t('saved')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'saved' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <BookmarkIcon className="h-8 w-8" />
                </button>
                 <button 
                    onClick={() => onTabChange('savedPrescriptions')}
                    title={t('savedPrescriptions')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeTab === 'savedPrescriptions' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <ClipboardListIcon className="h-8 w-8" />
                </button>
                <button 
                    onClick={() => onTabChange('products')}
                    title={t('products')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <PackageIcon className="h-8 w-8" />
                </button>
                <button
                    onClick={() => onTabChange('settings')}
                    title={t('settings')}
                    className={`p-4 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    <CogIcon className="h-8 w-8" />
                </button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
            {activeTab === 'history' && (
                <>
                {history.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <p>{t('noHistory')}</p>
                        <p className="text-sm">{t('historyWillAppear')}</p>
                    </div>
                    ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {history.map((item) => (
                        <li key={item.id}>
                            <button
                            onClick={() => onItemClick(item)}
                            className={`w-full text-left p-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 ${item.id === selectedItemId ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                            >
                            <p className={`font-medium capitalize truncate ${item.id === selectedItemId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{item.disease}</p>
                            {item.patientName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    {t('patientLabel')}: {item.patientName}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(item.timestamp).toLocaleString(language)}
                            </p>
                            </button>
                        </li>
                        ))}
                    </ul>
                    )}
                </>
            )}
            {activeTab === 'saved' && (
                <>
                {savedFormulas.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <BookmarkIcon className="h-10 w-10 mx-auto text-gray-400 mb-2"/>
                        <p>{t('noSavedFormulas')}</p>
                        <p className="text-sm">{t('useSaveButton')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {savedFormulas.map((formula) => (
                            <li key={formula.id} className="group">
                                <div className="p-4">
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={() => setExpandedSavedFormulaId(prevId => prevId === formula.id ? null : formula.id)}
                                            className="flex-grow flex items-center justify-between text-left pr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                                            aria-expanded={expandedSavedFormulaId === formula.id}
                                        >
                                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{formula.name}</span>
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedSavedFormulaId === formula.id ? 'transform rotate-180' : ''}`} />
                                        </button>
                                        <button onClick={() => onRemoveSaved(formula)} title={t('removeFromSaved')} className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-opacity">
                                            <CloseIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    {expandedSavedFormulaId === formula.id && (
                                        <div className="mt-3 pl-1 animate-fade-in">
                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('ingredientsLabel')}</h4>
                                            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                                                {formula.ingredients.map((ing, index) => (
                                                    <li key={index}>{ing}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                </>
            )}
            {activeTab === 'products' && (
                <>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
                         <button 
                            onClick={onAddProduct} 
                            disabled={!isAdminMode}
                            title={!isAdminMode ? t('controlsLocked') : t('addProduct')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <PlusIcon className="h-6 w-6"/>
                            <span>{t('addProduct')}</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleImportProductsClick} 
                                disabled={!isAdminMode}
                                title={!isAdminMode ? t('controlsLocked') : t('import')}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <ImportIcon className="h-6 w-6"/>
                                <span>{t('import')}</span>
                            </button>
                             <button 
                                onClick={onExportProducts} 
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                                <DownloadIcon className="h-6 w-6"/>
                                <span>{t('export')}</span>
                            </button>
                        </div>
                        <p className="pt-1 text-xs text-center text-gray-500 dark:text-gray-400">
                            {t('csvImportHelp')}
                        </p>
                        <input 
                            type="file" 
                            ref={productsFileInputRef} 
                            onChange={handleProductsFileChange} 
                            className="hidden" 
                            accept=".csv"
                        />
                    </div>
                    {products.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <PackageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2"/>
                            <p>{t('noProducts')}</p>
                            <p className="text-sm">{t('clickButtonsToStart')}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map((product) => (
                                <li key={product.id} className="p-4 flex justify-between items-start group">
                                    <div className="flex-1 overflow-hidden pr-2">
                                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{product.name}</p>
                                        {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.description}</p>}
                                        {product.category && <p className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate mt-1">{product.category}</p>}
                                    </div>
                                    {isAdminMode && (
                                        <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            <button onClick={() => onEditProduct(product)} title={t('editProduct')} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md">
                                                <EditIcon className="h-6 w-6" />
                                            </button>
                                            <button onClick={() => onDeleteProduct(product.id)} title={t('deleteProduct')} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md">
                                                <CloseIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
             {activeTab === 'savedPrescriptions' && (
                <>
                {savedPrescriptions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <ClipboardListIcon className="h-10 w-10 mx-auto text-gray-400 mb-2"/>
                        <p>{t('noSavedPrescriptions')}</p>
                        <p className="text-sm">{t('savePrescriptionToView')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {savedPrescriptions.map((item) => (
                            <li key={item.id} className="group flex items-center justify-between">
                                <button
                                    onClick={() => onSavedPrescriptionClick(item)}
                                    className="flex-grow w-full text-left p-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3"
                                >
                                    <img src={item.imagePreviewUrl} alt="Preview" className="h-10 w-10 rounded-md object-cover flex-shrink-0 bg-gray-200" />
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.data.patientName || t('unknownPatient')}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(item.timestamp).toLocaleString(language)}
                                        </p>
                                    </div>
                                </button>
                                {isAdminMode && (
                                    <button 
                                        onClick={() => onDeleteSavedPrescription(item.id)} 
                                        title={t('deleteSavedPrescription')} 
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-md transition-opacity mr-2"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                </>
            )}
             {activeTab === 'settings' && (
                <div className="p-4 space-y-6">
                    {currentUser && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                                <UserCircleIcon className="h-5 w-5 mr-2" />
                                {t('user')}
                            </h3>
                            <div className="mt-2 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg">
                                <p className="uppercase font-semibold text-gray-800 dark:text-gray-200 truncate">{currentUser.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                            </div>
                        </div>
                    )}
                     <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('language')}</h3>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'pt-BR' | 'en')}
                            className="mt-2 w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            aria-label={t('selectLanguage')}
                        >
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('installApp')}</h3>
                         <div className="mt-2 space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{isPwaInstalled ? t('appAlreadyInstalled') : t('appInstallDescription')}</p>
                            <button
                                onClick={onInstallClick}
                                disabled={!installPromptEvent || isPwaInstalled}
                                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition-colors disabled:cursor-not-allowed ${
                                    isPwaInstalled 
                                    ? 'bg-teal-600 text-white focus:ring-teal-500' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600'
                                }`}
                            >
                                {isPwaInstalled ? <CheckIcon className="h-6 w-6"/> : <InstallIcon className="h-6 w-6"/>}
                                <span>{isPwaInstalled ? t('appInstalled') : t('installApp')}</span>
                            </button>
                         </div>
                    </div>
                     <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('formFields')}</h3>
                        <div className="mt-1 space-y-1">
                            <ToggleSwitch label={t('showDoctorName')} checked={showDoctorName} onChange={onShowDoctorNameChange} />
                            <ToggleSwitch label={t('showPatientName')} checked={showPatientName} onChange={onShowPatientNameChange} />
                        </div>
                    </div>
                     <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('backupRestore')}</h3>
                        <div className="mt-2 space-y-2">
                             <button
                                onClick={onBackup}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors duration-200"
                            >
                                <DownloadIcon className="h-6 w-6"/>
                                <span>{t('makeBackup')}</span>
                            </button>
                            <button
                                onClick={handleRestoreClick}
                                disabled={!isAdminMode}
                                title={!isAdminMode ? t('controlsLocked') : t('restoreBackup')}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <ImportIcon className="h-6 w-6"/>
                                <span>{t('restoreBackup')}</span>
                            </button>
                            <input 
                                type="file" 
                                ref={restoreFileInputRef} 
                                onChange={onRestore} 
                                className="hidden" 
                                accept="application/json"
                            />
                        </div>
                    </div>
                     <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('adminControls')}</h3>
                         {isAdminMode ? (
                             <button
                                onClick={onLockAdmin}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-yellow-500 transition-colors"
                            >
                                <LockIcon className="h-6 w-6"/>
                                <span>{t('lockAdminControls')}</span>
                            </button>
                         ) : (
                            <button
                                onClick={onUnlockAdmin}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                            >
                                <UnlockIcon className="h-6 w-6"/>
                                <span>{t('unlockAdminControls')}</span>
                            </button>
                         )}

                        <button
                            onClick={onDeleteAccount}
                            disabled={!isAdminMode}
                            title={!isAdminMode ? t('controlsLocked') : t('deleteAccount')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 transition-colors duration-200 disabled:bg-red-400/50 disabled:cursor-not-allowed"
                        >
                            <TrashIcon className="h-6 w-6"/>
                            <span>{t('deleteAccount')}</span>
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'prescription' && (
                 <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <ScanIcon className="h-10 w-10 mx-auto text-gray-400 mb-2"/>
                    <p>{t('prescriptionReader')}</p>
                    <p className="text-sm">{t('prescriptionReaderInstructions')}</p>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {activeTab === 'history' && history.length > 0 && (
                <button
                    onClick={onClearHistory}
                    disabled={!isAdminMode}
                    title={!isAdminMode ? t('controlsLocked') : t('clearHistory')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 transition-colors duration-200 disabled:cursor-not-allowed"
                >
                    <TrashIcon className="h-6 w-6"/>
                    <span>{t('clearHistory')}</span>
                </button>
            )}
            {activeTab === 'saved' && savedFormulas.length > 0 && (
                <button
                    onClick={onClearSaved}
                    disabled={!isAdminMode}
                    title={!isAdminMode ? t('controlsLocked') : t('clearSaved')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 transition-colors duration-200 disabled:cursor-not-allowed"
                >
                    <TrashIcon className="h-6 w-6"/>
                    <span>{t('clearSaved')}</span>
                </button>
            )}
             {activeTab === 'savedPrescriptions' && savedPrescriptions.length > 0 && (
                <button
                    onClick={onClearSavedPrescriptions}
                    disabled={!isAdminMode}
                    title={!isAdminMode ? t('controlsLocked') : t('clearSavedPrescriptions')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 transition-colors duration-200 disabled:cursor-not-allowed"
                >
                    <TrashIcon className="h-6 w-6"/>
                    <span>{t('clearSavedPrescriptions')}</span>
                </button>
            )}
        </div>
      </div>
    </aside>
  );
};

export default HistorySidebar;
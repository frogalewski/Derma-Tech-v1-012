import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getFormulaSuggestionsStream, generateFormulaIcon } from './services/geminiService';
import * as dbService from './services/dbService';
import * as authService from './services/authService';
import { GeminiResponse, GroundingSource, HistoryItem, Formula, Product, PrescriptionData, SavedPrescription } from './types';
import { useLanguage } from './contexts/LanguageContext';
import LoadingSpinner from './components/LoadingSpinner';
import FormulaCard from './components/FormulaCard';
import SourceLinks from './components/SourceLinks';
import HistorySidebar from './components/HistorySidebar';
import Logo from './components/Logo';
import ProductModal from './components/ProductModal';
import ToastContainer, { ToastData } from './components/ToastContainer';
import FormulaDetailModal from './components/FormulaDetailModal';
import FormulaEditModal from './components/FormulaEditModal';
import ContactModal from './components/ContactModal';
import PrescriptionReader from './components/PrescriptionReader';
import { MailIcon, MenuIcon, UserIcon, PaperclipIcon, ChevronDownIcon, CloseIcon, SparklesIcon } from './components/Icons';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DeleteUserConfirmModal from './components/DeleteUserConfirmModal';
import AdminAuthModal from './components/AdminAuthModal';


export type ActiveTab = 'history' | 'saved' | 'products' | 'settings' | 'prescription' | 'savedPrescriptions';


const App: React.FC = () => {
    const { t, language } = useLanguage();
    const { currentUser, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
    const [authView, setAuthView] = useState<'login' | 'register'>('login');
    const [disease, setDisease] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [patientName, setPatientName] = useState('');
    const [observations, setObservations] = useState('');
    const [isDoctorNamePinned, setIsDoctorNamePinned] = useState(false);
    const [response, setResponse] = useState<GeminiResponse | null>(null);
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [savedFormulas, setSavedFormulas] = useState<Formula[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [savedPrescriptions, setSavedPrescriptions] = useState<SavedPrescription[]>([]);
    const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);
    const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [considerProducts, setConsiderProducts] = useState(false);
    const [formulaIcons, setFormulaIcons] = useState<Record<string, string>>({});
    const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
    const [generatingIcons, setGeneratingIcons] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedFormula, setExpandedFormula] = useState<Formula | null>(null);
    const [formulaToEdit, setFormulaToEdit] = useState<Formula | null>(null);
    const [isDbLoading, setIsDbLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('history');
    const [viewedPrescription, setViewedPrescription] = useState<SavedPrescription | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentIngredients, setCurrentIngredients] = useState<string[]>([]);
    const [newIngredient, setNewIngredient] = useState('');
    const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(false);
    const [isLactoseIntolerant, setIsLactoseIntolerant] = useState(false);
    const [isAllergicToDye, setIsAllergicToDye] = useState(false);
    const [treatmentType, setTreatmentType] = useState<'topical' | 'internal' | 'all'>('all');
    const [isTreatmentTypeExpanded, setIsTreatmentTypeExpanded] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
    const [isPwaInstalled, setIsPwaInstalled] = useState(false);


    // Settings State
    const [showDoctorName, setShowDoctorName] = useState<boolean>(true);
    const [showPatientName, setShowPatientName] = useState<boolean>(true);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const addToast = useCallback((message: string, type: ToastData['type'] = 'error') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    
    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // FIX: Moved handleAppInstalled out of useEffect to make it accessible to handleInstallApp
    const handleAppInstalled = useCallback(() => {
        setInstallPromptEvent(null);
        setIsPwaInstalled(true);
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            setIsPwaInstalled(false);
        };

        const checkPwaInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsPwaInstalled(true);
                setInstallPromptEvent(null);
            }
        };
        
        checkPwaInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [handleAppInstalled]);

    const handleInstallApp = async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === 'accepted') {
            handleAppInstalled();
        }
    };

    useEffect(() => {
        const checkAdminSession = () => {
            const isAdmin = sessionStorage.getItem('isAdminMode') === 'true';
            setIsAdminMode(isAdmin);
        };
        checkAdminSession();
    }, []);

    useEffect(() => {
        const loadDataFromDb = async () => {
            try {
                await dbService.initDB();
                const [
                    historyData,
                    savedFormulasData,
                    productsData,
                    customIconsData,
                    savedPrescriptionsData,
                    savedShowDoctorName,
                    savedShowPatientName,
                ] = await Promise.all([
                    dbService.getAllHistory(),
                    dbService.getAllSavedFormulas(),
                    dbService.getAllProducts(),
                    dbService.getSetting<Record<string, string>>('customIcons'),
                    dbService.getAllSavedPrescriptions(),
                    dbService.getSetting<boolean>('showDoctorName'),
                    dbService.getSetting<boolean>('showPatientName'),
                ]);

                setHistory(historyData.sort((a, b) => b.timestamp - a.timestamp));
                setSavedFormulas(savedFormulasData.sort((a, b) => a.name.localeCompare(b.name)));
                setProducts(productsData.sort((a, b) => a.name.localeCompare(b.name)));
                setSavedPrescriptions(savedPrescriptionsData.sort((a, b) => b.timestamp - a.timestamp));
                if (customIconsData) setCustomIcons(customIconsData);

                if (savedShowDoctorName !== null) setShowDoctorName(savedShowDoctorName);
                if (savedShowPatientName !== null) setShowPatientName(savedShowPatientName);

                 // Check for theme setting and apply it. This is a one-time check on load.
                const savedTheme = await dbService.getSetting<'light' | 'dark' | 'system'>('theme');
                const root = window.document.documentElement;
                if (savedTheme === 'dark') {
                    root.classList.add('dark');
                } else if (savedTheme === 'light') {
                    root.classList.remove('dark');
                } else { // system or null
                    root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
                }


            } catch (e) {
                console.error("Failed to load data from database:", e);
                addToast(t('toastErrorDbLoad'), 'error');
            } finally {
                setIsDbLoading(false);
            }
        };

        if (isAuthenticated) {
            loadDataFromDb();
        } else {
            setIsDbLoading(false);
        }
    }, [isAuthenticated, addToast, t]);

    const handleCustomIconChange = useCallback(async (formulaId: string, imageDataUrl: string) => {
        const newIcons = { ...customIcons, [formulaId]: imageDataUrl };
        setCustomIcons(newIcons);
        await dbService.setSetting('customIcons', newIcons);
    }, [customIcons]);

    const handleRemoveCustomIcon = useCallback(async (formulaId: string) => {
        const newIcons = { ...customIcons };
        delete newIcons[formulaId];
        setCustomIcons(newIcons);
        await dbService.setSetting('customIcons', newIcons);
    }, [customIcons]);

    const generateAndSetIcons = useCallback(async (formulas: Formula[]) => {
        const formulasToGenerate = formulas.filter(f => !formulaIcons[f.name]);
        if (formulasToGenerate.length === 0) return;

        setGeneratingIcons(prev => {
            const newSet = new Set(prev);
            formulasToGenerate.forEach(f => newSet.add(f.name));
            return newSet;
        });

        const iconPromises = formulasToGenerate.map(async (formula) => {
            try {
                const iconDataUrl = await generateFormulaIcon(formula.name, language);
                return { name: formula.name, iconDataUrl };
            } catch (e) {
                console.error(e);
                return { name: formula.name, iconDataUrl: null }; // handle failure
            }
        });

        const results = await Promise.allSettled(iconPromises);

        setFormulaIcons(prev => {
            const newIcons = { ...prev };
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.iconDataUrl) {
                    newIcons[result.value.name] = result.value.iconDataUrl;
                }
            });
            return newIcons;
        });

        setGeneratingIcons(prev => {
            const newSet = new Set(prev);
            formulasToGenerate.forEach(f => newSet.delete(f.name));
            return newSet;
        });

    }, [formulaIcons, language]);

    const handleToggleSaveFormula = useCallback(async (formulaToToggle: Formula) => {
        const isAlreadySaved = savedFormulas.some(f => f.id === formulaToToggle.id);
        if (isAlreadySaved) {
            setSavedFormulas(prev => prev.filter(f => f.id !== formulaToToggle.id));
            await dbService.unsaveFormula(formulaToToggle.id);
        } else {
            setSavedFormulas(prev => [...prev, formulaToToggle].sort((a, b) => a.name.localeCompare(b.name)));
            await dbService.saveFormula(formulaToToggle);
        }
    }, [savedFormulas]);

    const handleClearSavedFormulas = async () => {
        setSavedFormulas([]);
        await dbService.clearSavedFormulas();
    };

    const handleSaveProduct = useCallback(async (product: Product) => {
        const isEditing = products.some(p => p.id === product.id);
        const trimmedName = product.name.trim().toLowerCase();
    
        if (!isEditing) {
            const nameExists = products.some(p => p.name.trim().toLowerCase() === trimmedName);
            if (nameExists) {
                addToast(t('productNameExists'), 'error');
                return;
            }
        }
    
        setProducts(prev => {
            let newProducts;
            if (isEditing) {
                newProducts = prev.map(p => (p.id === product.id ? product : p));
            } else {
                newProducts = [product, ...prev];
            }
            return newProducts.sort((a, b) => a.name.localeCompare(b.name));
        });
        await dbService.saveProduct(product);
    }, [products, addToast, t]);
    
    const handleAddProduct = () => {
        setProductToEdit(null);
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = useCallback(async (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
        await dbService.deleteProduct(productId);
    }, []);

    const handleImportProducts = useCallback(async (newProducts: Omit<Product, 'id'>[]) => {
        let addedCount = 0;
        let skippedCount = 0;
        
        const existingNames = new Set(products.map(p => p.name.toLowerCase()));
        
        const productsToAdd = newProducts
            .map((p, index) => ({ ...p, id: `${Date.now()}-${index}`}))
            .filter(p => {
                const alreadyExists = existingNames.has(p.name.toLowerCase());
                if (alreadyExists) {
                    skippedCount++;
                    return false;
                }
                existingNames.add(p.name.toLowerCase());
                addedCount++;
                return true;
            });

        if (productsToAdd.length > 0) {
            setProducts(prev => [...productsToAdd, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            for (const product of productsToAdd) {
                await dbService.saveProduct(product);
            }
        }
    
        if (addedCount > 0) {
            alert(t('alertProductsImported', { addedCount, skippedCount }));
        } else {
            alert(t('alertNoProductsToImport'));
        }
    
    }, [products, t]);

    const handleExportProducts = useCallback(() => {
        if (products.length === 0) {
            addToast(t('toastInfoNoProductsToExport'), 'info');
            return;
        }

        const escapeCsvField = (field: string): string => {
            if (/[",\n\r]/.test(field)) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        };

        const headers = ['name', 'description', 'category'];
        const csvRows = [
            headers.join(','),
            ...products.map(p => 
                [escapeCsvField(p.name), escapeCsvField(p.description), escapeCsvField(p.category || '')].join(',')
            )
        ];
        const csvString = csvRows.join('\r\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'produtos_dermatologica.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    }, [products, addToast, t]);


    const handleSearch = useCallback(async (searchTerm?: string) => {
        const term = searchTerm || disease;
        if (!term.trim()) {
            addToast(t('toastErrorEnterCondition'));
            return;
        }
        if (activeTab !== 'history') setActiveTab('history');

        setIsLoading(true);
        setResponse(null);
        setSources([]);
        setSelectedHistoryItemId(null);
        setCurrentTimestamp(null);
        
        try {
            let fullText = '';
            const collectedSources: GroundingSource[] = [];

            const stream = getFormulaSuggestionsStream(
                term,
                considerProducts ? products : [],
                currentIngredients,
                isLactoseIntolerant,
                isAllergicToDye,
                treatmentType,
                language
            );
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                }
                if (chunk.sources) {
                    collectedSources.push(...chunk.sources);
                    setSources(prev => [...prev, ...chunk.sources!]);
                }
            }
            
            const jsonString = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
            if (!jsonString) {
                throw new Error(t('toastErrorApiEmpty'));
            }
            const parsedResponseRaw: Omit<GeminiResponse, 'formulas'> & { formulas: Omit<Formula, 'id'>[] } = JSON.parse(jsonString);
            const parsedResponse: GeminiResponse = {
                ...parsedResponseRaw,
                formulas: parsedResponseRaw.formulas.map((f, index) => ({
                    ...f,
                    id: `${Date.now()}-${index}`
                }))
            };
            setResponse(parsedResponse);
            
            generateAndSetIcons(parsedResponse.formulas);

            const newItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                disease: term,
                doctorName: doctorName,
                patientName: patientName,
                observations: observations,
                currentIngredients: currentIngredients,
                isLactoseIntolerant: isLactoseIntolerant,
                isAllergicToDye: isAllergicToDye,
                treatmentType: treatmentType,
                response: parsedResponse,
                sources: collectedSources,
            };

            setHistory(prevHistory => [newItem, ...prevHistory]);
            await dbService.addHistoryItem(newItem);
            setSelectedHistoryItemId(newItem.id);
            setCurrentTimestamp(newItem.timestamp);
            setDisease('');
            setPatientName('');
            setObservations('');
            setCurrentIngredients([]);
            setNewIngredient('');
            setIsIngredientsExpanded(false);
            setIsLactoseIntolerant(false);
            setIsAllergicToDye(false);
            setTreatmentType('all');
            
        } catch (e) {
            console.error("Failed during search:", e);
            if (e instanceof SyntaxError) {
                addToast(t('toastErrorApiParse'));
            } else if (e instanceof Error) {
                addToast(e.message);
            } else {
                addToast(t('toastErrorUnknown'));
            }
            setResponse(null);
        } finally {
            setIsLoading(false);
        }
    }, [disease, doctorName, patientName, observations, considerProducts, products, currentIngredients, isLactoseIntolerant, isAllergicToDye, treatmentType, generateAndSetIcons, addToast, t, language, activeTab]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        setDisease(item.disease);
        if (!isDoctorNamePinned) {
            setDoctorName(item.doctorName || '');
        }
        setPatientName(item.patientName || '');
        setObservations(item.observations || '');
        setCurrentIngredients(item.currentIngredients || []);
        setIsLactoseIntolerant(item.isLactoseIntolerant || false);
        setIsAllergicToDye(item.isAllergicToDye || false);
        setTreatmentType(item.treatmentType || 'all');
        setResponse(item.response);
        setSources(item.sources);
        setSelectedHistoryItemId(item.id);
        setCurrentTimestamp(item.timestamp);
        setIsLoading(false);
        generateAndSetIcons(item.response.formulas);
        setActiveTab('history');
        setIsSidebarOpen(false);
    };
    
    const handleClearForm = useCallback(() => {
        setDisease('');
        if (!isDoctorNamePinned) {
            setDoctorName('');
        }
        setPatientName('');
        setResponse(null);
        setSources([]);
        setSelectedHistoryItemId(null);
        setCurrentTimestamp(null);
        setObservations('');
        setCurrentIngredients([]);
        setNewIngredient('');
        setIsIngredientsExpanded(false);
        setIsLactoseIntolerant(false);
        setIsAllergicToDye(false);
        setTreatmentType('all');
    }, [isDoctorNamePinned]);


    const handleClearHistory = async () => {
        setHistory([]);
        setSelectedHistoryItemId(null);
        await dbService.clearHistory();
        setDisease('');
        if (!isDoctorNamePinned) {
            setDoctorName('');
        }
        setPatientName('');
        setObservations('');
        setCurrentIngredients([]);
        setIsLactoseIntolerant(false);
        setIsAllergicToDye(false);
        setTreatmentType('all');
        setResponse(null);
        setSources([]);
        setCurrentTimestamp(null);
    };
    
    const handleWhatsAppPharmacist = () => {
        const phoneNumber = "554184197256"; 
        const url = `https://wa.me/${phoneNumber}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleExpandFormula = (formula: Formula) => {
        setExpandedFormula(formula);
    };

    const handleCloseExpandedView = () => {
        setExpandedFormula(null);
    };

    const handleOpenEditModal = (formula: Formula) => {
        setFormulaToEdit(formula);
    };

    const handleCloseEditModal = () => {
        setFormulaToEdit(null);
    };

    const handleUpdateFormula = async (updatedFormula: Formula) => {
        // Update current response if formula is from there
        if (response && response.formulas.some(f => f.id === updatedFormula.id)) {
            setResponse(prev => prev ? { ...prev, formulas: prev.formulas.map(f => f.id === updatedFormula.id ? updatedFormula : f) } : null);
        }

        // Update history item
        if (selectedHistoryItemId) {
            const itemToUpdate = history.find(item => item.id === selectedHistoryItemId);
            if (itemToUpdate) {
                const updatedItem = {
                    ...itemToUpdate,
                    response: {
                        ...itemToUpdate.response,
                        formulas: itemToUpdate.response.formulas.map(f => f.id === updatedFormula.id ? updatedFormula : f)
                    }
                };
                setHistory(prev => prev.map(item => item.id === selectedHistoryItemId ? updatedItem : item));
                await dbService.updateHistoryItem(updatedItem);
            }
        }
        
        // Update saved formulas
        if (savedFormulas.some(f => f.id === updatedFormula.id)) {
            setSavedFormulas(prev => prev.map(f => f.id === updatedFormula.id ? updatedFormula : f).sort((a, b) => a.name.localeCompare(b.name)));
            await dbService.updateSavedFormula(updatedFormula);
        }

        handleCloseEditModal();
    };

    const handleSearchFromPrescription = (term: string) => {
        setDisease(term);
        setActiveTab('history');
        // We set the term, switch tab, and then the user can click search.
        // Or we could trigger it automatically:
        // handleSearch(term); 
    };

    const handleSavePrescription = async (data: PrescriptionData, imagePreviewUrl: string) => {
        if (!imagePreviewUrl) {
            addToast('Erro: Imagem de pré-visualização não encontrada para salvar.', 'error');
            return;
        }
        const isAlreadySaved = savedPrescriptions.some(p =>
            p.data.doctorName === data.doctorName &&
            p.data.patientName === data.patientName &&
            p.data.date === data.date &&
            JSON.stringify(p.data.prescribedItems) === JSON.stringify(data.prescribedItems)
        );
    
        if (isAlreadySaved) {
            addToast('Esta leitura de receita já foi salva.', 'info');
            return;
        }
    
        const newItem: SavedPrescription = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            data,
            imagePreviewUrl,
        };
        setSavedPrescriptions(prev => [newItem, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        await dbService.savePrescription(newItem);
        addToast(t('toastReadingSaved'), 'success');
    };

    const handleDeleteSavedPrescription = async (id: string) => {
        setSavedPrescriptions(prev => prev.filter(p => p.id !== id));
        await dbService.deletePrescription(id);
    };
    
    const handleClearSavedPrescriptions = async () => {
        setSavedPrescriptions([]);
        await dbService.clearSavedPrescriptions();
    };
    
    const handleSavedPrescriptionClick = (item: SavedPrescription) => {
        setViewedPrescription(item);
        setActiveTab('prescription');
        setIsSidebarOpen(false);
    };

    // Settings handlers
    const handleShowDoctorNameChange = async (show: boolean) => {
        setShowDoctorName(show);
        await dbService.setSetting('showDoctorName', show);
    };

    const handleShowPatientNameChange = async (show: boolean) => {
        setShowPatientName(show);
        await dbService.setSetting('showPatientName', show);
    };
    
    const handleBackup = async () => {
        try {
            const data = await dbService.exportAllData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `dermatologica_backup_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast(t('backupSuccessful'), 'success');
        } catch (error) {
            console.error('Backup failed:', error);
            addToast(t('backupFailed'), 'error');
        }
    };
    
    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm(t('restoreConfirmation'))) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (!data.history || !data.products || !data.settings) {
                   throw new Error(t('invalidBackupFile'));
                }
                
                await dbService.importAllData(data);
                addToast(t('restoreSuccessful'), 'success');
                setTimeout(() => window.location.reload(), 2000);

            } catch (error: any) {
                console.error('Restore failed:', error);
                addToast(error.message || t('restoreFailed'), 'error');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
             addToast(t('restoreFailed'), 'error');
             event.target.value = '';
        };
        reader.readAsText(file);
    };


    const handleDeleteCurrentUser = async () => {
        if (currentUser) {
            setIsDeletingAccount(true);
            try {
                // Clear all local data first
                await handleClearHistory();
                await handleClearSavedFormulas();
                await handleClearSavedPrescriptions();
                setProducts([]);
                await dbService.clearProducts();
                
                // Delete the user record
                await authService.deleteAccount(currentUser.id);
                
                addToast(t('toastAccountDeleted'), 'success');
                setIsDeleteConfirmOpen(false);
                logout(); // This will redirect to the login page
            } catch (error) {
                console.error("Failed to delete account:", error);
                addToast('Failed to delete account.', 'error');
            } finally {
                setIsDeletingAccount(false);
            }
        }
    };

    const handleUnlockAdmin = (password: string) => {
        // In a real application, this should be a secure check against a hashed password from a backend.
        if (password === 'admin123') {
            setIsAdminMode(true);
            sessionStorage.setItem('isAdminMode', 'true');
            setIsAdminModalOpen(false);
        } else {
            addToast(t('wrongPassword'), 'error');
        }
    };

    const handleLockAdmin = () => {
        setIsAdminMode(false);
        sessionStorage.removeItem('isAdminMode');
    };

    const handleAddIngredient = () => {
        if (newIngredient.trim() && !currentIngredients.includes(newIngredient.trim())) {
            setCurrentIngredients(prev => [...prev, newIngredient.trim()]);
            setNewIngredient('');
        }
    };

    const handleRemoveIngredient = (indexToRemove: number) => {
        setCurrentIngredients(prev => prev.filter((_, index) => index !== indexToRemove));
    };


    const FullScreenLoader = () => (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="flex flex-col items-center">
                <Logo className="h-16 w-auto text-gray-800 dark:text-gray-200 mb-4 animate-pulse" />
                    <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">{t('loadingDb')}</p>
            </div>
        </div>
    );

    if (isAuthLoading || isDbLoading) {
        return <FullScreenLoader />;
    }

    if (!isAuthenticated) {
        if (authView === 'login') {
            return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
        }
        return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }


    const currentHistoryItem = selectedHistoryItemId ? history.find(item => item.id === selectedHistoryItemId) : null;

    return (
        <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 md:flex`}>
            {isSidebarOpen && (
                 <div
                    onClick={handleToggleSidebar}
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    aria-hidden="true"
                ></div>
            )}
            <HistorySidebar
                history={history}
                onItemClick={handleHistoryItemClick}
                onClearHistory={handleClearHistory}
                selectedItemId={selectedHistoryItemId}
                savedFormulas={savedFormulas}
                onRemoveSaved={handleToggleSaveFormula}
                onClearSaved={handleClearSavedFormulas}
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onImportProducts={handleImportProducts}
                onExportProducts={handleExportProducts}
                savedPrescriptions={savedPrescriptions}
                onSavedPrescriptionClick={handleSavedPrescriptionClick}
                onDeleteSavedPrescription={handleDeleteSavedPrescription}
                onClearSavedPrescriptions={handleClearSavedPrescriptions}
                isSidebarOpen={isSidebarOpen}
                onClose={handleToggleSidebar}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                showDoctorName={showDoctorName}
                onShowDoctorNameChange={handleShowDoctorNameChange}
                showPatientName={showPatientName}
                onShowPatientNameChange={handleShowPatientNameChange}
                onDeleteAccount={() => setIsDeleteConfirmOpen(true)}
                isAdminMode={isAdminMode}
                onLockAdmin={handleLockAdmin}
                onUnlockAdmin={() => setIsAdminModalOpen(true)}
                onBackup={handleBackup}
                onRestore={handleRestore}
                installPromptEvent={installPromptEvent}
                onInstallClick={handleInstallApp}
                isPwaInstalled={isPwaInstalled}
            />
            <main className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto">
                     <header className="flex items-center justify-between md:justify-center p-4 mb-4 md:mb-8">
                        <button
                            onClick={handleToggleSidebar}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
                            aria-label={t('toggleSidebarAria')}
                        >
                            <MenuIcon className="h-7 w-7" />
                        </button>
                        <div className="flex-1 flex justify-center md:flex-none">
                             <Logo className="h-12 md:h-16 w-auto text-gray-800 dark:text-gray-200" />
                        </div>
                        <div className="w-8 md:hidden"></div>
                    </header>

                        {activeTab === 'prescription' ? (
                             <PrescriptionReader 
                                onSearch={handleSearchFromPrescription}
                                addToast={addToast}
                                onSave={handleSavePrescription}
                                initialData={viewedPrescription}
                                onClearInitialData={() => setViewedPrescription(null)}
                             />
                        ) : (
                            <>
                                <section className="px-4">
                                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                        {selectedHistoryItemId && (
                                            <div className="mb-4 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleClearForm}
                                                    title={t('startNewSearch')}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                                                >
                                                    <SparklesIcon className="h-5 w-5" />
                                                    <span>{t('newSearchButton')}</span>
                                                </button>
                                            </div>
                                        )}
                                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                            <input
                                                type="text"
                                                value={disease}
                                                onChange={(e) => setDisease(e.target.value)}
                                                placeholder={t('diseaseInputPlaceholder')}
                                                className="uppercase flex-grow w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                disabled={isLoading}
                                                aria-label={t('diseaseInputAria')}
                                            />
                                            {showDoctorName && (
                                                <div className="relative w-full">
                                                    <input
                                                        type="text"
                                                        value={doctorName}
                                                        onChange={(e) => setDoctorName(e.target.value)}
                                                        placeholder={t('doctorInputPlaceholder')}
                                                        className="uppercase w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                        disabled={isLoading}
                                                        aria-label={t('doctorInputAria')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsDoctorNamePinned(!isDoctorNamePinned)}
                                                        title={isDoctorNamePinned ? t('unpinDoctorNameTitle') : t('pinDoctorNameTitle')}
                                                        className={`absolute inset-y-0 right-0 flex items-center pr-3 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDoctorNamePinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                                        aria-label={isDoctorNamePinned ? t('unpinDoctorNameTitle') : t('pinDoctorNameTitle')}
                                                    >
                                                        <PaperclipIcon className="h-8 w-8" />
                                                    </button>
                                                </div>
                                            )}
                                            {showPatientName && (
                                                <input
                                                    type="text"
                                                    value={patientName}
                                                    onChange={(e) => setPatientName(e.target.value)}
                                                    placeholder={t('patientInputPlaceholder')}
                                                    className="uppercase w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                    disabled={isLoading}
                                                    aria-label={t('patientInputAria')}
                                                />
                                            )}
                                            <textarea
                                                value={observations}
                                                onChange={(e) => setObservations(e.target.value)}
                                                placeholder={t('observationsPlaceholder')}
                                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                                disabled={isLoading}
                                                rows={2}
                                                aria-label={t('observationsLabel')}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-shrink-0 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>{t('searchingButton')}</span>
                                                    </>
                                                ) : (
                                                    <span>{t('searchButton')}</span>
                                                )}
                                            </button>
                                        </form>
                                        <div className="mt-4 flex items-center justify-center">
                                            <label htmlFor="consider-products-toggle" className="flex items-center cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id="consider-products-toggle"
                                                        className="sr-only peer"
                                                        checked={considerProducts}
                                                        onChange={() => setConsiderProducts(!considerProducts)}
                                                        disabled={isLoading || products.length === 0}
                                                    />
                                                    <div className="block h-6 w-10 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 transition-colors"></div>
                                                    <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                                                </div>
                                                <span className={`ml-3 transition-colors ${products.length === 0 ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}`}>
                                                    {t('considerProductsLabel')} {products.length === 0 && `(${t('noProductsLabel')})`}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsIngredientsExpanded(!isIngredientsExpanded)}
                                            className="w-full flex justify-between items-center text-left font-semibold text-gray-700 dark:text-gray-300"
                                            aria-expanded={isIngredientsExpanded}
                                        >
                                            <span>{t('checkIncompatibilities')}</span>
                                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isIngredientsExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isIngredientsExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={newIngredient}
                                                        onChange={(e) => setNewIngredient(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIngredient(); } }}
                                                        placeholder={t('addCurrentIngredientPlaceholder')}
                                                        className="flex-grow w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddIngredient}
                                                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {t('addButton')}
                                                    </button>
                                                </div>
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('currentIngredientsList')}</h4>
                                                    {currentIngredients.length > 0 ? (
                                                        <ul className="mt-2 flex flex-wrap gap-2">
                                                            {currentIngredients.map((ingredient, index) => (
                                                                <li key={index} className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
                                                                    <span>{ingredient}</span>
                                                                    <button
                                                                        onClick={() => handleRemoveIngredient(index)}
                                                                        className="ml-2 -mr-1 p-0.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                                                        aria-label={t('removeIngredientAria', { ingredient })}
                                                                    >
                                                                        <CloseIcon className="h-4 w-4" />
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('noCurrentIngredients')}</p>
                                                    )}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                                    <label htmlFor="lactose-intolerant-toggle" className="flex items-center cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                id="lactose-intolerant-toggle"
                                                                className="sr-only peer"
                                                                checked={isLactoseIntolerant}
                                                                onChange={() => setIsLactoseIntolerant(!isLactoseIntolerant)}
                                                                disabled={isLoading}
                                                            />
                                                            <div className="block h-6 w-10 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 transition-colors"></div>
                                                            <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                                                        </div>
                                                        <span className="ml-3">{t('lactoseIntolerantLabel')}</span>
                                                    </label>
                                                     <label htmlFor="dye-allergic-toggle" className="flex items-center cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                id="dye-allergic-toggle"
                                                                className="sr-only peer"
                                                                checked={isAllergicToDye}
                                                                onChange={() => setIsAllergicToDye(!isAllergicToDye)}
                                                                disabled={isLoading}
                                                            />
                                                            <div className="block h-6 w-10 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 transition-colors"></div>
                                                            <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                                                        </div>
                                                        <span className="ml-3">{t('dyeAllergicLabel')}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsTreatmentTypeExpanded(!isTreatmentTypeExpanded)}
                                            className="w-full flex justify-between items-center text-left font-semibold text-gray-700 dark:text-gray-300"
                                            aria-expanded={isTreatmentTypeExpanded}
                                        >
                                            <span>{t('treatmentTypeLabel')}</span>
                                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isTreatmentTypeExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isTreatmentTypeExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                                                <div 
                                                    role="radiogroup" 
                                                    aria-label={t('treatmentTypeLabel')}
                                                    className="flex flex-col sm:flex-row justify-around gap-2"
                                                >
                                                    <button
                                                        role="radio"
                                                        aria-checked={treatmentType === 'all'}
                                                        onClick={() => setTreatmentType('all')}
                                                        className={`w-full text-center cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                                            treatmentType === 'all' 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600 ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-gray-900' 
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {t('allTreatments')}
                                                    </button>
                                                    <button
                                                        role="radio"
                                                        aria-checked={treatmentType === 'topical'}
                                                        onClick={() => setTreatmentType('topical')}
                                                        className={`w-full text-center cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                                            treatmentType === 'topical' 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600 ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-gray-900' 
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {t('topicalTreatment')}
                                                    </button>
                                                    <button
                                                        role="radio"
                                                        aria-checked={treatmentType === 'internal'}
                                                        onClick={() => setTreatmentType('internal')}
                                                        className={`w-full text-center cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                                            treatmentType === 'internal' 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600 ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-gray-900' 
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {t('internalTreatment')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="mt-8 px-4" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                                    {isLoading && <LoadingSpinner />}
                                    {response && (
                                        <div className="animate-fade-in">
                                            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('conditionSummaryTitle')}</h2>
                                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response.summary}</p>
                                            </div>

                                            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {response.formulas.map((formula) => (
                                                    <FormulaCard 
                                                        key={formula.id} 
                                                        formula={formula}
                                                        onSave={handleToggleSaveFormula}
                                                        isSaved={savedFormulas.some(f => f.id === formula.id)}
                                                        doctorName={currentHistoryItem?.doctorName}
                                                        patientName={currentHistoryItem?.patientName}
                                                        observations={currentHistoryItem?.observations}
                                                        createdAt={currentTimestamp}
                                                        iconDataUrl={formulaIcons[formula.name]}
                                                        isGeneratingIcon={generatingIcons.has(formula.name)}
                                                        onExpand={handleExpandFormula}
                                                        customIconUrl={customIcons[formula.id]}
                                                        onCustomIconChange={handleCustomIconChange}
                                                        onRemoveCustomIcon={handleRemoveCustomIcon}
                                                    />
                                                ))}
                                            </div>
                                            <SourceLinks sources={sources} />
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                </div>

                <footer className="text-center mt-12 mb-4 px-4 space-y-2">
                         <div className="flex items-center justify-center space-x-4">
                            <button 
                                onClick={() => setIsContactModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <MailIcon className="h-8 w-8" />
                                <span>{t('contactUs')}</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           {t('footerText', { year: new Date().getFullYear() })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           Desenvolvido por Fabiano Rogalewski | Contato: 41 98804-1250
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                           {t('appVersion', { version: '1.0.1' })}
                        </p>
                </footer>
            </main>

            <ToastContainer toasts={toasts} onClose={removeToast} />

            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={handleWhatsAppPharmacist}
                    className="w-16 h-16 bg-green-500 hover:bg-green-600 flex items-center justify-center rounded-full shadow-lg transition-transform duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-green-500"
                    aria-label={t('talkToPharmacistAria')}
                    title={t('talkToPharmacistTitle')}
                >
                    <UserIcon className="w-8 h-8 text-white" />
                </button>
            </div>

            <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
            <ProductModal 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                productToEdit={productToEdit}
            />

            {expandedFormula && (
                <FormulaDetailModal
                    formula={expandedFormula}
                    doctorName={currentHistoryItem?.doctorName}
                    patientName={currentHistoryItem?.patientName}
                    observations={currentHistoryItem?.observations}
                    onClose={handleCloseExpandedView}
                    isSaved={savedFormulas.some(f => f.id === expandedFormula.id)}
                    onSave={handleToggleSaveFormula}
                    onEdit={handleOpenEditModal}
                    iconDataUrl={formulaIcons[expandedFormula.name]}
                    customIconUrl={customIcons[expandedFormula.id]}
                    onCustomIconChange={handleCustomIconChange}
                    onRemoveCustomIcon={handleRemoveCustomIcon}
                    createdAt={currentTimestamp}
                />
            )}

            <FormulaEditModal
                isOpen={!!formulaToEdit}
                formula={formulaToEdit}
                onClose={handleCloseEditModal}
                onSave={handleUpdateFormula}
            />

            <DeleteUserConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteCurrentUser}
                isDeleting={isDeletingAccount}
            />
            <AdminAuthModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                onUnlock={handleUnlockAdmin}
            />
        </div>
    );
};

export default App;
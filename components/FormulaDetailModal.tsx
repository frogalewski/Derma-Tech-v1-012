import React, { useState, useRef } from 'react';
import { Formula } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkIcon, CheckIcon, CloseIcon, CopyIcon, DownloadIcon, EditIcon, PillIcon, TagIcon, WhatsAppIcon, PrintIcon } from './Icons';

interface FormulaDetailModalProps {
  formula: Formula;
  doctorName?: string;
  patientName?: string;
  observations?: string;
  onClose: () => void;
  isSaved: boolean;
  onSave: (formula: Formula) => void;
  onEdit: (formula: Formula) => void;
  iconDataUrl?: string;
  customIconUrl?: string;
  onCustomIconChange: (formulaId: string, imageDataUrl: string) => void;
  onRemoveCustomIcon: (formulaId: string) => void;
  createdAt?: number | null;
}

const FormulaDetailModal: React.FC<FormulaDetailModalProps> = ({ formula, doctorName, patientName, observations, onClose, isSaved, onSave, onEdit, iconDataUrl, customIconUrl, onCustomIconChange, onRemoveCustomIcon, createdAt }) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, language } = useLanguage();

    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedText(textToCopy);
            setTimeout(() => setCopiedText(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleExportTxt = () => {
        let content = `${t('formulaNameLabel')}: ${formula.name}\n`;
        if (doctorName) content += `${t('doctorLabel')}: ${doctorName}\n`;
        if (patientName) content += `${t('patientLabel')}: ${patientName}\n`;
        if (formula.averageValue) content += `${t('averageValueLabel')}: ${formula.averageValue}\n`;
        content += `\n${t('formulaActionLabel')}:\n${formula.description}\n\n` +
                   `${t('ingredientsLabel')}:\n${formula.ingredients.map(ing => `- ${ing}`).join('\n')}\n\n` +
                   `${t('instructionsLabel')}:\n${formula.instructions}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `formula_${formula.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleWhatsAppQuote = () => {
        const phoneNumber = "5541991994993";
        const messageHeader = `${t('whatsappMessageHeader')}\n\n`;
        const doctorInfo = doctorName ? `*${t('doctorLabel')}:* ${doctorName}\n` : '';
        const formulaName = `*${t('nameLabel')}:* ${formula.name}\n`;
        const ingredientsList = `*${t('ingredientsLabel')}:*\n${formula.ingredients.map(ing => `- ${ing}`).join('\n')}`;
        const fullMessage = `${messageHeader}${doctorInfo}${formulaName}${ingredientsList}\n\n${t('thankYou')}`;
        const encodedMessage = encodeURIComponent(fullMessage);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleEditClick = () => {
        onEdit(formula);
        onClose(); // Close detail view to open edit view
    };

    const handleIconClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert(t('alertSelectImage'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            onCustomIconChange(formula.id, result);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleRemoveIcon = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemoveCustomIcon(formula.id);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const observationsContent = observations ? `
                <div class="observations">
                    <h2>${t('observationsLabel')}</h2>
                    <p>${observations.replace(/\n/g, '<br>')}</p>
                </div>
            ` : '';

            const printContent = `
                <!DOCTYPE html>
                <html lang="${language}">
                <head>
                    <title>${t('prescription')} - ${formula.name}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #000; }
                        @page { size: auto; margin: 25mm; }
                        .main-title { font-size: 26px; font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 40px; }
                        .header { text-align: left; margin-bottom: 30px; line-height: 1.6; }
                        .header p { margin: 2px 0; font-size: 16px; }
                        .content h1 { font-size: 18px; font-weight: bold; margin-bottom: 15px; text-decoration: underline; text-align: center;}
                        .content h2 { font-weight: bold; margin-top: 20px; margin-bottom: 5px; font-size: 16px; }
                        .content ul { list-style-type: none; padding-left: 0; }
                        .content ul li { margin-bottom: 4px; font-size: 16px; }
                        .content p { margin-top: 10px; white-space: pre-wrap; font-size: 16px; }
                        .signature { margin-top: 100px; text-align: center; }
                        .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; }
                        .signature-text { margin-top: 5px; font-size: 16px; }
                        .observations { margin-top: 30px; padding: 15px; border: 2px solid #000; border-radius: 8px; background-color: #f9f9f9; }
                        .observations h2 { font-weight: bold; font-size: 16px; margin-top: 0; margin-bottom: 10px; text-align: center; text-transform: uppercase; }
                        .observations p { font-size: 16px; margin: 0; }
                    </style>
                </head>
                <body>
                    <h1 class="main-title">${t('prescription')}</h1>
                    <div class="header">
                        <p><strong>${t('patientLabel')}:</strong> ${(patientName || '____________________________________________').toUpperCase()}</p>
                        <p><strong>${t('doctorLabel')}:</strong> ${(doctorName || '____________________________________________').toUpperCase()}</p>
                        <p><strong>${t('dateLabel')}:</strong> ${new Date(createdAt || Date.now()).toLocaleDateString(language)}</p>
                    </div>
                    <div class="content">
                        <h1>${formula.name}</h1>
                        <h2>${t('ingredientsLabel')}:</h2>
                        <ul>
                            ${formula.ingredients.map(ing => `<li>- ${ing}</li>`).join('')}
                        </ul>
                        <h2>${t('instructionsLabel')}:</h2>
                        <p>${formula.instructions}</p>
                        ${observationsContent}
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <p class="signature-text">${(doctorName || t('signature')).toUpperCase()}</p>
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
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
                    <div className="flex items-start space-x-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                         <div className="flex-shrink-0 text-center">
                            <div className="h-12 w-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto">
                               {customIconUrl ? (
                                    <img src={customIconUrl} alt={t('customIconFor', { formulaName: formula.name })} className="h-full w-full object-cover rounded-full" />
                                ) : iconDataUrl ? (
                                    <img src={iconDataUrl} alt={t('iconFor', { formulaName: formula.name })} className="h-8 w-8 object-contain" />
                                ) : (
                                   <PillIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                )}
                            </div>
                            <div className="mt-2 flex justify-center items-center gap-2">
                                <button onClick={handleIconClick} className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">
                                    {t('changeButton')}
                                </button>
                                {customIconUrl && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <button onClick={handleRemoveIcon} className="text-xs text-red-500 hover:underline focus:outline-none">
                                        {t('removeButton')}
                                    </button>
                                  </>
                                )}
                            </div>
                        </div>
                        <div>
                             <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">{formula.name}</h2>
                            <div className="mt-1 space-y-0.5">
                                {doctorName && <p className="text-sm text-gray-500 dark:text-gray-400">{t('doctorLabel')}: {doctorName}</p>}
                                {patientName && <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientLabel')}: {patientName}</p>}
                                {createdAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('generatedOn')} {new Date(createdAt).toLocaleString(language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                )}
                            </div>
                             {formula.averageValue && (
                                <div className="mt-2 flex items-center text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/50 px-2 py-1 rounded-md">
                                    <TagIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
                                    <span className="font-medium">{t('averageValueLabel')}:</span>
                                    <span className="ml-1">{formula.averageValue}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <CloseIcon className="h-7 w-7" />
                        <span className="sr-only">{t('closeButton')}</span>
                    </button>
                </header>

                <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
                    <div className="space-y-6">
                        {formula.description && (
                            <div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">{t('formulaActionLabel')}:</h3>
                                    <button onClick={() => handleCopy(formula.description)} title={t('copyAction')} className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {copiedText === formula.description ? <CheckIcon className="h-6 w-6 text-green-500"/> : <CopyIcon className="h-6 w-6"/>}
                                    </button>
                                </div>
                                <p className="mt-2 text-base text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">{formula.description}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">{t('ingredientsLabel')}:</h3>
                            <ul className="mt-2 space-y-2 text-gray-700 dark:text-gray-400">
                                {formula.ingredients.map((ingredient, index) => (
                                    <li key={index} className="flex justify-between items-center group bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                        <span className="text-base">{ingredient}</span>
                                        <button onClick={() => handleCopy(ingredient)} title={t('copyIngredient')} className="ml-2 p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {copiedText === ingredient ? <CheckIcon className="h-6 w-6 text-green-500"/> : <CopyIcon className="h-6 w-6"/>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">{t('instructionsLabel')}:</h3>
                                <button onClick={() => handleCopy(formula.instructions)} title={t('copyInstructions')} className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {copiedText === formula.instructions ? <CheckIcon className="h-6 w-6 text-green-500"/> : <CopyIcon className="h-6 w-6"/>}
                                </button>
                            </div>
                            <p className="mt-2 text-base text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">{formula.instructions}</p>
                        </div>
                    </div>
                </main>

                <footer className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={() => onSave(formula)}
                        className={`flex items-center justify-center space-x-3 px-4 py-3 text-base font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 ${
                            isSaved
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 hover:bg-teal-200'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        <BookmarkIcon className={`h-8 w-8 ${isSaved ? 'fill-current' : ''}`} />
                        <span>{isSaved ? t('savedButton') : t('saveButton')}</span>
                    </button>
                    <button
                        onClick={handleWhatsAppQuote}
                        className="flex items-center justify-center space-x-3 px-4 py-3 text-base text-white font-medium bg-green-500 rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                    >
                        <WhatsAppIcon className="h-8 w-8" />
                        <span>{t('quoteButton')}</span>
                    </button>
                     <button
                        onClick={handleEditClick}
                        className="flex items-center justify-center space-x-3 px-4 py-3 text-base text-blue-700 dark:text-blue-300 font-medium bg-blue-100 dark:bg-blue-900/50 rounded-lg shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                    >
                        <EditIcon className="h-8 w-8" />
                        <span>{t('editButton')}</span>
                    </button>
                    <button
                        onClick={handleExportTxt}
                        className="flex items-center justify-center space-x-3 px-4 py-3 text-base text-blue-700 dark:text-blue-300 font-medium bg-blue-100 dark:bg-blue-900/50 rounded-lg shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                    >
                        <DownloadIcon className="h-8 w-8" />
                        <span>{t('exportButton')}</span>
                    </button>
                     <button
                        onClick={handlePrint}
                        className="flex items-center justify-center space-x-3 px-4 py-3 text-base text-gray-700 dark:text-gray-300 font-medium bg-gray-200 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                        aria-label={t('printAria', { formulaName: formula.name })}
                    >
                        <PrintIcon className="h-8 w-8" />
                        <span>{t('printButton')}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FormulaDetailModal;
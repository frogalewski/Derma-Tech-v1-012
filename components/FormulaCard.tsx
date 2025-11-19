import React, { useState, useRef } from 'react';
import { Formula } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkIcon, CheckIcon, CopyIcon, DownloadIcon, ExpandIcon, PillIcon, TagIcon, TrashIcon, UploadIcon, WhatsAppIcon, PrintIcon } from './Icons';


interface FormulaCardProps {
  formula: Formula;
  onSave: (formula: Formula) => void;
  isSaved: boolean;
  doctorName?: string;
  patientName?: string;
  observations?: string;
  createdAt?: number | null;
  iconDataUrl?: string;
  isGeneratingIcon?: boolean;
  onExpand: (formula: Formula) => void;
  customIconUrl?: string;
  onCustomIconChange: (formulaId: string, imageDataUrl: string) => void;
  onRemoveCustomIcon: (formulaId: string) => void;
}

const FormulaCard: React.FC<FormulaCardProps> = ({ formula, onSave, isSaved, doctorName, patientName, observations, createdAt, iconDataUrl, isGeneratingIcon, onExpand, customIconUrl, onCustomIconChange, onRemoveCustomIcon }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedText(textToCopy);
        setTimeout(() => setCopiedText(null), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const handleExportTxt = () => {
    let content = `${t('formulaNameLabel')}: ${formula.name}\n`;
    if (doctorName) {
        content += `${t('doctorLabel')}: ${doctorName}\n`;
    }
    if (patientName) {
        content += `${t('patientLabel')}: ${patientName}\n`;
    }
    if (formula.averageValue) {
        content += `${t('averageValueLabel')}: ${formula.averageValue}\n`;
    }
    content += `\n${t('formulaActionLabel')}:\n${formula.description}\n\n` +
               `${t('ingredientsLabel')}:\n${formula.ingredients.map(ing => `- ${ing}`).join('\n')}\n\n` +
               `${t('instructionsLabel')}:\n${formula.instructions}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = `formula_${formula.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppQuote = () => {
    const phoneNumber = "5541991994993"; // Brazil country code + number
    const messageHeader = `${t('whatsappMessageHeader')}\n\n`;
    const doctorInfo = doctorName ? `*${t('doctorLabel')}:* ${doctorName}\n` : '';
    const formulaName = `*${t('nameLabel')}:* ${formula.name}\n`;
    const ingredientsList = `*${t('ingredientsLabel')}:*\n${formula.ingredients.map(ing => `- ${ing}`).join('\n')}`;
    
    const fullMessage = `${messageHeader}${doctorInfo}${formulaName}${ingredientsList}\n\n${t('thankYou')}`;
    
    const encodedMessage = encodeURIComponent(fullMessage);
    
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col">
      <div className="p-6 md:p-8 flex-grow">
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 relative group">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    aria-label={t('uploadIconFor', { formulaName: formula.name })}
                />
                <div className="h-14 w-14 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    {customIconUrl ? (
                        <img src={customIconUrl} alt={t('customIconFor', { formulaName: formula.name })} className="h-full w-full object-cover rounded-full" />
                    ) : isGeneratingIcon ? (
                        <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : iconDataUrl ? (
                        <img src={iconDataUrl} alt={t('iconFor', { formulaName: formula.name })} className="h-9 w-9 object-contain" />
                    ) : (
                        <PillIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    )}
                </div>
                 <div className="absolute inset-0 rounded-full bg-gray-900/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer" onClick={handleIconClick}>
                    <span title={t('changeIcon')} className="p-1 text-white hover:text-blue-300 rounded-full">
                        <UploadIcon className="h-6 w-6" />
                    </span>
                    {customIconUrl && (
                        <button onClick={handleRemoveIcon} title={t('removeIcon')} className="p-1 text-white hover:text-red-400 rounded-full z-10">
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{formula.name}</h3>
                {(doctorName || patientName || createdAt) && (
                    <div className="mt-1.5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {doctorName && <p className="truncate">{t('doctorLabel')}: {doctorName}</p>}
                        {patientName && <p className="truncate">{t('patientLabel')}: {patientName}</p>}
                        {createdAt && (
                            <p>
                                {t('generatedOn')}{' '}
                                {new Date(createdAt).toLocaleString(language, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        )}
                    </div>
                )}
                {formula.averageValue && (
                    <div className="mt-2.5 inline-flex items-center text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-500/30">
                        <TagIcon className="h-5 w-5 mr-1.5" />
                        <span>{t('averageValueLabel')}: {formula.averageValue}</span>
                    </div>
                )}
                {formula.description && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('formulaActionLabel')}:</h4>
                            <button onClick={() => handleCopy(formula.description)} title={t('copyAction')} className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {copiedText === formula.description ? <CheckIcon className="h-5 w-5 text-green-500"/> : <CopyIcon className="h-5 w-5"/>}
                            </button>
                        </div>
                        <p className="mt-2 text-gray-700 dark:text-gray-400 leading-relaxed">{formula.description}</p>
                    </div>
                )}
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('ingredientsLabel')}:</h4>
                    <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-400">
                        {formula.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex justify-between items-center group -mx-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <div className="flex items-center">
                                <span className="text-blue-500 mr-3 font-semibold">–</span>
                                <span>{ingredient}</span>
                            </div>
                             <button onClick={() => handleCopy(ingredient)} title={t('copyIngredient')} className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-opacity">
                                {copiedText === ingredient ? <CheckIcon className="h-8 w-8 text-green-500"/> : <CopyIcon className="h-8 w-8"/>}
                            </button>
                          </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('instructionsLabel')}:</h4>
                        <button onClick={() => handleCopy(formula.instructions)} title={t('copyInstructions')} className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                             {copiedText === formula.instructions ? <CheckIcon className="h-5 w-5 text-green-500"/> : <CopyIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-400 leading-relaxed">{formula.instructions}</p>
                </div>
            </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
            onClick={() => onSave(formula)}
            className={`w-full flex items-center justify-center space-x-3 px-4 py-3 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200 ${
                isSaved
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 hover:bg-teal-200'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={isSaved ? t('unsaveFormulaAria', { formulaName: formula.name }) : t('saveFormulaAria', { formulaName: formula.name })}
        >
            <BookmarkIcon className={`h-8 w-8 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? t('savedButton') : t('saveButton')}</span>
        </button>
        <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-base text-gray-700 dark:text-gray-300 font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
            aria-label={t('printAria', { formulaName: formula.name })}
        >
            <PrintIcon className="h-8 w-8" />
            <span>{t('printButton')}</span>
        </button>
        <button
            onClick={handleExportTxt}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-base text-blue-700 dark:text-blue-300 font-medium bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
            aria-label={t('exportFormulaAria', { formulaName: formula.name })}
        >
            <DownloadIcon className="h-8 w-8" />
            <span>TXT</span>
        </button>
         <button
            onClick={() => onExpand(formula)}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-base text-gray-700 dark:text-gray-300 font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
            aria-label={t('expandFormulaAria', { formulaName: formula.name })}
        >
            <ExpandIcon className="h-8 w-8" />
            <span>{t('expandButton')}</span>
        </button>
        <button
            onClick={handleWhatsAppQuote}
            className="sm:col-span-2 w-full flex items-center justify-center space-x-3 px-4 py-4 text-base text-white font-medium bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-200"
            aria-label={t('requestQuoteAria', { formulaName: formula.name })}
        >
            <WhatsAppIcon className="h-8 w-8" />
            <span>{t('quoteButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default FormulaCard;




import React, { useState, useRef, useCallback, useEffect } from 'react';
import { readPrescription } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { PrescriptionData, SavedPrescription } from '../types';
import { CameraIcon, CloseIcon, UploadIcon, InfoIcon, UserIcon, CalendarIcon, PillIcon, WhatsAppIcon, BookmarkIcon } from './Icons';
import { ToastData } from './ToastContainer';

interface PrescriptionReaderProps {
    onSearch: (term: string) => void;
    addToast: (message: string, type?: ToastData['type']) => void;
    onSave: (data: PrescriptionData, previewUrl: string) => void;
    initialData: SavedPrescription | null;
    onClearInitialData: () => void;
}

const fileToBase64 = (file: File): Promise<{ base64: string, dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, dataUrl });
        };
        reader.onerror = error => reject(error);
    });
};

const PrescriptionReader: React.FC<PrescriptionReaderProps> = ({ onSearch, addToast, onSave, initialData, onClearInitialData }) => {
    const { t, language } = useLanguage();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<PrescriptionData | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (initialData) {
            setExtractedData(initialData.data);
            setPreviewUrl(initialData.imagePreviewUrl);
            setSelectedFile(null); // We don't have the file object for a saved item
            setIsSaved(true); // Assume it's saved as we're viewing it
            onClearInitialData(); // Consume it so it's not reused on re-render
        }
    }, [initialData, onClearInitialData]);

    const resetState = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsLoading(false);
        setExtractedData(null);
        setIsSaved(false);
        if (isCameraOpen) {
            stopCamera();
        }
        setIsCameraOpen(false);
    }, [isCameraOpen]);


    const handleFileSelect = async (file: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast(t('toastErrorInvalidImage'), 'error');
            return;
        }

        try {
            const { dataUrl } = await fileToBase64(file);
            setPreviewUrl(dataUrl);
            setSelectedFile(file);
            setExtractedData(null);
            setIsSaved(false);
        } catch (error) {
            console.error(error);
            addToast(t('toastErrorReadingImage'), 'error');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0] || null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileSelect(e.dataTransfer.files?.[0] || null);
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setExtractedData(null);

        try {
            const { base64 } = await fileToBase64(selectedFile);
            const jsonString = await readPrescription(base64, selectedFile.type, language);
            const parsedData: PrescriptionData = JSON.parse(jsonString.replace(/```json/g, '').replace(/```/g, '').trim());
            setExtractedData(parsedData);
            setIsSaved(false);
        } catch (e) {
            console.error("Failed during analysis:", e);
            if (e instanceof SyntaxError) {
                addToast(t('toastErrorApiParse'), 'error');
            } else if (e instanceof Error) {
                addToast(e.message, 'error');
            } else {
                addToast(t('toastErrorUnknown'), 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (isCameraOpen) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOpen(true);
            }
        } catch (err) {
            console.error("Camera error:", err);
            addToast(t('toastErrorCamera'), 'error');
        }
    }, [addToast, isCameraOpen, t]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleTakePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob((blob) => {
                if(blob){
                    const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
                    handleFileSelect(file);
                    stopCamera();
                    setIsCameraOpen(false);
                }
            }, 'image/jpeg');
        }
    };

    const handleWhatsAppQuote = () => {
        if (!extractedData) return;

        const phoneNumber = "5541991994993";
        let message = `${t('prescriptionWhatsAppHeader')}\n\n`;
        
        if (extractedData.doctorName) {
            message += `*${t('doctorLabel')}:* ${extractedData.doctorName}\n`;
        }
        if (extractedData.patientName) {
            message += `*${t('patientLabel')}:* ${extractedData.patientName}\n`;
        }
        if (extractedData.date) {
            message += `*${t('dateLabel')}:* ${extractedData.date}\n`;
        }
        message += `\n*${t('prescribedItems')}:*\n`;

        if (extractedData.prescribedItems && extractedData.prescribedItems.length > 0) {
            message += extractedData.prescribedItems.map(item => `- ${item.name} (${item.instructions})`).join('\n');
        } else {
            message += t('noItemsFound');
        }

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSave = () => {
        if (extractedData && previewUrl) {
            onSave(extractedData, previewUrl);
            setIsSaved(true);
        }
    };

    if (extractedData) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{t('analysisResults')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center"><UserIcon className="h-5 w-5 mr-2" />{t('doctorLabel')}</h3>
                        <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{extractedData.doctorName || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center"><UserIcon className="h-5 w-5 mr-2" />{t('patientLabel')}</h3>
                        <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{extractedData.patientName || 'N/A'}</p>
                    </div>
                     <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg col-span-1 md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center"><CalendarIcon className="h-5 w-5 mr-2" />{t('dateLabel')}</h3>
                        <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{extractedData.date || 'N/A'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center"><PillIcon className="h-6 w-6 mr-2" />{t('prescribedItems')}</h3>
                    <div className="space-y-4">
                        {extractedData.prescribedItems?.length > 0 ? (
                            extractedData.prescribedItems.map((item, index) => (
                                <div key={index} className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.instructions}</p>
                                        </div>
                                        <button onClick={() => onSearch(item.name)} className="ml-4 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-semibold px-3 py-2 rounded-md whitespace-nowrap transition-colors">
                                            {t('searchFormulasFor')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : <p className="text-gray-500 dark:text-gray-400">{t('noItemsFound')}</p>}
                    </div>
                </div>
                <div className="mt-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className={`w-full flex items-center justify-center space-x-3 px-4 py-3 text-base font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200 ${
                                isSaved
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            <BookmarkIcon className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
                            <span>{isSaved ? t('readingSaved') : t('saveReading')}</span>
                        </button>
                        <button
                            onClick={handleWhatsAppQuote}
                            className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-base text-white font-medium bg-green-500 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                        >
                            <WhatsAppIcon className="h-6 w-6" />
                            <span>{t('quoteOnWhatsApp')}</span>
                        </button>
                    </div>
                    <button onClick={resetState} className="w-full px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors flex items-center justify-center">
                        {t('uploadNew')}
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <section>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('prescriptionReaderTitle')}</h2>
                
                {isCameraOpen ? (
                    <div className="animate-fade-in">
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                            <canvas ref={canvasRef} className="hidden" />
                            <button onClick={stopCamera} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75">
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <button onClick={handleTakePicture} className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                           <CameraIcon className="h-6 w-6" /> {t('takePicture')}
                        </button>
                    </div>
                ) : !previewUrl ? (
                    <div className="animate-fade-in">
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            className="mt-4 p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                        >
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                                <UploadIcon className="h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{t('uploadAreaTitle')}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('uploadAreaDescription')}</p>
                            </label>
                        </div>
                        <div className="my-4 flex items-center">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">{t('or')}</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <button onClick={startCamera} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700">
                           <CameraIcon className="h-6 w-6" /> {t('useCamera')}
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in text-center">
                        <img src={previewUrl} alt="Prescription preview" className="max-h-80 w-auto mx-auto rounded-lg shadow-md mb-4" />
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{t('analyzing')}</span>
                                </>
                            ) : (
                                <span>{t('analyzeButton')}</span>
                            )}
                        </button>
                         <button onClick={resetState} className="mt-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:underline">
                            {t('uploadNew')}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PrescriptionReader;
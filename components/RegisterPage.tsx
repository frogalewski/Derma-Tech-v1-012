import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';
import { MailIcon, LockIcon, UserIcon } from './Icons';
import ToastContainer, { ToastData } from './ToastContainer';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const backgroundImageUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBYWFRgWFhYZGRgaHBwaHBwaHBocHBwaHBwhHBwcHB4cIS4lHB4rIRwaJjgmKy8xNTU1GiQ7QDs0Py40NTEBDAwMEA8QHhISHzQrISs0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NP/AABEIALcBEwMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAADAAECBAUGB//EAD4QAAIBAgQDBgQDBgYDAAMAAAECEQADBBIhMQVBUWEGEyJxgTKhFCNCscHR8FLhB2Jy8RYkM4KSolOywv/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACQRAQEAAgICAgICAwEAAAAAAAABAhEhMRIDQVEEEyJhcYEU/gA AMAwEAAhEDEQA/APxWiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooNmiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAo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`;

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: ToastData['type'] = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };


  const validateForm = (): boolean => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t('fieldRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setError(t('invalidEmail'));
        return false;
    }
    if (password.length < 6) {
        setError(t('passwordMinLength'));
        return false;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) {
        return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      addToast(t('registerSuccess'), 'success');
      setTimeout(onSwitchToLogin, 2000); // Redirect to login after showing success
    } catch (err: any) {
      setError(err.message || t('registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-gray-900 bg-cover bg-center"
        style={{ backgroundImage: `url("${backgroundImageUrl}")` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
             <Logo className="h-20 w-auto text-white mx-auto" />
          </div>
          <div className="bg-gray-900/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-center text-white mb-6">{t('registerTitle')}</h2>
            {error && <p className="bg-red-500/30 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">{t('nameLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </span>
                  <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} className="uppercase w-full pl-11 pr-4 py-2.5 bg-gray-700/50 text-white placeholder-gray-300 border border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" required />
                </div>
              </div>
              <div>
                <label htmlFor="email-reg" className="block text-sm font-medium text-gray-200 mb-1">{t('emailLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MailIcon className="h-6 w-6 text-gray-400" />
                  </span>
                  <input type="email" id="email-reg" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="lowercase w-full pl-11 pr-4 py-2.5 bg-gray-700/50 text-white placeholder-gray-300 border border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" required />
                </div>
              </div>
              <div>
                <label htmlFor="password-reg" className="block text-sm font-medium text-gray-200 mb-1">{t('passwordLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-6 w-6 text-gray-400" />
                  </span>
                  <input type="password" id="password-reg" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className="w-full pl-11 pr-4 py-2.5 bg-gray-700/50 text-white placeholder-gray-300 border border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" required />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-200 mb-1">{t('confirmPasswordLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-6 w-6 text-gray-400" />
                  </span>
                  <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('confirmPasswordPlaceholder')} className="w-full pl-11 pr-4 py-2.5 bg-gray-700/50 text-white placeholder-gray-300 border border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" required />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {t('registering')}
                  </>
                ) : (
                  t('registerButton')
                )}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-300">
              {t('haveAccountPrompt')}{' '}
              <button onClick={onSwitchToLogin} className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline">
                {t('loginNow')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import * as authService from '../services/authService';
import { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = () => {
            try {
                const userJson = sessionStorage.getItem('currentUser');
                if (userJson) {
                    setCurrentUser(JSON.parse(userJson));
                }
            } catch (error) {
                console.error("Failed to parse user from session storage", error);
                sessionStorage.removeItem('currentUser');
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const user = await authService.login(email, password);
        setCurrentUser(user);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        return await authService.register(name, email, password);
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    }, []);

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated: !!currentUser,
            login,
            register,
            logout,
            isLoading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';

interface User {
    fullname: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (fullname: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('gw_token');
            const savedUser = localStorage.getItem('gw_user');
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }
        } catch {
            localStorage.removeItem('gw_token');
            localStorage.removeItem('gw_user');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token: tk, user: usr } = res.data;
            localStorage.setItem('gw_token', tk);
            localStorage.setItem('gw_user', JSON.stringify(usr));
            setToken(tk);
            setUser(usr);
        } catch (err) {
            setError(getApiErrorMessage(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (fullname: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post('/auth/signup', { fullname, email, password });
            const { token: tk, user: usr } = res.data;
            localStorage.setItem('gw_token', tk);
            localStorage.setItem('gw_user', JSON.stringify(usr));
            setToken(tk);
            setUser(usr);
        } catch (err) {
            setError(getApiErrorMessage(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('gw_token');
        localStorage.removeItem('gw_user');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{
            user, token, isLoading,
            isAuthenticated: !!token && !!user,
            login, register, logout,
            error, clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

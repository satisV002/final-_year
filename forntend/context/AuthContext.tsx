'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import Cookies from 'js-cookie';

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

    // Restore session from localStorage/Cookies on mount
    useEffect(() => {
        try {
            const savedToken = Cookies.get('gw_token') || localStorage.getItem('gw_token');
            const savedUser = localStorage.getItem('gw_user');

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                // Ensure cookie is set if it was only in localStorage
                if (!Cookies.get('gw_token')) {
                    Cookies.set('gw_token', savedToken, { expires: 7, sameSite: 'lax' });
                }
            }
        } catch {
            localStorage.removeItem('gw_token');
            localStorage.removeItem('gw_user');
            Cookies.remove('gw_token');
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
            Cookies.set('gw_token', tk, { expires: 7, sameSite: 'lax' });

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
            Cookies.set('gw_token', tk, { expires: 7, sameSite: 'lax' });

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
        Cookies.remove('gw_token');
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

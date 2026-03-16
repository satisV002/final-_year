'use client';

import { useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Droplets, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WaterCharacter from '@/components/ui/WaterCharacter';

const FIELD_BASE = 'w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all';
const FIELD_VALID = 'border-white/10 focus:ring-cyan-500/40 focus:border-cyan-500/40';
const FIELD_ERR = 'border-red-500/60 focus:ring-red-500/30';

export default function LoginPage() {
    const { login, isLoading, error, clearError } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const validate = () => {
        const errs: typeof fieldErrors = {};
        if (!email) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
        if (!password) errs.password = 'Password is required';
        else if (password.length < 8) errs.password = 'At least 8 characters';
        return errs;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }
        setFieldErrors({});
        try {
            await login(email, password);
            setIsSuccess(true);
            // Small delay to show success animation before redirect
            setTimeout(() => router.push('/overview'), 1200);
        } catch { /* error shown via context */ }
    };

    const hasError = !!error && !isLoading;

    return (
        <div className="min-h-screen flex overflow-hidden bg-slate-950">
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-48 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
            </div>

            {/* ── RIGHT: Form (Shifted slightly right) ── */}
            <motion.div
                className="relative z-10 flex flex-col justify-center w-full max-w-md px-8 py-12 lg:px-12 lg:ml-auto lg:mr-16 xl:mr-24 bg-slate-900/40 backdrop-blur-sm border-l border-white/5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Logo */}
                <div className="mb-8">
                    <Link href="/home" className="inline-flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                            <Droplets className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white text-lg">AquaWatch</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mt-8 mb-1">Welcome back</h1>
                    <p className="text-slate-400 text-sm">Sign in to your groundwater monitoring dashboard</p>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {hasError && (
                        <motion.div
                            className="mb-5 flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm"
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                        <input
                            id="email" type="email" autoComplete="email"
                            value={email}
                            onChange={e => { setEmail(e.target.value); clearError(); }}
                            placeholder="you@example.com"
                            className={`${FIELD_BASE} ${fieldErrors.email ? FIELD_ERR : FIELD_VALID}`}
                        />
                        {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPass ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); clearError(); }}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                placeholder="••••••••"
                                className={`${FIELD_BASE} pr-12 ${fieldErrors.password ? FIELD_ERR : FIELD_VALID}`}
                            />
                            <button type="button" tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                onClick={() => setShowPass(p => !p)}
                            >
                                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
                    </div>

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        disabled={isLoading || isSuccess}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 mt-2"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                        ) : isSuccess ? (
                            <><span>✓</span> Redirecting...</>
                        ) : (
                            <>Sign In <ChevronRight className="w-4 h-4" /></>
                        )}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Don&apos;t have an account?{' '}
                    <button
                        onClick={() => router.push('/register')}
                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer hover:underline"
                    >
                        Create one
                    </button>
                </p>

                {/* Footer notice */}
                <p className="mt-auto pt-8 text-xs text-slate-600 text-center">
                    AquaWatch · India Groundwater Monitoring System · CGWB Data
                </p>
            </motion.div>

            {/* ── LEFT: Character (Visual Panel) ── */}
            <motion.div
                className="hidden lg:flex flex-1 items-center justify-center relative order-first"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Panel BG */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-cyan-950/20 to-blue-950/40 border-l border-white/5" />

                {/* Floating info cards */}
                <motion.div
                    className="absolute top-12 right-10 glass rounded-xl px-4 py-3 text-xs text-left min-w-[160px]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                >
                    <p className="text-slate-500 mb-0.5">Monitoring</p>
                    <p className="text-cyan-400 font-semibold">5,260+ Stations</p>
                </motion.div>

                <motion.div
                    className="absolute bottom-16 left-10 glass rounded-xl px-4 py-3 text-xs text-left"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                >
                    <p className="text-slate-500 mb-0.5">LSTM Model</p>
                    <p className="text-green-400 font-semibold">87% accuracy</p>
                </motion.div>

                <motion.div
                    className="absolute top-1/3 left-8 glass rounded-xl px-4 py-3 text-xs"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1.8 }}
                >
                    <p className="text-slate-500 mb-0.5">Real-time</p>
                    <p className="text-blue-400 font-semibold">WRIS Data</p>
                </motion.div>

                {/* Character */}
                <div className="relative z-10 w-64 h-64">
                    <WaterCharacter
                        isPasswordFocused={passwordFocused}
                        hasError={hasError}
                        isSuccess={isSuccess}
                        isLoading={isLoading}
                        mood="welcome"
                    />
                </div>

                {/* Headline text */}
                <div className="absolute bottom-12 text-center px-8 z-10">
                    <h2 className="text-white font-semibold text-lg">Sustainable Groundwater</h2>
                    <p className="text-cyan-400 font-semibold">Management System</p>
                    <p className="text-slate-500 text-xs mt-2">
                        India WRIS · CGWB · Real-time Data
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

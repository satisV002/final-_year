'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Droplets, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WaterCharacter from '@/components/ui/WaterCharacter';

const FIELD_BASE = 'w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all';
const FIELD_VALID = 'border-white/10 focus:ring-cyan-500/40 focus:border-cyan-500/40';
const FIELD_ERR = 'border-red-500/60 focus:ring-red-500/30';

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: '8+ characters', ok: password.length >= 8 },
        { label: 'Uppercase', ok: /[A-Z]/.test(password) },
        { label: 'Lowercase', ok: /[a-z]/.test(password) },
        { label: 'Number', ok: /\d/.test(password) },
    ];
    const score = checks.filter(c => c.ok).length;
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                    <motion.div key={i}
                        className={`h-1 flex-1 rounded-full ${i < score ? colors[score - 1] : 'bg-white/10'}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < score ? 1 : 0.3 }}
                        transition={{ duration: 0.2 }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
                {checks.map(c => (
                    <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-green-400' : 'text-slate-500'}`}>
                        <CheckCircle2 className="w-3 h-3" /> {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const { register, isLoading, error, clearError } = useAuth();
    const router = useRouter();

    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!fullname.trim() || fullname.trim().length < 3) errs.fullname = 'At least 3 characters';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
        if (!password || password.length < 8) errs.password = 'At least 8 characters';
        else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
            errs.password = 'Need uppercase, lowercase, and a number';
        }
        if (password !== confirm) errs.confirm = 'Passwords do not match';
        return errs;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }
        setFieldErrors({});
        try {
            await register(fullname.trim(), email, password);
            setIsSuccess(true);
            setTimeout(() => router.push('/about'), 1200);
        } catch { /* error shown via context */ }
    };

    const hasError = !!error && !isLoading;

    return (
        <div className="min-h-screen flex overflow-hidden bg-slate-950">
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-48 -right-48 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* ── LEFT: Form (Shifted slightly right from left edge) ── */}
            <motion.div
                className="relative z-10 flex flex-col justify-center w-full max-w-md px-8 py-10 lg:px-12 lg:ml-16 xl:ml-24"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-6">
                    <Link href="/home" className="inline-flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                            <Droplets className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white text-lg">AquaWatch</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mt-7 mb-1">Create account</h1>
                    <p className="text-slate-400 text-sm">Join India's groundwater monitoring platform</p>
                </div>

                <AnimatePresence>
                    {hasError && (
                        <motion.div
                            className="mb-4 flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                    {/* Full name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
                        <input id="fullname" type="text" value={fullname}
                            onChange={e => { setFullname(e.target.value); clearError(); }}
                            placeholder="John Doe"
                            className={`${FIELD_BASE} ${fieldErrors.fullname ? FIELD_ERR : FIELD_VALID}`}
                        />
                        {fieldErrors.fullname && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.fullname}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                        <input id="email" type="email" value={email}
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
                            <input id="password" type={showPass ? 'text' : 'password'} value={password}
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
                        <PasswordStrength password={password} />
                    </div>

                    {/* Confirm */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm password</label>
                        <input id="confirm" type="password" value={confirm}
                            onChange={e => { setConfirm(e.target.value); clearError(); }}
                            placeholder="••••••••"
                            className={`${FIELD_BASE} ${fieldErrors.confirm ? FIELD_ERR : FIELD_VALID}`}
                        />
                        {fieldErrors.confirm && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirm}</p>}
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading || isSuccess}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 mt-1"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> :
                            isSuccess ? <><span>✓</span> Welcome! Redirecting...</> :
                                <>Create Account <ChevronRight className="w-4 h-4" /></>}
                    </motion.button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign in</Link>
                </p>
            </motion.div>

            {/* ── RIGHT: Character ── */}
            <motion.div
                className="hidden lg:flex flex-1 items-center justify-center relative"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-teal-950/20 to-cyan-950/40 border-l border-white/5" />

                <motion.div
                    className="absolute top-16 right-12 glass rounded-xl px-4 py-3 text-xs"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                >
                    <p className="text-slate-500 mb-0.5">Join</p>
                    <p className="text-cyan-400 font-semibold">5,260+ Stations</p>
                </motion.div>

                <motion.div
                    className="absolute bottom-20 left-12 glass rounded-xl px-4 py-3 text-xs"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                >
                    <p className="text-slate-500 mb-0.5">Free Access to</p>
                    <p className="text-green-400 font-semibold">WRIS Data</p>
                </motion.div>

                <div className="relative z-10 w-64 h-64">
                    <WaterCharacter
                        isPasswordFocused={passwordFocused}
                        hasError={hasError}
                        isSuccess={isSuccess}
                        isLoading={isLoading}
                        mood="welcome"
                    />
                </div>

                <div className="absolute bottom-12 text-center px-8 z-10">
                    <p className="text-white font-semibold">Save Groundwater.</p>
                    <p className="text-cyan-400 font-semibold text-lg">Every Drop Matters.</p>
                </div>
            </motion.div>
        </div>
    );
}

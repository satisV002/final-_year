'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Droplets, BarChart3, MapPin, BrainCircuit,
    CloudRain, Shield, ArrowRight, ChevronRight,
    RadioTower, Waves, TrendingUp
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
    { icon: MapPin, title: 'Interactive Map', desc: 'Real-time DWLR station data plotted on India map with color-coded water level indicators.', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20' },
    { icon: BrainCircuit, title: 'ML Predictions', desc: 'LSTM-powered forecasting for 2026 groundwater levels using historical CGWB data.', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/20' },
    { icon: CloudRain, title: 'Rainfall Correlation', desc: 'Understand how monsoon rainfall patterns impact groundwater levels across states.', color: 'from-blue-500/20 to-teal-500/20 border-blue-500/20' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Comprehensive charts, trends, and downloadable reports for researchers and policymakers.', color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20' },
    { icon: RadioTower, title: '5,260+ Stations', desc: 'Coverage across all major Indian states via WRIS data — Telangana, Odisha, UP, and more.', color: 'from-orange-500/20 to-red-500/20 border-orange-500/20' },
    { icon: Shield, title: 'Secure Platform', desc: 'JWT-authenticated access, rate limiting, and encrypted data pipeline.', color: 'from-slate-500/20 to-slate-400/20 border-slate-500/20' },
];

const stats = [
    { val: '5,260+', label: 'DWLR Stations', icon: RadioTower, color: 'text-cyan-400' },
    { val: '28', label: 'Indian States', icon: MapPin, color: 'text-blue-400' },
    { val: '87%', label: 'ML Accuracy', icon: BrainCircuit, color: 'text-violet-400' },
    { val: '2026', label: 'Forecast Ready', icon: TrendingUp, color: 'text-green-400' },
];

const howItWorks = [
    { step: '01', title: 'Register & Login', desc: 'Create a free account to access the full monitoring platform.' },
    { step: '02', title: 'Search & Filter', desc: 'Select state, district, station, and date range to query live WRIS data.' },
    { step: '03', title: 'Visualize & Predict', desc: 'Explore charts, maps, trends, and ML-powered 2026 forecasts.' },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white">AquaWatch</span>
                    <span className="hidden sm:block text-xs text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">India</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">About</Link>
                    <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
                    <Link href="/register"
                        className="text-sm px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:opacity-90 transition">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
                {/* BG glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-40 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-1/4 w-96 h-96 bg-teal-500/6 rounded-full blur-3xl" />
                </div>

                <motion.div
                    className="relative z-10 max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-medium mb-6">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        Real-time Monitoring Active · CGWB Data
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                        Sustainable<br />
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Groundwater
                        </span><br />
                        Management
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                        Advanced monitoring and AI-driven prediction for India's DWLR network.
                        Empowering researchers and policymakers with actionable groundwater insights.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register"
                            className="px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center gap-2 shadow-xl shadow-cyan-500/25 text-sm">
                            Open Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/about"
                            className="px-7 py-3.5 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition text-sm">
                            Learn More
                        </Link>
                    </div>
                </motion.div>

                {/* Floating water drop character */}
                <motion.div
                    className="relative z-10 mt-16 mx-auto w-32 h-32"
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <svg viewBox="0 0 200 260" width="128" height="128">
                        <defs>
                            <radialGradient id="heroDropGrad" cx="40%" cy="35%" r="60%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#0369a1" />
                            </radialGradient>
                        </defs>
                        <path d="M100 20 C100 20, 160 90, 160 150 C160 195, 134 225, 100 225 C66 225, 40 195, 40 150 C40 90, 100 20, 100 20 Z" fill="url(#heroDropGrad)" opacity="0.9" />
                        <ellipse cx="72" cy="90" rx="14" ry="22" fill="rgba(255,255,255,0.2)" transform="rotate(-20, 72, 90)" />
                        <circle cx="75" cy="155" r="14" fill="white" />
                        <circle cx="75" cy="155" r="8" fill="#1e293b" />
                        <circle cx="125" cy="155" r="14" fill="white" />
                        <circle cx="125" cy="155" r="8" fill="#1e293b" />
                        <path d="M82 190 Q100 205 118 190" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </motion.div>
            </section>

            {/* ── STATS ── */}
            <section className="py-12 px-6 border-y border-white/5 bg-slate-900/30">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                        <motion.div key={s.label}
                            className="text-center"
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                        >
                            <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                            <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div className="text-center mb-14"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Everything You Need</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Professional-grade groundwater analytics for researchers, policymakers, and water resource managers.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <motion.div key={f.title}
                                className={`bg-gradient-to-br ${f.color} border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
                                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                    <f.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-20 px-6 bg-slate-900/30">
                <div className="max-w-4xl mx-auto">
                    <motion.div className="text-center mb-14"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {howItWorks.map((s, i) => (
                            <motion.div key={s.step} className="text-center relative"
                                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-cyan-400 font-bold text-lg">{s.step}</span>
                                </div>
                                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                                <p className="text-slate-400 text-sm">{s.desc}</p>
                                {i < 2 && <ChevronRight className="hidden md:block absolute top-7 -right-4 text-slate-600 w-5 h-5" />}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AWARENESS BANNER ── */}
            <section className="py-16 px-6">
                <motion.div
                    className="max-w-3xl mx-auto text-center"
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                >
                    <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/15 rounded-3xl p-10">
                        <Waves className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Save Groundwater.
                            <span className="text-cyan-400"> Every Drop Matters.</span>
                        </h2>
                        <p className="text-slate-400 mb-6 max-w-xl mx-auto">
                            India's groundwater serves over 85% of rural drinking water needs.
                            Monitoring and conservation today determines availability for future generations.
                        </p>
                        <Link href="/register"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-cyan-500/25 text-sm">
                            Start Monitoring <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-8 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Droplets className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">AquaWatch India</span>
                </div>
                <p className="text-slate-600 text-xs">
                    Data sourced from India WRIS · Central Ground Water Board (CGWB) · Open-Meteo
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-600">
                    <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
                    <Link href="/login" className="hover:text-slate-400 transition-colors">Sign In</Link>
                    <Link href="/register" className="hover:text-slate-400 transition-colors">Register</Link>
                </div>
            </footer>
        </div>
    );
}

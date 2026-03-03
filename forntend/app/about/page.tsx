'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Droplets, Shield, BarChart3, BrainCircuit, CloudRain, MapPin, ArrowRight, Database, Globe } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const tech = [
    { name: 'Next.js 16', cat: 'Frontend', color: 'bg-slate-700' },
    { name: 'React 19', cat: 'Frontend', color: 'bg-cyan-500/20' },
    { name: 'TypeScript', cat: 'Language', color: 'bg-blue-500/20' },
    { name: 'Tailwind CSS v4', cat: 'Styling', color: 'bg-teal-500/20' },
    { name: 'Framer Motion', cat: 'Animation', color: 'bg-violet-500/20' },
    { name: 'Recharts', cat: 'Visualization', color: 'bg-green-500/20' },
    { name: 'Leaflet + React Leaflet', cat: 'Maps', color: 'bg-orange-500/20' },
    { name: 'Express.js + TypeScript', cat: 'Backend', color: 'bg-red-500/20' },
    { name: 'MongoDB Atlas', cat: 'Database', color: 'bg-emerald-500/20' },
    { name: 'India WRIS · CGWB', cat: 'Data Source', color: 'bg-cyan-500/20' },
    { name: 'Open-Meteo', cat: 'Rainfall API', color: 'bg-blue-500/20' },
    { name: 'JWT Auth', cat: 'Security', color: 'bg-yellow-500/20' },
];

const goals = [
    { icon: MapPin, title: 'Monitor Nation-wide', desc: 'Real-time DWLR station data from India WRIS across all major states. Visual, searchable, and downloadable.' },
    { icon: BarChart3, title: 'Analyze Trends', desc: 'Historical charts, district-level comparisons, and rainfall correlation to understand groundwater dynamics.' },
    { icon: BrainCircuit, title: 'Predict Future Levels', desc: 'ML-powered LSTM forecasting to estimate 2026 groundwater levels based on historical CGWB data.' },
    { icon: CloudRain, title: 'Rainfall Impact', desc: 'Visualize how monsoon patterns influence groundwater across states using Open-Meteo precipitation data.' },
    { icon: Shield, title: 'Secure & Fast', desc: 'Production-ready JWT auth, rate limiting, Helmet security headers, and MongoDB Atlas for reliability.' },
    { icon: Globe, title: 'Open & Accessible', desc: 'Built on public data sources. Research-grade platform designed for policymakers, researchers, and students.' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur border-b border-white/5">
                <Link href="/home" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white">AquaWatch</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
                    <Link href="/register"
                        className="text-sm px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:opacity-90 transition">
                        Get Started
                    </Link>
                </div>
            </nav>

            <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
                {/* Hero */}
                <motion.div className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/25">
                        <Droplets className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        About <span className="text-cyan-400">AquaWatch India</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        India's groundwater monitoring and prediction platform — built to help understand,
                        protect, and sustainably manage one of our most precious resources.
                    </p>
                </motion.div>

                {/* Purpose */}
                <motion.div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/15 rounded-3xl p-8 mb-12"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-2xl font-bold text-white mb-4">Our Purpose</h2>
                    <p className="text-slate-300 leading-relaxed mb-4">
                        AquaWatch India was created to democratize access to groundwater monitoring data from the
                        <span className="text-cyan-400"> Central Ground Water Board (CGWB)</span> and
                        <span className="text-cyan-400"> India WRIS</span> portal. India's groundwater crisis affects
                        over 600 million people — yet most data remains hidden in PDFs and government portals.
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                        By combining real-time DWLR (Digital Water Level Recorder) station data with
                        ML-powered predictions and rainfall analysis, AquaWatch gives researchers,
                        water managers, and policymakers actionable insights to drive better decisions.
                    </p>
                </motion.div>

                {/* Goals */}
                <div className="mb-14">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">What We Do</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {goals.map((g, i) => (
                            <motion.div key={g.title}
                                className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            >
                                <g.icon className="w-6 h-6 text-cyan-400 mb-3" />
                                <h3 className="text-white font-semibold mb-2">{g.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{g.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Data Sources */}
                <motion.div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-10"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">Data Sources</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        {[
                            { src: 'India WRIS · CGWB', detail: 'DWLR groundwater level readings across all major Indian states. Updated regularly via REST API.', link: 'https://indiawris.gov.in' },
                            { src: 'Open-Meteo', detail: 'Free precision weather API for historical and forecast rainfall data. No API key required.', link: 'https://open-meteo.com' },
                            { src: 'Historical CGWB Records', detail: 'Multi-year historical MBGL readings used to train ML prediction models.', link: '#' },
                        ].map(d => (
                            <div key={d.src} className="bg-slate-800 rounded-xl p-4">
                                <p className="text-cyan-400 font-semibold mb-1">{d.src}</p>
                                <p className="text-slate-400 text-xs leading-relaxed mb-2">{d.detail}</p>
                                {d.link !== '#' && <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">{d.link}</a>}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div className="mb-12"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-2xl font-bold text-white text-center mb-6">Technology Stack</h2>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {tech.map(t => (
                            <span key={t.name} className={`px-3 py-1.5 ${t.color} border border-white/10 rounded-full text-sm text-white font-medium`}>
                                {t.name}
                                <span className="text-slate-500 text-xs ml-1">· {t.cat}</span>
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div className="text-center"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <p className="text-slate-400 mb-4">Ready to explore India's groundwater data?</p>
                    <Link href="/register"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-cyan-500/25">
                        Get Started Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

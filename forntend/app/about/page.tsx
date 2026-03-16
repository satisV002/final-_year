'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Droplets, Shield, BarChart3, BrainCircuit, CloudRain, MapPin,
    ArrowRight, Database, Globe, Waves, RadioTower
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const improvements = [
    { icon: Droplets, title: 'Rainwater Harvesting', desc: 'Capturing and storing rainwater from rooftops and surfaces to recharge underground aquifers.' },
    { icon: Waves, title: 'Recharge Wells', desc: 'Specialized wells designed to direct surface water directly into deep groundwater layers.' },
    { icon: Shield, title: 'Check Dams', desc: 'Small barriers built across streams to slow down water flow and increase soil infiltration.' },
    { icon: Globe, title: 'Tree Plantation', desc: 'Reforestation helps soil retain moisture and facilitates natural groundwater recharge.' },
    { icon: BarChart3, title: 'Water Conservation', desc: 'Reducing overall demand through efficient usage and recycling of greywater.' },
    { icon: BrainCircuit, title: 'Smart Irrigation', desc: 'Using AI and sensors to deliver precise amounts of water to crops, minimizing waste.' },
    { icon: RadioTower, title: 'DWLR Monitoring', desc: 'Continuous data collection from stations to detect depletion trends early.' },
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

                {/* About Monitoring */}
                <motion.div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/15 rounded-3xl p-8 mb-12"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-2xl font-bold text-white mb-4">Why Groundwater Monitoring Matters</h2>
                    <div className="space-y-4 text-slate-300 leading-relaxed">
                        <p>
                            Groundwater is India&apos;s most critical hidden resource, serving over <span className="text-cyan-400">85% of rural drinking water needs</span> and nearly 60% of irrigated agriculture. Monitoring this resource is essential for national water security.
                        </p>
                        <p>
                            Dedicated DWLR (Digital Water Level Recorder) stations collect continuous data because:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><span className="text-white font-medium">Early Detection:</span> Identifying rapid depletion allows for immediate policy intervention.</li>
                            <li><span className="text-white font-medium">Salinity Mapping:</span> Monitoring prevents the intrusion of saline water into freshwater aquifers.</li>
                            <li><span className="text-white font-medium">Recharge Planning:</span> Data helps pinpoint the best locations for artificial recharge structures.</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Improvement Methods */}
                <div className="mb-14">
                    <motion.h2
                        className="text-3xl font-extrabold text-white text-center mb-10"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    >
                        Groundwater Improvement Methods
                    </motion.h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {improvements.map((g, i) => (
                            <motion.div key={g.title}
                                className="relative overflow-hidden bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                                custom={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true, margin: "-50px" }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500" />
                                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <g.icon className="w-7 h-7 text-cyan-400 drop-shadow-md" />
                                </div>
                                <h3 className="relative text-xl text-white font-bold mb-2 group-hover:text-cyan-300 transition-colors">{g.title}</h3>
                                <p className="relative text-slate-400 text-sm leading-relaxed">{g.desc}</p>
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

                {/* CTA */}

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

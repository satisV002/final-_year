'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Droplets, LayoutDashboard, Map, Database,
    LogOut, Menu, X, Bell, ChevronRight, User,
    RadioTower, BrainCircuit, BarChart3, Home, CloudRain
} from 'lucide-react';

const navItems = [
    { href: '/overview', icon: Home, label: 'Overview', color: 'cyan' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'blue' },
    { href: '/forecast', icon: BrainCircuit, label: 'Forecast (LSTM)', color: 'violet' },
    { href: '/rainfall', icon: CloudRain, label: 'Rainfall', color: 'sky' },
    { href: '/map', icon: Map, label: 'Map View', color: 'emerald' },
    { href: '/stations', icon: RadioTower, label: 'Stations', color: 'teal' },
    { href: '/reports', icon: BarChart3, label: 'Reports', color: 'orange' },
    { href: '/data', icon: Database, label: 'Data Explorer', color: 'purple' },
];

const colorMap: Record<string, { active: string; bg: string; glow: string; dot: string }> = {
    cyan: { active: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10', bg: 'from-cyan-500/20 to-blue-500/10', glow: 'shadow-cyan-500/20', dot: 'bg-cyan-400' },
    blue: { active: 'text-blue-400 border-blue-500/40 bg-blue-500/10', bg: 'from-blue-500/20 to-cyan-500/10', glow: 'shadow-blue-500/20', dot: 'bg-blue-400' },
    violet: { active: 'text-violet-400 border-violet-500/40 bg-violet-500/10', bg: 'from-violet-500/20 to-purple-500/10', glow: 'shadow-violet-500/20', dot: 'bg-violet-400' },
    sky: { active: 'text-sky-400 border-sky-500/40 bg-sky-500/10', bg: 'from-sky-500/20 to-blue-500/10', glow: 'shadow-sky-500/20', dot: 'bg-sky-400' },
    emerald: { active: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', bg: 'from-emerald-500/20 to-teal-500/10', glow: 'shadow-emerald-500/20', dot: 'bg-emerald-400' },
    teal: { active: 'text-teal-400 border-teal-500/40 bg-teal-500/10', bg: 'from-teal-500/20 to-cyan-500/10', glow: 'shadow-teal-500/20', dot: 'bg-teal-400' },
    orange: { active: 'text-orange-400 border-orange-500/40 bg-orange-500/10', bg: 'from-orange-500/20 to-red-500/10', glow: 'shadow-orange-500/20', dot: 'bg-orange-400' },
    purple: { active: 'text-purple-400 border-purple-500/40 bg-purple-500/10', bg: 'from-purple-500/20 to-violet-500/10', glow: 'shadow-purple-500/20', dot: 'bg-purple-400' },
};

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <aside className={`relative flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
            {/* Ambient top glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-1 ring-white/10">
                    <Droplets className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="font-bold text-white text-sm leading-none">AquaWatch</p>
                        <p className="text-slate-500 text-xs mt-0.5">Monitoring System</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-0.5">
                {navItems.map(({ href, icon: Icon, label, color }) => {
                    const active = pathname === href || (href !== '/dashboard' && href !== '/overview' && pathname.startsWith(href));
                    const isOverview = pathname === '/overview' && href === '/overview';
                    const isDashboard = pathname === '/dashboard' && href === '/dashboard';
                    const isActive = active || isOverview || isDashboard;
                    const c = colorMap[color];

                    return (
                        <Link key={href} href={href}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group border ${isActive
                                    ? `${c.active} border shadow-lg ${c.glow}`
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            {/* Active left-stripe */}
                            {isActive && !collapsed && (
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${c.dot}`} />
                            )}
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="text-sm font-medium flex-1">{label}</span>
                                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-80`} />}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="p-2 border-t border-white/5">
                {!collapsed && user && (
                    <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 ring-2 ring-cyan-500/20">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-white truncate">{user.fullname}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button onClick={logout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
                    {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col relative">
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg z-10 hover:border-white/20"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                        <motion.div
                            className="absolute left-0 top-0 h-full"
                            initial={{ x: -240 }}
                            animate={{ x: 0 }}
                            exit={{ x: -240 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex items-center gap-4 px-4 md:px-6 py-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/[0.06]">
                    <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setMobileOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <button className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full ring-2 ring-slate-900" />
                    </button>
                    {user && (
                        <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center ring-2 ring-cyan-500/20">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="hidden md:block text-sm text-slate-300 font-medium">{user.fullname}</span>
                        </div>
                    )}
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

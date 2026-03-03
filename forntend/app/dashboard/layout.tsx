'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Droplets, LayoutDashboard, Map, Database,
    LogOut, Menu, X, Bell, ChevronRight, User,
    RadioTower, BrainCircuit, BarChart3, Home, CloudRain
} from 'lucide-react';

const navItems = [
    { href: '/overview', icon: Home, label: 'Overview' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/forecast', icon: BrainCircuit, label: 'Forecast (LSTM)' },
    { href: '/rainfall', icon: CloudRain, label: 'Rainfall' },
    { href: '/map', icon: Map, label: 'Map View' },
    { href: '/stations', icon: RadioTower, label: 'Stations' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/data', icon: Database, label: 'Data Explorer' },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <aside className={`flex flex-col h-full bg-slate-900 border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
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
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="text-sm font-medium flex-1">{label}</span>
                                    {active && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="p-2 border-t border-white/5">
                {!collapsed && user && (
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.fullname}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button onClick={logout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>

            {/* Toggle */}
            <button onClick={onToggle}
                className="absolute bottom-24 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
                style={{ position: 'absolute' }}
            />
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
                    className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg z-10"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex items-center gap-4 px-4 md:px-6 py-4 bg-slate-900/50 backdrop-blur border-b border-white/5">
                    <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <button className="relative text-slate-400 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full" />
                    </button>
                    {user && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
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

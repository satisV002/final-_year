'use client';

import React from 'react';

/**
 * SearchAnimation Component
 * Displays a professional animation video while station data is being searched or loaded.
 */
const SearchAnimation: React.FC = () => {
    return (
        <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover opacity-80"
            >
                <source src="/videos/search-animation.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

            {/* Loading Text Overlay */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-white font-medium text-sm tracking-wide uppercase">
                    Analyzing Aquifers...
                </span>
            </div>
        </div>
    );
};

export default SearchAnimation;

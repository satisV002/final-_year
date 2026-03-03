'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaterCharacterProps {
    isPasswordFocused: boolean;
    hasError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    mood?: 'idle' | 'welcome';
}

export default function WaterCharacter({
    isPasswordFocused,
    hasError,
    isSuccess,
    isLoading,
    mood = 'idle',
}: WaterCharacterProps) {
    const containerRef = useRef<SVGSVGElement>(null);
    const eyeLeftRef = useRef<SVGCircleElement>(null);
    const eyeRightRef = useRef<SVGCircleElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPasswordFocused || isSuccess) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(5, Math.sqrt(dx * dx + dy * dy) / 20);
        const ox = Math.cos(angle) * dist;
        const oy = Math.sin(angle) * dist;

        [eyeLeftRef, eyeRightRef].forEach(ref => {
            if (ref.current) {
                ref.current.style.transform = `translate(${ox}px, ${oy}px)`;
            }
        });
    }, [isPasswordFocused, isSuccess]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    // Reset eye position when password focused
    useEffect(() => {
        if (isPasswordFocused) {
            [eyeLeftRef, eyeRightRef].forEach(ref => {
                if (ref.current) ref.current.style.transform = 'translate(0,0)';
            });
        }
    }, [isPasswordFocused]);

    // Body animation variants
    const bodyVariants: any = {
        idle: { y: [0, -8, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
        error: {
            x: [-12, 12, -12, 12, -8, 8, -4, 4, 0],
            transition: { duration: 0.6, ease: 'easeInOut' },
        },
        success: { scale: [1, 1.12, 1], transition: { duration: 0.5 } },
        loading: { rotate: [0, 5, -5, 0], transition: { duration: 1, repeat: Infinity } },
    };

    const currentVariant = isSuccess ? 'success' : hasError ? 'error' : isLoading ? 'loading' : 'idle';

    // Color of character
    const faceColor = isSuccess ? '#22c55e' : hasError ? '#ef4444' : '#06b6d4';
    const glowColor = isSuccess ? 'rgba(34,197,94,0.4)' : hasError ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)';

    return (
        <div className="relative flex items-center justify-center w-full h-full select-none">
            {/* Glow */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, width: 240, height: 240 }}
                animate={{ scale: isSuccess ? [1, 1.3, 1] : [1, 1.1, 1], opacity: isSuccess ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3] }}
                transition={{ duration: isSuccess ? 0.8 : 3, repeat: isSuccess ? 0 : Infinity, ease: 'easeInOut' }}
            />

            {/* Character SVG */}
            <motion.svg
                ref={containerRef}
                viewBox="0 0 200 260"
                width={200}
                height={260}
                variants={bodyVariants}
                animate={currentVariant}
                className="relative z-10"
            >
                {/* Drop body */}
                <defs>
                    <radialGradient id="dropGrad" cx="40%" cy="35%" r="60%">
                        <stop offset="0%" stopColor={isSuccess ? '#4ade80' : hasError ? '#f87171' : '#22d3ee'} />
                        <stop offset="100%" stopColor={isSuccess ? '#16a34a' : hasError ? '#dc2626' : '#0369a1'} />
                    </radialGradient>
                    <filter id="dropShadow">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor={faceColor} floodOpacity="0.4" />
                    </filter>
                </defs>

                {/* Body shape — water droplet */}
                <path
                    d="M100 20 C100 20, 160 90, 160 150 C160 195, 134 225, 100 225 C66 225, 40 195, 40 150 C40 90, 100 20, 100 20 Z"
                    fill="url(#dropGrad)"
                    filter="url(#dropShadow)"
                />

                {/* Highlight */}
                <ellipse cx="72" cy="90" rx="14" ry="22" fill="rgba(255,255,255,0.25)" transform="rotate(-20, 72, 90)" />

                {/* Eyes / Eyelids */}
                <g>
                    {/* Left Eye */}
                    <g transform="translate(75, 150)">
                        {!isPasswordFocused ? (
                            <>
                                <circle cx="0" cy="0" r="14" fill="white" />
                                <motion.circle
                                    ref={eyeLeftRef}
                                    cx="0" cy="0" r="8"
                                    fill={hasError ? '#7f1d1d' : '#1e293b'}
                                />
                                <circle cx="3" cy="-3" r="3" fill="white" />
                                {isSuccess && <circle cx="0" cy="0" r="5" fill="#4ade80" opacity="0.8" />}
                            </>
                        ) : (
                            // Closed eye (eyelid)
                            <path d="M-14 0 Q0 10 14 0" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        )}
                    </g>

                    {/* Right Eye */}
                    <g transform="translate(125, 150)">
                        {!isPasswordFocused ? (
                            <>
                                <circle cx="0" cy="0" r="14" fill="white" />
                                <motion.circle
                                    ref={eyeRightRef}
                                    cx="0" cy="0" r="8"
                                    fill={hasError ? '#7f1d1d' : '#1e293b'}
                                />
                                <circle cx="3" cy="-3" r="3" fill="white" />
                                {isSuccess && <circle cx="0" cy="0" r="5" fill="#4ade80" opacity="0.8" />}
                            </>
                        ) : (
                            <path d="M-14 0 Q0 10 14 0" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        )}
                    </g>
                </g>

                {/* Mouth */}
                <g transform="translate(100, 190)">
                    {isSuccess ? (
                        // Big smile
                        <path d="M-20 0 Q0 20 20 0" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    ) : hasError ? (
                        // Frown
                        <path d="M-15 8 Q0 -4 15 8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    ) : isPasswordFocused ? (
                        // Curious/o face
                        <ellipse cx="0" cy="4" rx="8" ry="6" fill="rgba(255,255,255,0.7)" />
                    ) : (
                        // Neutral smile
                        <path d="M-14 2 Q0 14 14 2" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    )}
                </g>

                {/* Error X marks on eyes */}
                {hasError && (
                    <>
                        <text x="65" y="160" fontSize="20" fill="white" fontWeight="bold">✕</text>
                        <text x="115" y="160" fontSize="20" fill="white" fontWeight="bold">✕</text>
                    </>
                )}

                {/* Little water drops floating */}
                <motion.circle cx="30" cy="120" r="5" fill={faceColor} opacity="0.5"
                    animate={{ y: [-8, 0, -8], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.circle cx="170" cy="100" r="4" fill={faceColor} opacity="0.4"
                    animate={{ y: [-6, 0, -6], opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
                />
                <motion.circle cx="155" cy="200" r="3" fill={faceColor} opacity="0.3"
                    animate={{ y: [-5, 0, -5], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                />
            </motion.svg>

            {/* Status label */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={currentVariant}
                    className="absolute bottom-4 text-xs font-medium text-center w-full"
                    style={{ color: faceColor }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                >
                    {isSuccess ? '✓ Welcome aboard!' :
                        hasError ? '⚠ Check your credentials' :
                            isLoading ? '● Verifying...' :
                                isPasswordFocused ? '🙈 I won\'t peek!' :
                                    mood === 'welcome' ? '👋 Hello there!' :
                                        '👀 I\'m watching the form'}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

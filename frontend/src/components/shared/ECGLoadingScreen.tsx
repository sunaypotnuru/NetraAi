import React, { useEffect, useRef, useState } from 'react';

/**
 * ECG Loading Screen
 * Futuristic, minimalist, high-tech loading screen inspired by cardiology monitors.
 * Features: multi-layer ECG wave animation, medical grid overlay, glowing neon green
 * elements on deep obsidian background, particle scanlines, vitals display, pulse ring.
 */

// Generate a realistic ECG path string for an SVG polyline
function generateECGPoints(
    width: number,
    height: number,
    offset: number,
    scale: number,
    cycles: number
): string {
    const midY = height / 2;
    const points: [number, number][] = [];
    const cycleWidth = width / cycles;

    for (let c = 0; c < cycles; c++) {
        const base = c * cycleWidth + offset;

        // Flat baseline (before P)
        points.push([base, midY]);
        // P wave (gentle bump)
        points.push([base + cycleWidth * 0.08, midY - 6 * scale]);
        points.push([base + cycleWidth * 0.14, midY - 12 * scale]);
        points.push([base + cycleWidth * 0.20, midY - 6 * scale]);
        points.push([base + cycleWidth * 0.26, midY]);
        // PR segment (flat)
        points.push([base + cycleWidth * 0.30, midY]);
        // Q dip (small downward)
        points.push([base + cycleWidth * 0.36, midY + 4 * scale]);
        // R spike (sharp upward)
        points.push([base + cycleWidth * 0.40, midY - 48 * scale]);
        // S dip (downward)
        points.push([base + cycleWidth * 0.44, midY + 14 * scale]);
        // ST segment (flat return)
        points.push([base + cycleWidth * 0.50, midY]);
        // T wave (gentle broad bump)
        points.push([base + cycleWidth * 0.56, midY - 5 * scale]);
        points.push([base + cycleWidth * 0.64, midY - 14 * scale]);
        points.push([base + cycleWidth * 0.72, midY - 5 * scale]);
        points.push([base + cycleWidth * 0.78, midY]);
        // U wave (tiny, optional)
        points.push([base + cycleWidth * 0.84, midY - 3 * scale]);
        points.push([base + cycleWidth * 0.88, midY]);
        // Trailing baseline
        points.push([base + cycleWidth, midY]);
    }

    return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

interface ECGWaveProps {
    width: number;
    height: number;
    color: string;
    opacity: number;
    scale: number;
    cycles: number;
    strokeWidth: number;
    speed: number; // seconds per loop
    offset: number;
    blur?: number;
    glow?: boolean;
}

function ECGWave({ width, height, color, opacity, scale, cycles, strokeWidth, speed, offset, blur = 0, glow = false }: ECGWaveProps) {
    const points = generateECGPoints(width, height, offset, scale, cycles);
    const filterId = `glow-${color.replace('#', '')}-${Math.round(scale * 10)}`;

    return (
        <g style={{ opacity }}>
            {glow && (
                <defs>
                    <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={blur + 2} result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            )}
            {/* Duplicate polyline shifted right by one full width for seamless looping */}
            <g filter={glow ? `url(#${filterId})` : undefined}>
                <style>{`
                    @keyframes ecg-scroll-${filterId} {
                        from { transform: translateX(0); }
                        to { transform: translateX(-${width}px); }
                    }
                    .ecg-wave-${filterId} {
                        animation: ecg-scroll-${filterId} ${speed}s linear infinite;
                    }
                `}</style>
                <g className={`ecg-wave-${filterId}`}>
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <polyline
                        points={generateECGPoints(width, height, offset + width, scale, cycles)}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </g>
        </g>
    );
}

// Animating scanning line that sweeps left to right
function ScanLine({ width, height }: { width: number; height: number }) {
    return (
        <>
            <style>{`
                @keyframes scan-sweep {
                    0% { transform: translateX(-40px); opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { transform: translateX(${width + 40}px); opacity: 0; }
                }
                .scan-line-el {
                    animation: scan-sweep 3s ease-in-out infinite;
                }
            `}</style>
            <g className="scan-line-el">
                <defs>
                    <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00ff9f" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00ff9f" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#00ff9f" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <rect x={-40} y={0} width={80} height={height} fill="url(#scanGrad)" />
                <line x1={0} y1={0} x2={0} y2={height} stroke="#00ff9f" strokeWidth={1.5} opacity={0.9} />
            </g>
        </>
    );
}

// Heart rate dot that bounces along the ECG
function HeartPulse({ width, height }: { width: number; height: number }) {
    return (
        <>
            <style>{`
                @keyframes pulse-dot {
                    0% { transform: translate(0px, ${height / 2}px); opacity: 0; }
                    10% { opacity: 1; }
                    /* follow ECG peak roughly at 40% of width */
                    38% { transform: translate(${width * 0.38}px, ${height / 2 + 4}px); }
                    40% { transform: translate(${width * 0.40}px, ${height / 2 - 48}px); }
                    42% { transform: translate(${width * 0.42}px, ${height / 2 - 10}px); }
                    44% { transform: translate(${width * 0.44}px, ${height / 2 + 14}px); }
                    50% { transform: translate(${width * 0.50}px, ${height / 2}px); }
                    90% { opacity: 1; }
                    100% { transform: translate(${width}px, ${height / 2}px); opacity: 0; }
                }
                .pulse-dot-el {
                    animation: pulse-dot 2.2s ease-in-out infinite;
                    transform-origin: 0 0;
                }
                @keyframes pulse-ring {
                    0% { r: 4; opacity: 0.9; }
                    100% { r: 14; opacity: 0; }
                }
                .pulse-ring-el {
                    animation: pulse-ring 0.8s ease-out infinite;
                }
            `}</style>
            <g>
                <defs>
                    <filter id="dotGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <g className="pulse-dot-el" filter="url(#dotGlow)">
                    <circle className="pulse-ring-el" cx={0} cy={0} fill="none" stroke="#00ff9f" strokeWidth={1.5} />
                    <circle cx={0} cy={0} r={5} fill="#00ff9f" />
                </g>
            </g>
        </>
    );
}

// Medical grid background (like ECG graph paper)
function MedicalGrid({ width, height }: { width: number; height: number }) {
    const smallStep = 20;
    const bigStep = 100;
    const lines: JSX.Element[] = [];

    // Small grid lines
    for (let x = 0; x <= width; x += smallStep) {
        lines.push(<line key={`sv${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#00ff9f" strokeWidth={0.3} opacity={0.08} />);
    }
    for (let y = 0; y <= height; y += smallStep) {
        lines.push(<line key={`sh${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#00ff9f" strokeWidth={0.3} opacity={0.08} />);
    }
    // Major grid lines
    for (let x = 0; x <= width; x += bigStep) {
        lines.push(<line key={`bv${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#00ff9f" strokeWidth={0.8} opacity={0.13} />);
    }
    for (let y = 0; y <= height; y += bigStep) {
        lines.push(<line key={`bh${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#00ff9f" strokeWidth={0.8} opacity={0.13} />);
    }

    return <g>{lines}</g>;
}

// Floating vitals display (HR, SpO2, BP)
function VitalsDisplay() {
    const [bpm, setBpm] = useState(72);
    const [spo2, setSpo2] = useState(98);

    useEffect(() => {
        const id = setInterval(() => {
            setBpm(prev => {
                const next = prev + Math.round((Math.random() - 0.5) * 4);
                return Math.max(65, Math.min(85, next));
            });
            setSpo2(prev => {
                const next = prev + Math.round((Math.random() - 0.5) * 1);
                return Math.max(96, Math.min(100, next));
            });
        }, 1200);
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <style>{`
                @keyframes vitals-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .vitals-container {
                    animation: vitals-fade-in 1s ease-out 0.3s both;
                }
                @keyframes blink-colon {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }
                .blink {
                    animation: blink-colon 1s ease-in-out infinite;
                }
                @keyframes counter-update {
                    from { opacity: 0.3; transform: translateY(-3px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .vital-value {
                    animation: counter-update 0.4s ease-out;
                }
            `}</style>
            <div className="vitals-container flex items-center gap-6 mt-6">
                {/* Heart Rate */}
                <div className="flex flex-col items-center gap-1">
                    <span style={{ color: '#4a5568', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Courier New', monospace" }}>HR</span>
                    <div className="flex items-end gap-1">
                        <span key={bpm} className="vital-value" style={{ color: '#00ff9f', fontSize: '2rem', fontWeight: 700, fontFamily: "'Courier New', monospace", lineHeight: 1, textShadow: '0 0 12px rgba(0,255,159,0.7)' }}>{bpm}</span>
                        <span style={{ color: '#4a9068', fontSize: '0.7rem', marginBottom: '3px', fontFamily: "'Courier New', monospace" }}>bpm</span>
                    </div>
                </div>
                {/* Divider */}
                <div style={{ width: 1, height: 40, background: 'rgba(0,255,159,0.15)' }} />
                {/* SpO2 */}
                <div className="flex flex-col items-center gap-1">
                    <span style={{ color: '#4a5568', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Courier New', monospace" }}>SpO₂</span>
                    <div className="flex items-end gap-1">
                        <span key={spo2} className="vital-value" style={{ color: '#00c9ff', fontSize: '2rem', fontWeight: 700, fontFamily: "'Courier New', monospace", lineHeight: 1, textShadow: '0 0 12px rgba(0,201,255,0.7)' }}>{spo2}</span>
                        <span style={{ color: '#3a7a99', fontSize: '0.7rem', marginBottom: '3px', fontFamily: "'Courier New', monospace" }}>%</span>
                    </div>
                </div>
                {/* Divider */}
                <div style={{ width: 1, height: 40, background: 'rgba(0,255,159,0.15)' }} />
                {/* BP */}
                <div className="flex flex-col items-center gap-1">
                    <span style={{ color: '#4a5568', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Courier New', monospace" }}>NIBP</span>
                    <div className="flex items-end gap-1">
                        <span style={{ color: '#ff9f43', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Courier New', monospace", lineHeight: 1, textShadow: '0 0 12px rgba(255,159,67,0.5)' }}>120/80</span>
                        <span style={{ color: '#8a6040', fontSize: '0.7rem', marginBottom: '3px', fontFamily: "'Courier New', monospace" }}>mmHg</span>
                    </div>
                </div>
            </div>
        </>
    );
}

// Pulse Ring that expands and fades on every heartbeat
function PulseRing() {
    return (
        <>
            <style>{`
                @keyframes expand-ring-1 {
                    0% { transform: scale(0.6); opacity: 0.8; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes expand-ring-2 {
                    0% { transform: scale(0.6); opacity: 0.5; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes expand-ring-3 {
                    0% { transform: scale(0.6); opacity: 0.3; }
                    100% { transform: scale(3); opacity: 0; }
                }
                .pulse-ring-1 { animation: expand-ring-1 1.4s ease-out infinite; }
                .pulse-ring-2 { animation: expand-ring-2 1.4s ease-out 0.2s infinite; }
                .pulse-ring-3 { animation: expand-ring-3 1.4s ease-out 0.4s infinite; }
                @keyframes heart-beat-icon {
                    0%, 100% { transform: scale(1); }
                    15% { transform: scale(1.2); }
                    30% { transform: scale(0.95); }
                    45% { transform: scale(1.1); }
                    60% { transform: scale(1); }
                }
                .heart-icon { animation: heart-beat-icon 1.4s ease-in-out infinite; }
            `}</style>
            <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pulse-ring-1" style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0,255,159,0.6)' }} />
                <div className="pulse-ring-2" style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(0,255,159,0.35)' }} />
                <div className="pulse-ring-3" style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(0,255,159,0.2)' }} />
                <div className="heart-icon" style={{ fontSize: 22, lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(0,255,159,0.8))' }}>
                    {/* Heart SVG */}
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="#00ff9f">
                        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                    </svg>
                </div>
            </div>
        </>
    );
}

// Progress bar strip that slowly fills
function ProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let p = 0;
        const id = setInterval(() => {
            p += Math.random() * 3;
            if (p >= 100) p = 0; // loop for indefinite loading
            setProgress(p);
        }, 80);
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <style>{`
                .progress-track {
                    width: 280px;
                    height: 3px;
                    background: rgba(0,255,159,0.1);
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 999px;
                    background: linear-gradient(90deg, #00c37a, #00ff9f, #7affcf);
                    box-shadow: 0 0 10px rgba(0,255,159,0.8), 0 0 20px rgba(0,255,159,0.4);
                    transition: width 0.1s linear;
                }
                .progress-shimmer {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
                    animation: shimmer 1.5s linear infinite;
                }
                @keyframes shimmer {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
            `}</style>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
                <div className="progress-shimmer" />
            </div>
        </>
    );
}

// Main ECG loading screen component
export function ECGLoadingScreen() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ width: 800, height: 200 });
    const [dots, setDots] = useState('');

    // Measure container width to make ECG fill screen
    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                setDims({
                    width: containerRef.current.offsetWidth,
                    height: 200,
                });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // Animated "..." status dots
    useEffect(() => {
        let count = 0;
        const id = setInterval(() => {
            count = (count + 1) % 4;
            setDots('.'.repeat(count));
        }, 400);
        return () => clearInterval(id);
    }, []);

    const { width, height } = dims;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Share+Tech+Mono&display=swap');

                .ecg-screen * { box-sizing: border-box; }

                @keyframes screen-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .ecg-screen {
                    animation: screen-fade-in 0.6s ease-out both;
                }

                @keyframes logo-glow-pulse {
                    0%, 100% { text-shadow: 0 0 20px rgba(0,255,159,0.5), 0 0 40px rgba(0,255,159,0.2); }
                    50% { text-shadow: 0 0 30px rgba(0,255,159,0.9), 0 0 60px rgba(0,255,159,0.5), 0 0 80px rgba(0,255,159,0.2); }
                }
                .logo-text {
                    animation: logo-glow-pulse 2s ease-in-out infinite;
                }

                @keyframes status-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                .status-dot {
                    animation: status-blink 1s ease-in-out infinite;
                }

                @keyframes corner-flash {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.9; }
                }
                .corner-el { animation: corner-flash 2s ease-in-out infinite; }

                @keyframes float-particle {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.4; }
                    100% { transform: translateY(-120px) translateX(30px); opacity: 0; }
                }

                @keyframes grid-fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .grid-svg { animation: grid-fade 1.5s ease-out 0.2s both; }
                .ecg-svg { animation: grid-fade 0.8s ease-out 0.5s both; }

                @keyframes tag-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .tag-in { animation: tag-in 0.8s ease-out 1s both; }
            `}</style>

            <div
                ref={containerRef}
                className="ecg-screen"
                style={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(ellipse at 50% 50%, #0a0f0a 0%, #050808 50%, #020404 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: "'Inter', 'Share Tech Mono', sans-serif",
                }}
            >
                {/* ─── Medical Grid Background ─── */}
                <svg
                    className="grid-svg"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                    preserveAspectRatio="xMidYMid slice"
                >
                    <MedicalGrid width={2000} height={1200} />
                    {/* Radial vignette overlay */}
                    <defs>
                        <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="#050808" stopOpacity={0} />
                            <stop offset="100%" stopColor="#050808" stopOpacity={0.92} />
                        </radialGradient>
                    </defs>
                    <rect x={0} y={0} width={2000} height={1200} fill="url(#vignetteGrad)" />
                </svg>

                {/* ─── Corner Decorations ─── */}
                <svg className="corner-el" style={{ position: 'absolute', top: 16, left: 16, width: 60, height: 60, pointerEvents: 'none' }}>
                    <polyline points="0,30 0,0 30,0" fill="none" stroke="#00ff9f" strokeWidth={2} opacity={0.6} />
                </svg>
                <svg className="corner-el" style={{ position: 'absolute', top: 16, right: 16, width: 60, height: 60, pointerEvents: 'none' }}>
                    <polyline points="60,30 60,0 30,0" fill="none" stroke="#00ff9f" strokeWidth={2} opacity={0.6} />
                </svg>
                <svg className="corner-el" style={{ position: 'absolute', bottom: 16, left: 16, width: 60, height: 60, pointerEvents: 'none' }}>
                    <polyline points="0,30 0,60 30,60" fill="none" stroke="#00ff9f" strokeWidth={2} opacity={0.6} />
                </svg>
                <svg className="corner-el" style={{ position: 'absolute', bottom: 16, right: 16, width: 60, height: 60, pointerEvents: 'none' }}>
                    <polyline points="60,30 60,60 30,60" fill="none" stroke="#00ff9f" strokeWidth={2} opacity={0.6} />
                </svg>

                {/* ─── Top Status Bar ─── */}
                <div className="tag-in" style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="status-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 6px rgba(0,255,159,0.9)', display: 'inline-block' }} />
                    <span style={{ color: 'rgba(0,255,159,0.65)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono', monospace" }}>
                        NETRA AI MEDICAL SYSTEMS — LIVE
                    </span>
                    <span className="status-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 6px rgba(0,255,159,0.9)', display: 'inline-block' }} />
                </div>

                {/* ─── Main Content ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 10, width: '100%', maxWidth: 900, padding: '0 24px' }}>

                    {/* Logo + Pulse Ring */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 4 }}>
                        <PulseRing />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <h1
                                className="logo-text"
                                style={{
                                    color: '#00ff9f',
                                    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    margin: 0,
                                    lineHeight: 1,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                NETRA AI
                            </h1>
                            <span style={{
                                color: 'rgba(0,255,159,0.45)',
                                fontSize: '0.65rem',
                                letterSpacing: '0.35em',
                                textTransform: 'uppercase',
                                fontFamily: "'Share Tech Mono', monospace",
                                marginTop: 4,
                            }}>
                                INTELLIGENT HEALTH PLATFORM
                            </span>
                        </div>
                    </div>

                    {/* ─── ECG Wave Strip ─── */}
                    <div className="ecg-svg" style={{ width: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                        {/* Background glow on ECG container */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,255,159,0.05) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <svg
                            width="100%"
                            height={height}
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ display: 'block' }}
                        >
                            {/* Layer 0: very faint wide wave (background depth) */}
                            <ECGWave width={width} height={height} color="#00ff9f" opacity={0.06} scale={1.2} cycles={3} strokeWidth={6} speed={5} offset={0} blur={8} />
                            {/* Layer 1: medium faint wave */}
                            <ECGWave width={width} height={height} color="#00c37a" opacity={0.15} scale={0.85} cycles={4} strokeWidth={2.5} speed={4} offset={20} blur={4} />
                            {/* Layer 2: crisp main wave */}
                            <ECGWave width={width} height={height} color="#00ff9f" opacity={0.9} scale={1.0} cycles={3} strokeWidth={2} speed={3} offset={0} glow blur={3} />
                            {/* Layer 3: offset duplicate (slightly different timing) */}
                            <ECGWave width={width} height={height} color="#7affcf" opacity={0.25} scale={0.7} cycles={5} strokeWidth={1} speed={2.5} offset={40} />
                            {/* Scan line sweep */}
                            <ScanLine width={width} height={height} />
                            {/* Moving heartbeat dot */}
                            <HeartPulse width={width} height={height} />
                            {/* Horizontal midline reference */}
                            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#00ff9f" strokeWidth={0.5} opacity={0.1} strokeDasharray="4 8" />
                        </svg>
                    </div>

                    {/* ─── Vitals Row ─── */}
                    <VitalsDisplay />

                    {/* ─── Progress + Status ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <ProgressBar />
                        <span style={{
                            color: 'rgba(0,255,159,0.5)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontFamily: "'Share Tech Mono', monospace",
                            minWidth: 180,
                            textAlign: 'center',
                        }}>
                            Initializing Systems{dots}
                        </span>
                    </div>
                </div>

                {/* ─── Bottom Footer ─── */}
                <div className="tag-in" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 20 }}>
                    {['ECG', 'ML', 'AI', 'SECURE'].map((tag) => (
                        <span key={tag} style={{
                            color: 'rgba(0,255,159,0.3)',
                            fontSize: '0.55rem',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            fontFamily: "'Share Tech Mono', monospace",
                            padding: '2px 8px',
                            border: '1px solid rgba(0,255,159,0.15)',
                            borderRadius: 3,
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
}

export default ECGLoadingScreen;

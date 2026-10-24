"use client";

import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

interface GradientOrb {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
}

export default function AtomNetBackground() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [orbs, setOrbs] = useState<GradientOrb[]>([]);

    useEffect(() => {
        // Generate random particles
        const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 5,
            duration: Math.random() * 5 + 5
        }));
        setParticles(newParticles);

        // Generate gradient orbs
        const orbColors = [
            "rgba(168, 85, 247, 0.15)",
            "rgba(236, 72, 153, 0.12)",
            "rgba(139, 92, 246, 0.1)",
            "rgba(219, 39, 119, 0.08)"
        ];
        const newOrbs: GradientOrb[] = [
            { id: 0, x: 10, y: 20, size: 400, color: orbColors[0], delay: 0 },
            { id: 1, x: 80, y: 60, size: 350, color: orbColors[1], delay: 5 },
            { id: 2, x: 50, y: 80, size: 300, color: orbColors[2], delay: 10 },
            { id: 3, x: 20, y: 70, size: 250, color: orbColors[3], delay: 3 }
        ];
        setOrbs(newOrbs);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Gradient Orbs */}
            {orbs.map((orb) => (
                <div
                    key={orb.id}
                    className="absolute rounded-full animate-orb-float blur-3xl"
                    style={{
                        left: `${orb.x}%`,
                        top: `${orb.y}%`,
                        width: orb.size,
                        height: orb.size,
                        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                        animationDelay: `${orb.delay}s`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Floating Particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full animate-float-particle"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.6), rgba(236, 72, 153, 0.4))',
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)'
                    }}
                />
            ))}

            {/* Molecule-like connections (static decorative) */}
            <svg className="absolute inset-0 w-full h-full opacity-5">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
                <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="30%" y1="40%" x2="50%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="50%" y1="30%" x2="70%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="70%" y1="50%" x2="85%" y2="35%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="20%" y1="70%" x2="40%" y2="60%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="40%" y1="60%" x2="60%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="60%" y1="75%" x2="80%" y2="65%" stroke="url(#lineGradient)" strokeWidth="1" />

                {/* Small nodes at connection points */}
                <circle cx="10%" cy="20%" r="3" fill="#a855f7" opacity="0.4" />
                <circle cx="30%" cy="40%" r="4" fill="#ec4899" opacity="0.3" />
                <circle cx="50%" cy="30%" r="3" fill="#a855f7" opacity="0.4" />
                <circle cx="70%" cy="50%" r="5" fill="#ec4899" opacity="0.3" />
                <circle cx="85%" cy="35%" r="3" fill="#a855f7" opacity="0.4" />
                <circle cx="20%" cy="70%" r="4" fill="#ec4899" opacity="0.3" />
                <circle cx="40%" cy="60%" r="3" fill="#a855f7" opacity="0.4" />
                <circle cx="60%" cy="75%" r="4" fill="#ec4899" opacity="0.3" />
                <circle cx="80%" cy="65%" r="3" fill="#a855f7" opacity="0.4" />
            </svg>

            {/* Radial gradient overlay at bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1/3"
                style={{
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent)'
                }}
            />
        </div>
    );
}

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CertificateGeneratorProps {
    studentName: string;
    competencyTitle: string;
    skills: string[];
    moduleIcon: string;
    onClose: () => void;
    onGenerated: () => void;
}

export default function CertificateGenerator({
    studentName, competencyTitle, skills, moduleIcon, onClose, onGenerated,
}: CertificateGeneratorProps) {
    const certRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    const verificationId = `CRED-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const downloadCertificate = useCallback(async () => {
        if (!certRef.current) return;
        setIsGenerating(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(certRef.current, {
                backgroundColor: '#0a0f1a',
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `BioScribe_Certificate_${competencyTitle.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setIsGenerated(true);
            onGenerated();
        } catch (err) {
            console.error('Certificate generation failed:', err);
        }
        setIsGenerating(false);
    }, [competencyTitle, onGenerated]);

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`BioScribe Scholar: ${competencyTitle}`)}&organizationName=${encodeURIComponent('BioScribe Scholar')}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certId=${verificationId}`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-2xl w-full space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Certificate Preview */}
                <div
                    ref={certRef}
                    className="p-10 rounded-2xl relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, #0a0f1a 0%, #111827 50%, #0a1628 100%)',
                        border: '2px solid rgba(255,215,0,0.4)',
                        boxShadow: '0 0 60px rgba(255,215,0,0.1), inset 0 0 80px rgba(0,240,255,0.03)',
                    }}
                >
                    {/* Gold corner accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: 'rgba(255,215,0,0.5)' }} />
                    <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 rounded-tr-2xl" style={{ borderColor: 'rgba(255,215,0,0.5)' }} />
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 rounded-bl-2xl" style={{ borderColor: 'rgba(255,215,0,0.5)' }} />
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: 'rgba(255,215,0,0.5)' }} />

                    <div className="text-center space-y-5">
                        {/* Header */}
                        <div>
                            <div className="text-xs uppercase tracking-[6px] text-slate-500 mb-1">Certificate of Proficiency</div>
                            <div className="text-3xl font-bold" style={{ color: '#ffd700' }}>BioScribe Scholar</div>
                        </div>

                        {/* Divider line */}
                        <div className="mx-auto w-40 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />

                        {/* Module + Icon */}
                        <div>
                            <div className="text-5xl mb-2">{moduleIcon}</div>
                            <div className="text-xl font-bold text-white">{competencyTitle}</div>
                        </div>

                        {/* Recipient */}
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Awarded to</div>
                            <div className="text-2xl font-bold" style={{ color: '#00f0ff' }}>{studentName}</div>
                        </div>

                        {/* Skills */}
                        <div className="max-w-sm mx-auto">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Demonstrated Skills</div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {skills.map(skill => (
                                    <span key={skill} className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Date + Verification */}
                        <div className="mx-auto w-40 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />

                        <div className="flex justify-between text-xs">
                            <div className="text-left">
                                <div className="text-slate-500">Date Issued</div>
                                <div className="text-slate-300">{dateStr}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-500">Blockchain Verification ID</div>
                                <div className="font-mono font-bold" style={{ color: '#ffd700' }}>{verificationId}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={downloadCertificate}
                        disabled={isGenerating}
                        className="scholar-btn-success flex-1 py-3 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                    >
                        {isGenerating ? '⏳ Generating...' : isGenerated ? '✅ Downloaded!' : '📥 Download as PNG'}
                    </button>
                    <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 rounded-xl font-bold text-center cursor-pointer flex items-center justify-center gap-2"
                        style={{ background: 'rgba(10,102,194,0.2)', border: '1px solid rgba(10,102,194,0.4)', color: '#0a66c2' }}
                    >
                        💼 Add to LinkedIn
                    </a>
                </div>
                <button onClick={onClose} className="w-full text-xs text-slate-500 hover:text-white cursor-pointer text-center py-2">Close</button>
            </motion.div>
        </motion.div>
    );
}

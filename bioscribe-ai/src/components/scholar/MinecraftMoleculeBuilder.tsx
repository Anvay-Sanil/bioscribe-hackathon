'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';
import { useCrowdsourcedCuresStore } from '@/stores/CrowdsourcedCuresStore';
import DiscoverySubmission from './DiscoverySubmission';

// ─── Atom Types ──────────────────────────────────────────────────────
interface AtomType {
    symbol: string;
    name: string;
    color: string;
    glow: string;
    valence: number;
}

const ATOM_TYPES: AtomType[] = [
    { symbol: 'C', name: 'Carbon', color: '#333333', glow: 'rgba(100,100,100,0.5)', valence: 4 },
    { symbol: 'O', name: 'Oxygen', color: '#dc2626', glow: 'rgba(220,38,38,0.5)', valence: 2 },
    { symbol: 'N', name: 'Nitrogen', color: '#2563eb', glow: 'rgba(37,99,235,0.5)', valence: 3 },
    { symbol: 'H', name: 'Hydrogen', color: '#e5e7eb', glow: 'rgba(229,231,235,0.3)', valence: 1 },
    { symbol: 'S', name: 'Sulfur', color: '#eab308', glow: 'rgba(234,179,8,0.5)', valence: 2 },
    { symbol: 'F', name: 'Fluorine', color: '#22c55e', glow: 'rgba(34,197,94,0.5)', valence: 1 },
];

interface PlacedAtom {
    x: number;
    y: number;
    atom: AtomType;
}

const GRID_SIZE = 10;

export default function MinecraftMoleculeBuilder() {
    const [selectedAtom, setSelectedAtom] = useState<AtomType>(ATOM_TYPES[0]);
    const [placedAtoms, setPlacedAtoms] = useState<PlacedAtom[]>([]);
    const [eraseMode, setEraseMode] = useState(false);
    const [showDiscovery, setShowDiscovery] = useState(false);

    const { awardXP, unlockBadge, incrementMoleculesBuilt } = useGamificationStore();
    const { addDiscovery } = useCrowdsourcedCuresStore();

    // ─── Molecular Properties Calculation ──────────────────────────
    const properties = useMemo(() => {
        const atomCounts: Record<string, number> = {};
        placedAtoms.forEach((p) => {
            atomCounts[p.atom.symbol] = (atomCounts[p.atom.symbol] || 0) + 1;
        });

        const totalAtoms = placedAtoms.length;
        const mw = (atomCounts['C'] || 0) * 12.01 + (atomCounts['H'] || 0) * 1.008 +
            (atomCounts['O'] || 0) * 16.00 + (atomCounts['N'] || 0) * 14.01 +
            (atomCounts['S'] || 0) * 32.06 + (atomCounts['F'] || 0) * 19.00;

        // Lipinski Rule of 5 checks
        const hbd = (atomCounts['O'] || 0) + (atomCounts['N'] || 0); // simplified
        const hba = (atomCounts['O'] || 0) + (atomCounts['N'] || 0) + (atomCounts['F'] || 0);
        const logP = ((atomCounts['C'] || 0) * 0.5 - (atomCounts['O'] || 0) * 1.2 - (atomCounts['N'] || 0) * 0.8 + (atomCounts['S'] || 0) * 0.3).toFixed(1);

        const lipinski = {
            mw: mw <= 500,
            logP: parseFloat(logP) <= 5,
            hbd: hbd <= 5,
            hba: hba <= 10,
        };
        const lipinskiViolations = Object.values(lipinski).filter((v) => !v).length;

        const formula = Object.entries(atomCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([sym, count]) => `${sym}${count > 1 ? count : ''}`)
            .join('');

        return { atomCounts, totalAtoms, mw: mw.toFixed(1), hbd, hba, logP, lipinski, lipinskiViolations, formula };
    }, [placedAtoms]);

    const handleCellClick = (x: number, y: number) => {
        const existing = placedAtoms.findIndex((a) => a.x === x && a.y === y);
        if (eraseMode) {
            if (existing >= 0) {
                setPlacedAtoms((prev) => prev.filter((_, i) => i !== existing));
            }
        } else {
            if (existing >= 0) {
                setPlacedAtoms((prev) => prev.filter((_, i) => i !== existing));
            } else {
                setPlacedAtoms((prev) => [...prev, { x, y, atom: selectedAtom }]);
            }
        }
    };

    const checkMolecule = () => {
        if (placedAtoms.length < 3) return;
        const xpAmount = properties.lipinskiViolations === 0 ? 30 : 10;
        awardXP(xpAmount, `Built molecule: ${properties.formula}`, 'Molecule Builder');
        incrementMoleculesBuilt();
        if (properties.lipinskiViolations === 0) {
            unlockBadge('safe_designer');
        }

        // ─── Crowdsourced Cures Detection ─────────────────────────
        // Breakthrough = ALL Lipinski pass + ≥5 atoms + mixed types
        const uniqueTypes = new Set(placedAtoms.map(a => a.atom.symbol));
        if (properties.lipinskiViolations === 0 && placedAtoms.length >= 5 && uniqueTypes.size >= 2) {
            setShowDiscovery(true);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">🧱 Molecule</span>{' '}
                        <span className="neon-text-cyan">Builder</span>
                    </h1>
                    <p className="text-slate-400">Click cells to place atoms. Build drug-like molecules.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Atom Palette + Controls */}
                    <div className="space-y-4">
                        <div className="scholar-card p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Atom Palette</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {ATOM_TYPES.map((atom) => (
                                    <button
                                        key={atom.symbol}
                                        onClick={() => { setSelectedAtom(atom); setEraseMode(false); }}
                                        className="p-3 rounded-xl text-center transition-all cursor-pointer"
                                        style={{
                                            background: selectedAtom.symbol === atom.symbol && !eraseMode
                                                ? `${atom.color}30` : 'rgba(255,255,255,0.03)',
                                            border: selectedAtom.symbol === atom.symbol && !eraseMode
                                                ? `2px solid ${atom.color}` : '2px solid rgba(255,255,255,0.08)',
                                            boxShadow: selectedAtom.symbol === atom.symbol && !eraseMode
                                                ? `0 0 15px ${atom.glow}` : 'none',
                                        }}
                                    >
                                        <div className="text-xl font-bold" style={{ color: atom.color === '#333333' ? '#aaa' : atom.color }}>
                                            {atom.symbol}
                                        </div>
                                        <div className="text-[10px] text-slate-500">{atom.name}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => setEraseMode(!eraseMode)} className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${eraseMode ? 'scholar-btn-danger' : 'scholar-btn'}`}>
                                    🗑️ {eraseMode ? 'ERASING' : 'Erase'}
                                </button>
                                <button onClick={() => setPlacedAtoms([])} className="flex-1 scholar-btn py-2 rounded-lg text-xs font-bold cursor-pointer">
                                    🔄 Clear
                                </button>
                            </div>
                        </div>

                        {/* Properties Panel */}
                        <div className="scholar-card p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">📊 Properties</h3>
                            {placedAtoms.length === 0 ? (
                                <p className="text-xs text-slate-500">Place atoms to see live properties</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-sm neon-text-cyan font-mono">{properties.formula || '—'}</div>

                                    <div className="space-y-2">
                                        {[
                                            { label: 'MW', value: `${properties.mw} Da`, pass: properties.lipinski.mw, rule: '≤ 500' },
                                            { label: 'LogP', value: properties.logP, pass: properties.lipinski.logP, rule: '≤ 5' },
                                            { label: 'HBD', value: properties.hbd, pass: properties.lipinski.hbd, rule: '≤ 5' },
                                            { label: 'HBA', value: properties.hba, pass: properties.lipinski.hba, rule: '≤ 10' },
                                        ].map((r) => (
                                            <div key={r.label} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">{r.label} ({r.rule})</span>
                                                <span className={`font-bold ${r.pass ? 'neon-text-green' : 'neon-text-red'}`}>
                                                    {r.pass ? '✅' : '❌'} {String(r.value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Stability Meter */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Drug-likeness</span>
                                            <span className={`font-bold ${properties.lipinskiViolations === 0 ? 'neon-text-green' : properties.lipinskiViolations <= 1 ? 'neon-text-gold' : 'neon-text-red'}`}>
                                                {4 - properties.lipinskiViolations}/4
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <motion.div
                                                animate={{ width: `${((4 - properties.lipinskiViolations) / 4) * 100}%` }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: properties.lipinskiViolations === 0
                                                        ? 'linear-gradient(90deg, #00ff88, #00f0ff)'
                                                        : properties.lipinskiViolations <= 1
                                                            ? 'linear-gradient(90deg, #ffd700, #f59e0b)'
                                                            : 'linear-gradient(90deg, #ff3355, #ef4444)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button onClick={checkMolecule} disabled={placedAtoms.length < 3}
                                        className="scholar-btn-success w-full py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-30">
                                        ⚡ Analyze Molecule
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voxel Grid */}
                    <div className="lg:col-span-2">
                        <div className="scholar-card p-4">
                            <div className="grid gap-1" style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                aspectRatio: '1/1',
                            }}>
                                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                                    const x = idx % GRID_SIZE;
                                    const y = Math.floor(idx / GRID_SIZE);
                                    const placed = placedAtoms.find((a) => a.x === x && a.y === y);

                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={{ scale: 1.15, zIndex: 10 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleCellClick(x, y)}
                                            className="aspect-square rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold"
                                            style={{
                                                background: placed ? `${placed.atom.color}40` : 'rgba(255,255,255,0.02)',
                                                border: placed ? `2px solid ${placed.atom.color}` : '1px solid rgba(255,255,255,0.04)',
                                                boxShadow: placed ? `0 0 12px ${placed.atom.glow}` : 'none',
                                                color: placed ? (placed.atom.color === '#333333' ? '#aaa' : placed.atom.color) : 'transparent',
                                            }}
                                        >
                                            {placed?.atom.symbol}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crowdsourced Cures Discovery Modal */}
            {showDiscovery && (
                <DiscoverySubmission
                    formula={properties.formula}
                    molecularWeight={parseFloat(properties.mw)}
                    logP={parseFloat(properties.logP)}
                    hbd={properties.hbd}
                    hba={properties.hba}
                    atomCount={properties.totalAtoms}
                    onClose={() => setShowDiscovery(false)}
                    onSubmit={() => {
                        addDiscovery({
                            formula: properties.formula,
                            molecularWeight: parseFloat(properties.mw),
                            logP: parseFloat(properties.logP),
                            hbd: properties.hbd,
                            hba: properties.hba,
                            atomCount: properties.totalAtoms,
                            designerName: 'Scholar_You',
                        });
                        awardXP(50, 'Novel compound submitted!', 'Crowdsourced Cures');
                        unlockBadge('citizen_scientist');
                    }}
                />
            )}
        </div>
    );
}

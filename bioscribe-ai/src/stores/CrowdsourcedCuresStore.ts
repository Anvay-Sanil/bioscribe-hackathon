'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────
export interface Discovery {
    id: string;
    formula: string;
    molecularWeight: number;
    logP: number;
    hbd: number;
    hba: number;
    atomCount: number;
    designerName: string;
    timestamp: number;
    bindingAffinity: number; // mock — random negative kcal/mol
    status: 'submitted' | 'analyzing' | 'promising' | 'archived';
}

interface CrowdsourcedCuresState {
    discoveries: Discovery[];
    totalDiscoveries: number;
    addDiscovery: (d: Omit<Discovery, 'id' | 'timestamp' | 'bindingAffinity' | 'status'>) => Discovery;
    getRecentDiscoveries: () => Discovery[];
}

// ─── Pre-Seeded Fake Discoveries ─────────────────────────────────────
const FAKE_USERS = [
    'Scholar_Delhi_04', 'Scholar_Mumbai_11', 'PharmD_Berlin_07', 'Scholar_Tokyo_22',
    'ChemEng_London_15', 'Scholar_NYC_09', 'PharmD_Seoul_31', 'Scholar_Lagos_08',
    'MedSci_Sydney_12', 'Scholar_Nairobi_03', 'ChemEng_Toronto_19', 'Scholar_Cairo_06',
    'Scholar_Dubai_14', 'PharmD_SP_21', 'Scholar_Paris_17', 'PharmD_Chicago_28',
];

const FORMULAS = [
    'C₁₅H₁₁ClN₂O₂', 'C₂₁H₂₃NO₅', 'C₁₈H₁₉FN₂O₃', 'C₁₂H₁₅NO₃S',
    'C₂₀H₂₅ClN₄O₂', 'C₁₆H₁₃BrN₂O', 'C₁₉H₂₁FClNO₃', 'C₁₄H₁₆N₂O₄S',
    'C₂₂H₂₆N₃O₄', 'C₁₇H₁₈F₂N₂O₂', 'C₁₃H₁₂ClNO₃', 'C₂₃H₂₉N₄O₃',
    'C₁₁H₁₄BrNO₂', 'C₂₀H₂₂FN₃O₂S', 'C₁₆H₁₅ClN₂O₃', 'C₁₈H₂₀N₂O₅',
];

function generateFakeDiscoveries(): Discovery[] {
    const now = Date.now();
    return Array.from({ length: 50 }, (_, i) => ({
        id: `seed-${i}`,
        formula: FORMULAS[i % FORMULAS.length],
        molecularWeight: 200 + Math.floor(Math.random() * 280),
        logP: Math.round((0.5 + Math.random() * 4) * 10) / 10,
        hbd: Math.floor(Math.random() * 5),
        hba: Math.floor(Math.random() * 9) + 1,
        atomCount: 5 + Math.floor(Math.random() * 20),
        designerName: FAKE_USERS[i % FAKE_USERS.length],
        // Stagger timestamps to look "recent"
        timestamp: now - (i * 47000) - Math.floor(Math.random() * 60000),
        bindingAffinity: -(5 + Math.round(Math.random() * 6 * 10) / 10),
        status: (['submitted', 'analyzing', 'promising', 'archived'] as const)[Math.floor(Math.random() * 4)],
    }));
}

// ─── Store ───────────────────────────────────────────────────────────
export const useCrowdsourcedCuresStore = create<CrowdsourcedCuresState>()(
    persist(
        (set, get) => ({
            discoveries: generateFakeDiscoveries(),
            totalDiscoveries: 50,

            addDiscovery: (d) => {
                const newDiscovery: Discovery = {
                    ...d,
                    id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    timestamp: Date.now(),
                    bindingAffinity: -(6 + Math.round(Math.random() * 5 * 10) / 10),
                    status: 'submitted',
                };
                set((state) => ({
                    discoveries: [newDiscovery, ...state.discoveries],
                    totalDiscoveries: state.totalDiscoveries + 1,
                }));
                return newDiscovery;
            },

            getRecentDiscoveries: () => {
                return get().discoveries.slice(0, 10);
            },
        }),
        {
            name: 'bioscribe-crowdsourced-cures',
        }
    )
);

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Dna,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
    label: string;
    href: string;
    description?: string;
}

interface NavItem {
    label: string;
    href?: string;
    dropdown?: DropdownItem[];
}

export function MainNavigation() {
    const pathname = usePathname();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems: NavItem[] = [
        {
            label: 'Pipeline',
            dropdown: [
                { label: 'Start New Discovery', href: '/pipeline/new', description: 'Complete analysis workflow' },
                { label: 'My Projects', href: '/dashboard', description: 'Recent campaigns' }
            ]
        },
        {
            label: 'Advanced',
            dropdown: [
                { label: 'De Novo Designer', href: '/design', description: 'Generate molecules' },
                { label: 'High-Throughput Screening', href: '/screen', description: 'Screen at scale' },
                { label: 'ADMET Analysis', href: '/admet', description: 'Drug-likeness' }
            ]
        },
        {
            label: 'Enterprise',
            dropdown: [
                { label: 'AI Target Discovery', href: '/enterprise/target-discovery', description: 'Novel target identification' },
                { label: 'Novel Molecule Generation', href: '/enterprise/novel-molecules', description: 'RL-based compound design' },
                { label: 'Drug Combinations', href: '/enterprise/drug-combinations', description: 'Synergy prediction' },
                { label: 'Patient Stratification', href: '/enterprise/patient-stratification', description: 'Biomarker analysis' },
                { label: 'Clinical Trial Design', href: '/enterprise/clinical-trials', description: 'Trial optimization' },
                { label: 'MD Simulation', href: '/enterprise/md-simulation', description: 'Molecular dynamics' },
                { label: 'RNA Aptamers', href: '/enterprise/rna-aptamers', description: 'Aptamer design' },
                { label: 'CRISPR Design', href: '/enterprise/crispr-design', description: 'Guide RNA design' },
                { label: 'mRNA Therapeutics', href: '/enterprise/mrna-therapeutics', description: 'mRNA optimization' }
            ]
        },
        {
            label: 'External Engines',
            dropdown: [
                { label: 'AtomNet Mode', href: '/atomnet', description: 'Atomwise integration' }
            ]
        }
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50" >
            <div className="max-w-6xl mx-auto px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-xl group-hover:shadow-violet-500/40 transition-all duration-400">
                            <Dna className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-light bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            BioScribe
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className="relative"
                                onMouseEnter={() => setActiveDropdown(item.label)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    className={`px-5 py-2.5 rounded-xl flex items-center gap-1.5 font-light transition-all duration-300 ${activeDropdown === item.label
                                        ? 'bg-violet-50 text-violet-600'
                                        : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
                                        }`}
                                >
                                    {item.label}
                                    {item.dropdown && <ChevronDown className="w-4 h-4" />}
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {item.dropdown && activeDropdown === item.label && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="absolute top-full left-0 mt-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100/50 overflow-hidden"
                                        >
                                            {item.dropdown.map((dropdownItem, idx) => (
                                                <Link
                                                    key={dropdownItem.href}
                                                    href={dropdownItem.href}
                                                    className="block px-6 py-4 hover:bg-violet-50/50 transition-all duration-300 border-b border-slate-100/50 last:border-0"
                                                >
                                                    <div className="font-normal text-slate-900 mb-0.5">{dropdownItem.label}</div>
                                                    {dropdownItem.description && (
                                                        <div className="text-sm font-light text-slate-500">{dropdownItem.description}</div>
                                                    )}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <button className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-xl transition-all duration-300 font-light">
                            Help
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-normal shadow-lg shadow-violet-500/30">
                            SC
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="md:hidden py-6 border-t border-slate-100/50"
                        >
                            {navItems.map((item) => (
                                <div key={item.label} className="mb-6">
                                    <div className="font-normal text-slate-900 px-4 mb-3">{item.label}</div>
                                    {item.dropdown?.map((dropdownItem) => (
                                        <Link
                                            key={dropdownItem.href}
                                            href={dropdownItem.href}
                                            className="block px-6 py-3 text-sm font-light text-slate-600 hover:bg-violet-50/50 transition-all duration-300"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {dropdownItem.label}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav >
    );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    const navRef = useRef<HTMLElement>(null);
    const enabledRoutes = new Set(['/pipeline/new', '/dashboard', '/molecules', '/evidence', '/evidence-assistant', '/proof', '/hackathon-learning/index.html']);
    const closeMenus = () => { setActiveDropdown(null); setMobileMenuOpen(false); };
    useEffect(() => {
        function closeOutside(event: PointerEvent) {
            if (!navRef.current?.contains(event.target as Node)) { setActiveDropdown(null); setMobileMenuOpen(false); }
        }
        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, []);

    const navItems: NavItem[] = [
        {label: 'Workbench', dropdown: [
            {label: 'Evidence Lab', href: '/evidence', description: 'Validate, compare and replay molecules'},
            {label: 'Evidence Assistant', href: '/evidence-assistant', description: 'Check molecular claims against cited records'},
            {label: 'Molecular Explorer', href: '/molecules', description: '3D conformers and calculated descriptors'},
            {label: 'Sequence Analysis', href: '/pipeline/new', description: 'Supported sequence and molecular inputs'}
        ]},
        {label: 'Demonstration', dropdown: [
            {label: 'Why BioScribe?', href: '/proof', description: 'Worked comparison and three-minute walkthrough'},
            {label: 'Screening Exercise', href: '/hackathon-learning/index.html', description: 'Invented labels, budgets and unknown evidence'},
            {label: 'My Workspace', href: '/dashboard', description: 'Choose your next analysis'}
        ]}
    ];

    return (
        <nav ref={navRef} aria-label="Main navigation" className="bioscribe-nav sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50" onKeyDown={event => { if (event.key === 'Escape') { closeMenus(); if (event.target instanceof HTMLElement) event.target.closest('[data-nav-group]')?.querySelector('button')?.focus(); } }}>
            <div className="max-w-6xl mx-auto px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/dashboard" onClick={closeMenus} aria-label="BioScribe home" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-xl group-hover:shadow-violet-500/40 transition-all duration-400">
                            <Dna className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-light bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            BioScribe
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-2">
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className="relative"
                                data-nav-group
                                onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropdown(null); }}
                            >
                                <button
                                    aria-expanded={activeDropdown === item.label}
                                    aria-controls={`menu-${item.label.replaceAll(' ', '-')}`}
                                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
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
                                            id={`menu-${item.label.replaceAll(' ', '-')}`}
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="absolute top-full left-0 w-72 max-h-[70vh] overflow-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100/50"
                                        >
                                            {item.dropdown.map((dropdownItem) => enabledRoutes.has(dropdownItem.href) ? (
                                                <Link
                                                    key={dropdownItem.href}
                                                    href={dropdownItem.href}
                                                    onClick={closeMenus}
                                                    aria-current={pathname === dropdownItem.href ? 'page' : undefined}
                                                    className="block px-6 py-4 hover:bg-violet-50/50 transition-all duration-300 border-b border-slate-100/50 last:border-0"
                                                >
                                                    <div className="font-normal text-slate-900 mb-0.5">{dropdownItem.label}</div>
                                                    {dropdownItem.description && (
                                                        <div className="text-sm font-light text-slate-500">{dropdownItem.description}</div>
                                                    )}
                                                </Link>
                                            ) : <div key={dropdownItem.href} className="px-6 py-4 border-b border-slate-100/50 last:border-0"><div className="text-sm text-slate-500">{dropdownItem.label}</div><span className="text-xs text-slate-500">Unavailable in this prototype</span></div>)}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Link href="/dashboard#workflow-guide" onClick={closeMenus} className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-xl transition-all duration-300 font-light">
                            Help
                        </Link>
                        <span className="bioscribe-tag">Public-data prototype</span>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-slate-600"
                        aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-navigation"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            id="mobile-navigation"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="lg:hidden max-h-[75vh] overflow-auto py-6 border-t border-slate-100/50"
                        >
                            {navItems.map((item) => (
                                <div key={item.label} className="mb-6">
                                    <div className="font-normal text-slate-900 px-4 mb-3">{item.label}</div>
                                    {item.dropdown?.map((dropdownItem) => enabledRoutes.has(dropdownItem.href) ? (
                                        <Link
                                            key={dropdownItem.href}
                                            href={dropdownItem.href}
                                            className="block px-6 py-3 text-sm font-light text-slate-600 hover:bg-violet-50/50 transition-all duration-300"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {dropdownItem.label}
                                        </Link>
                                    ) : <div key={dropdownItem.href} className="px-6 py-2 text-sm text-slate-500">{dropdownItem.label}<span className="ml-2 text-xs">· Unavailable</span></div>)}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav >
    );
}

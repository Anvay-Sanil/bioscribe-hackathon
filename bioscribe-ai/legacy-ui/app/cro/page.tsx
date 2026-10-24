'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, DollarSign, Clock, Check } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CROQuote {
    cro_name: string;
    price: number;
    lead_time_days: number;
    purity: number;
    rating: number;
}

export default function CROPage() {
    const [smiles, setSmiles] = useState('CCO');
    const [quantity, setQuantity] = useState(100);
    const [purity, setPurity] = useState(95);
    const [quotes, setQuotes] = useState<CROQuote[]>([]);
    const [activeOrders, setActiveOrders] = useState([
        {
            id: 'ORD-001',
            molecule: 'CC(=O)Oc1ccccc1C(=O)O',
            cro: 'SynthChem Labs',
            status: 'In Synthesis',
            progress: 65,
            expectedDelivery: new Date(Date.now() + 7 * 86400000)
        },
        {
            id: 'ORD-002',
            molecule: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
            cro: 'MolecularWorks Inc',
            status: 'Quality Control',
            progress: 90,
            expectedDelivery: new Date(Date.now() + 3 * 86400000)
        }
    ]);

    const getQuotes = () => {
        setQuotes([
            { cro_name: 'SynthChem Labs', price: 1250, lead_time_days: 14, purity: 95, rating: 4.8 },
            { cro_name: 'MolecularWorks Inc', price: 980, lead_time_days: 21, purity: 95, rating: 4.6 },
            { cro_name: 'ChemBridge Solutions', price: 1500, lead_time_days: 10, purity: 98, rating: 4.9 },
            { cro_name: 'Global Synthesis Co', price: 850, lead_time_days: 28, purity: 92, rating: 4.3 }
        ]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center gap-6 mb-12">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-light text-slate-900 mb-2">CRO Marketplace</h1>
                        <p className="text-xl font-light text-slate-600">Get quotes and order synthesis in 1 click</p>
                    </div>
                </div>

                {/* Get Quote Section */}
                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Get Synthesis Quote</CardTitle>
                        <CardDescription>Compare prices from multiple CROs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-2">Molecule SMILES</label>
                            <input
                                type="text"
                                value={smiles}
                                onChange={(e) => setSmiles(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all font-mono"
                                placeholder="e.g., CCO, CC(=O)Oc1ccccc1C(=O)O"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Quantity (mg)</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="10"
                                    max="10000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Purity (%)</label>
                                <input
                                    type="number"
                                    value={purity}
                                    onChange={(e) => setPurity(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="85"
                                    max="99"
                                />
                            </div>
                        </div>

                        <button
                            onClick={getQuotes}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl flex items-center justify-center gap-2"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Get Quotes
                        </button>
                    </CardContent>
                </Card>

                {/* Quotes */}
                {quotes.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-3xl font-light text-slate-900 mb-6">Quotes</h2>
                        <div className="space-y-4">
                            {quotes.map((quote, idx) => (
                                <Card key={idx} className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="text-xl font-normal text-slate-900 mb-1">{quote.cro_name}</div>
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <span>Rating: {'★'.repeat(Math.floor(quote.rating))} {quote.rating}/5</span>
                                                    <span>Purity: ≥{quote.purity}%</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-center">
                                                    <DollarSign className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                                                    <div className="text-2xl font-light">${quote.price}</div>
                                                    <div className="text-xs text-slate-600">per {quantity}mg</div>
                                                </div>

                                                <div className="text-center">
                                                    <Clock className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                                                    <div className="text-2xl font-light">{quote.lead_time_days}</div>
                                                    <div className="text-xs text-slate-600">days</div>
                                                </div>

                                                <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-lg hover:shadow-xl transition-all">
                                                    Order Now
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Orders */}
                <div>
                    <h2 className="text-3xl font-light text-slate-900 mb-6">Active Orders</h2>
                    <div className="space-y-4">
                        {activeOrders.map((order) => (
                            <Card key={order.id} className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-xl font-normal text-slate-900 mb-1">Order #{order.id}</div>
                                            <div className="font-mono text-sm text-slate-600 mb-2">{order.molecule}</div>
                                            <div className="text-sm text-slate-600">CRO: {order.cro}</div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm">
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-light text-slate-600">Progress</span>
                                            <span className="font-mono text-violet-600">{order.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${order.progress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-sm text-slate-600">
                                        Expected delivery: {order.expectedDelivery.toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

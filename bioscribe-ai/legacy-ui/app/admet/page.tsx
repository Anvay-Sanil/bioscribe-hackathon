'use client';

import React from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function ADMETPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center gap-6 mb-12">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-5xl font-light text-slate-900 mb-2">ADMET Analysis Suite</h1>
                        <p className="text-xl font-light text-slate-600">Comprehensive drug-likeness prediction</p>
                    </div>
                </div>

                <Card className="border-none shadow-2xl bg-white/60">
                    <CardContent className="p-12 text-center">
                        <div className="text-6xl mb-6">💊</div>
                        <h2 className="text-3xl font-light text-slate-900 mb-4">ADMET Suite Coming Soon</h2>
                        <p className="text-lg font-light text-slate-600 mb-8">
                            Predict absorption, distribution, metabolism, excretion, and toxicity
                        </p>
                        <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            <Play className="w-5 h-5 inline mr-2" />
                            Request Beta Access
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

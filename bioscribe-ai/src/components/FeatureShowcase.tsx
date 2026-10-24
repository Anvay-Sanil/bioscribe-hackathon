import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Dna, Microscope, Pill, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
    {
        id: 1,
        title: "Input Sequence",
        description: "Start with any protein sequence or PDB ID. Our system instantly validates and prepares the structure for analysis.",
        icon: <Dna className="w-8 h-8 text-blue-500" />,
        color: "bg-blue-500"
    },
    {
        id: 2,
        title: "AI Analysis",
        description: "Deep learning models identify binding pockets, predict properties, and highlight key interactions in real-time.",
        icon: <Microscope className="w-8 h-8 text-purple-500" />,
        color: "bg-purple-500"
    },
    {
        id: 3,
        title: "Generative Design",
        description: "Our generative AI designs novel ligands optimized for affinity, specificity, and drug-likeness.",
        icon: <Pill className="w-8 h-8 text-pink-500" />,
        color: "bg-pink-500"
    }
];

export function FeatureShowcase() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <div ref={containerRef} className="relative bg-slate-50">
            {features.map((feature, index) => (
                <section key={feature.id} className="min-h-screen flex items-center justify-center relative border-b border-slate-200 last:border-0">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${feature.color}/10 flex items-center justify-center mb-6`}>
                                {feature.icon}
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">{feature.title}</h2>
                            <p className="text-xl text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                            <Button variant="outline" className="group">
                                Learn more <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>

                        {/* Visual Content (Placeholder for 3D/Interactive) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className={`relative aspect-square rounded-3xl overflow-hidden shadow-2xl ${index % 2 === 1 ? 'lg:order-1' : ''}`}
                        >
                            <div className={`absolute inset-0 ${feature.color}/5 bg-gradient-to-br from-white/50 to-transparent backdrop-blur-sm border border-white/20`} />

                            {/* Abstract Visuals */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {index === 0 && (
                                    <div className="relative w-64 h-64">
                                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                        <div className="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                        <div className="absolute inset-0 flex items-center justify-center font-mono text-blue-600 bg-white/80 backdrop-blur rounded-xl shadow-lg p-4">
                                            ATGC-GCTA...
                                        </div>
                                    </div>
                                )}
                                {index === 1 && (
                                    <div className="grid grid-cols-2 gap-4 p-8">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="bg-white p-4 rounded-xl shadow-lg border border-purple-100 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                                                <div className="h-2 w-12 bg-purple-200 rounded mb-2" />
                                                <div className="h-2 w-20 bg-slate-100 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {index === 2 && (
                                    <div className="relative">
                                        <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl rotate-12 shadow-2xl flex items-center justify-center text-white font-bold text-2xl">
                                            Drug Candidate
                                        </div>
                                        <div className="absolute -top-4 -right-4 bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-green-600">
                                            98% Affinity
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>
            ))}
        </div>
    );
}

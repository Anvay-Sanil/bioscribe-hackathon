'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, FolderKanban, Calendar, MessageSquare, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Workspace {
    id: string;
    name: string;
    description: string;
    members: number;
    molecules: number;
    lastActivity: Date;
    status: 'active' | 'archived';
}

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([
        {
            id: 'ws-001',
            name: 'KRAS G12C Inhibitor Campaign',
            description: 'Lead optimization for KRAS G12C selective inhibitors targeting lung cancer',
            members: 8,
            molecules: 247,
            lastActivity: new Date(Date.now() - 3600000),
            status: 'active'
        },
        {
            id: 'ws-002',
            name: "Alzheimer's Target Discovery",
            description: "Novel target identification for Alzheimer's disease using multi-omics approach",
            members: 5,
            molecules: 89,
            lastActivity: new Date(Date.now() - 7200000),
            status: 'active'
        },
        {
            id: 'ws-003',
            name: 'PD-L1 Immunotherapy',
            description: 'Next-generation immune checkpoint inhibitors',
            members: 12,
            molecules: 523,
            lastActivity: new Date(Date.now() - 86400000),
            status: 'active'
        }
    ]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Project Workspaces</h1>
                        <p className="text-xl font-light text-slate-600">Collaborate with your team in real-time</p>
                    </div>
                    <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        New Workspace
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {workspaces.map((ws) => (
                        <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-2xl font-light mb-2">{ws.name}</CardTitle>
                                                <CardDescription className="text-base">{ws.description}</CardDescription>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                                                {ws.status}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-4 gap-6">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-8 h-8 text-violet-600" />
                                                <div>
                                                    <div className="text-2xl font-light">{ws.members}</div>
                                                    <div className="text-sm text-slate-600">Members</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FolderKanban className="w-8 h-8 text-violet-600" />
                                                <div>
                                                    <div className="text-2xl font-light">{ws.molecules}</div>
                                                    <div className="text-sm text-slate-600">Molecules</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="w-8 h-8 text-violet-600" />
                                                <div>
                                                    <div className="text-2xl font-light">42</div>
                                                    <div className="text-sm text-slate-600">Comments</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Activity className="w-8 h-8 text-violet-600" />
                                                <div>
                                                    <div className="text-sm text-slate-600">Last activity</div>
                                                    <div className="font-light">{ws.lastActivity.toLocaleTimeString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

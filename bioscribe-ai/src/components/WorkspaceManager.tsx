import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Plus,
    Settings,
    Crown,
    User,
    Eye,
    Beaker,
    Clock,
    MessageSquare,
    Share2,
    Lock,
    Globe,
    CheckCircle2,
    Activity,
    TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkspaceMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'scientist' | 'viewer';
    avatar: string;
    lastActive: Date;
    contributionsCount: number;
}

interface Workspace {
    id: string;
    name: string;
    description: string;
    members: number;
    compounds: number;
    projects: number;
    visibility: 'private' | 'team' | 'public';
    role: 'admin' | 'scientist' | 'viewer';
    lastActivity: Date;
}

interface ActivityItem {
    id: string;
    user: string;
    action: string;
    target: string;
    timestamp: Date;
    type: 'upload' | 'analysis' | 'comment' | 'share';
}

export function WorkspaceManager() {
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ws-1');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const workspaces: Workspace[] = [
        {
            id: 'ws-1',
            name: 'Kinase Inhibitor Program',
            description: 'BRAF/MEK dual inhibitors for melanoma',
            members: 12,
            compounds: 847,
            projects: 3,
            visibility: 'team',
            role: 'admin',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
            id: 'ws-2',
            name: 'GPCR Discovery',
            description: 'Novel agonists for orphan GPCRs',
            members: 8,
            compounds: 1243,
            projects: 5,
            visibility: 'private',
            role: 'scientist',
            lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
            id: 'ws-3',
            name: 'Protease Screening',
            description: 'HCV/HIV protease inhibitor SAR study',
            members: 6,
            compounds: 456,
            projects: 2,
            visibility: 'team',
            role: 'viewer',
            lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
    ];

    const members: WorkspaceMember[] = [
        {
            id: 'user-1',
            name: 'Dr. Sanil',
            email: 'sanil@pharma.com',
            role: 'admin',
            avatar: 'DS',
            lastActive: new Date(Date.now() - 30 * 60 * 1000),
            contributionsCount: 127
        },
        {
            id: 'user-2',
            name: 'Dr. Michael Torres',
            email: 'michael.t@pharma.com',
            role: 'scientist',
            avatar: 'MT',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
            contributionsCount: 89
        },
        {
            id: 'user-3',
            name: 'Dr. Emily Watson',
            email: 'emily.w@pharma.com',
            role: 'scientist',
            avatar: 'EW',
            lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
            contributionsCount: 142
        },
        {
            id: 'user-4',
            name: 'James Liu',
            email: 'james.liu@pharma.com',
            role: 'viewer',
            avatar: 'JL',
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
            contributionsCount: 23
        }
    ];

    const activities: ActivityItem[] = [
        {
            id: 'act-1',
            user: 'Dr. Sanil',
            action: 'uploaded',
            target: '24 new compounds',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            type: 'upload'
        },
        {
            id: 'act-2',
            user: 'Dr. Emily Watson',
            action: 'completed',
            target: 'ADMET analysis for Batch-045',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            type: 'analysis'
        },
        {
            id: 'act-3',
            user: 'Dr. Michael Torres',
            action: 'commented on',
            target: 'Lead Candidate BS-2024-089',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            type: 'comment'
        },
        {
            id: 'act-4',
            user: 'Dr. Sanil',
            action: 'shared',
            target: 'Project Report with Executive Team',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            type: 'share'
        }
    ];

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
            case 'scientist': return <Beaker className="w-4 h-4 text-blue-600" />;
            case 'viewer': return <Eye className="w-4 h-4 text-slate-600" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'scientist': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'viewer': return 'bg-slate-100 text-slate-800 border-slate-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'private': return <Lock className="w-4 h-4" />;
            case 'team': return <Users className="w-4 h-4" />;
            case 'public': return <Globe className="w-4 h-4" />;
            default: return <Lock className="w-4 h-4" />;
        }
    };

    const formatLastActive = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-600" />
                        Team Workspaces
                    </h2>
                    <p className="text-slate-500">Collaborate on drug discovery campaigns</p>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                </Button>
            </div>

            {/* Workspaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {workspaces.map((ws, idx) => (
                    <motion.div
                        key={ws.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card
                            className={`cursor-pointer transition-all hover:shadow-lg ${selectedWorkspace === ws.id ? 'border-2 border-purple-500' : 'border hover:border-purple-300'
                                }`}
                            onClick={() => setSelectedWorkspace(ws.id)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">{ws.name}</h3>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{ws.description}</p>
                                    </div>
                                    {getVisibilityIcon(ws.visibility)}
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-slate-900">{ws.members}</div>
                                        <div className="text-xs text-slate-500">Members</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-blue-600">{ws.compounds}</div>
                                        <div className="text-xs text-slate-500">Compounds</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-purple-600">{ws.projects}</div>
                                        <div className="text-xs text-slate-500">Projects</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={getRoleColor(ws.role)}>
                                        {getRoleIcon(ws.role)}
                                        <span className="ml-1 capitalize">{ws.role}</span>
                                    </Badge>
                                    <span className="text-xs text-slate-500">
                                        {formatLastActive(ws.lastActivity)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Workspace Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Members */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Team Members</CardTitle>
                                <Button size="sm" variant="outline">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Invite
                                </Button>
                            </div>
                            <CardDescription>Manage workspace collaborators</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {members.map((member, idx) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                                        {member.avatar}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 truncate">{member.name}</h4>
                                                        <p className="text-sm text-slate-600 truncate">{member.email}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                                                                {getRoleIcon(member.role)}
                                                                <span className="ml-1 capitalize">{member.role}</span>
                                                            </Badge>
                                                            <span className="text-xs text-slate-500">
                                                                {member.contributionsCount} contributions
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-xs text-slate-500 mb-1">Last active</div>
                                                        <div className="text-xs font-medium text-slate-900">
                                                            {formatLastActive(member.lastActive)}
                                                        </div>
                                                    </div>
                                                    {member.role !== 'admin' && (
                                                        <Button size="sm" variant="ghost">
                                                            <Settings className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Feed */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Live workspace updates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activities.map((activity, idx) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex gap-3 pb-4 border-b border-slate-100 last:border-0"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'upload' ? 'bg-blue-100' :
                                            activity.type === 'analysis' ? 'bg-green-100' :
                                                activity.type === 'comment' ? 'bg-purple-100' :
                                                    'bg-orange-100'
                                            }`}>
                                            {activity.type === 'upload' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                                            {activity.type === 'analysis' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                            {activity.type === 'comment' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                                            {activity.type === 'share' && <Share2 className="w-4 h-4 text-orange-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{activity.user}</span>
                                                {' '}{activity.action}{' '}
                                                <span className="font-medium">{activity.target}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatLastActive(activity.timestamp)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="mt-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                        <CardContent className="p-4">
                            <h4 className="font-bold text-slate-900 mb-3">Workspace Stats (7 days)</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Compounds Analyzed</span>
                                    <span className="font-bold text-slate-900">127</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Reports Generated</span>
                                    <span className="font-bold text-slate-900">8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Collaborations</span>
                                    <span className="font-bold text-slate-900">34</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

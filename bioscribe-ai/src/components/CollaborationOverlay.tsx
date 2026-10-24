import React, { useEffect, useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CollaborationOverlay() {
    const { users, cursors, followUserId, setFollowUser, currentUser } = useCollaboration();
    const [showUsers, setShowUsers] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const sessionId = Math.random().toString(36).substring(7);
        const link = `${window.location.origin}/collaborate/${sessionId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Active Users List - Top Right */}
            <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
                <AnimatePresence>
                    {showUsers && users.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
                        >
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">{users.length + 1} Online</span>
                            <div className="flex items-center -space-x-2">
                                {/* Current User */}
                                <Avatar className="w-8 h-8 border-2 border-white ring-2 ring-violet-500">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                        {currentUser.avatar}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Other Users */}
                                {users.map((user) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="relative"
                                    >
                                        <Avatar
                                            className="w-8 h-8 border-2 border-white cursor-pointer hover:z-10 transition-transform hover:scale-110"
                                            style={{
                                                backgroundColor: user.color,
                                                ringColor: followUserId === user.id ? user.color : 'transparent',
                                                ringWidth: followUserId === user.id ? '2px' : '0px'
                                            }}
                                            onClick={() => setFollowUser(followUserId === user.id ? null : user.id)}
                                        >
                                            <AvatarFallback className="text-xs text-white">
                                                {user.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        {user.isActive && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-slate-50"
                    onClick={() => setShowUsers(!showUsers)}
                >
                    {showUsers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg hover:bg-slate-50"
                    onClick={handleCopyLink}
                >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            {/* Follow Mode Badge */}
            <AnimatePresence>
                {followUserId && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 right-4 z-40"
                    >
                        <Badge
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 text-sm shadow-lg"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Following {users.find(u => u.id === followUserId)?.name}
                        </Badge>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Cursors */}
            {Array.from(cursors.entries()).map(([userId, cursor]) => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                return (
                    <motion.div
                        key={userId}
                        className="fixed pointer-events-none z-50"
                        style={{
                            left: cursor.x,
                            top: cursor.y,
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                    >
                        {/* Cursor SVG */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ transform: 'rotate(-10deg)' }}
                        >
                            <path
                                d="M5.65376 12.3673L18.8777 14.7238L11.4485 20.4196L8.38933 15.3016L5.65376 12.3673Z"
                                fill={user.color}
                                stroke="white"
                                strokeWidth="1.5"
                            />
                        </svg>

                        {/* User Label */}
                        <div
                            className="absolute top-6 left-2 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.avatar} {user.name}
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
}

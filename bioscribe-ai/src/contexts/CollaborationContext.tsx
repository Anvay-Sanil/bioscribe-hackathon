'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    color: string;
    avatar: string;
    isActive: boolean;
}

interface Cursor {
    userId: string;
    x: number;
    y: number;
    timestamp: number;
}

interface CollaborationContextType {
    users: User[];
    cursors: Map<string, Cursor>;
    followUserId: string | null;
    isFollowing: boolean;
    currentUser: User;
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
    updateCursor: (userId: string, x: number, y: number) => void;
    setFollowUser: (userId: string | null) => void;
    broadcastAction: (action: string, data: any) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function useCollaboration() {
    const context = useContext(CollaborationContext);
    if (!context) {
        throw new Error('useCollaboration must be used within CollaborationProvider');
    }
    return context;
}

const USER_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
const USER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

export function CollaborationProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<User[]>([]);
    const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
    const [followUserId, setFollowUserId] = useState<string | null>(null);
    const [currentUser] = useState<User>({
        id: 'current-user',
        name: 'You',
        color: '#8B5CF6',
        avatar: '👨‍🔬',
        isActive: true
    });

    // Simulate other users joining (for demonstration)
    useEffect(() => {
        const simulateUsers = () => {
            const demoUsers: User[] = [];
            const numUsers = Math.floor(Math.random() * 3) + 1; // 1-3 demo users

            for (let i = 0; i < numUsers; i++) {
                demoUsers.push({
                    id: `user-${i}`,
                    name: USER_NAMES[i],
                    color: USER_COLORS[i],
                    avatar: ['👨‍💼', '👩‍🔬', '👨‍🎓', '👩‍💻'][i % 4],
                    isActive: true
                });
            }

            setUsers(demoUsers);
        };

        // Simulate users joining after a delay
        const timer = setTimeout(simulateUsers, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Simulate cursor movements from other users
    useEffect(() => {
        const interval = setInterval(() => {
            users.forEach(user => {
                if (user.id !== currentUser.id) {
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * window.innerHeight;
                    updateCursor(user.id, x, y);
                }
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [users]);

    const addUser = (user: User) => {
        setUsers(prev => [...prev, user]);
    };

    const removeUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.delete(userId);
            return newCursors;
        });
    };

    const updateCursor = (userId: string, x: number, y: number) => {
        setCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.set(userId, { userId, x, y, timestamp: Date.now() });
            return newCursors;
        });
    };

    const setFollowUser = (userId: string | null) => {
        setFollowUserId(userId);
    };

    const broadcastAction = (action: string, data: any) => {
        // In production, this would send to WebSocket/WebRTC
        console.log('Broadcasting action:', action, data);
    };

    return (
        <CollaborationContext.Provider
            value={{
                users,
                cursors,
                followUserId,
                isFollowing: followUserId !== null,
                currentUser,
                addUser,
                removeUser,
                updateCursor,
                setFollowUser,
                broadcastAction
            }}
        >
            {children}
        </CollaborationContext.Provider>
    );
}

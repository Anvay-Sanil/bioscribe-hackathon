'use client';

import dynamic from 'next/dynamic';

const TeamCodeBlue = dynamic(() => import('@/components/scholar/TeamCodeBlue'), { ssr: false });

export default function TeamCodeBluePage() {
    return (
        <div className="scholar-page">
            <TeamCodeBlue />
        </div>
    );
}

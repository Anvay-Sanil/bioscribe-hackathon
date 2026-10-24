'use client';

import dynamic from 'next/dynamic';

const DrHouseMode = dynamic(() => import('@/components/scholar/DrHouseMode'), { ssr: false });

export default function DrHousePage() {
    return (
        <div className="scholar-page">
            <DrHouseMode />
        </div>
    );
}

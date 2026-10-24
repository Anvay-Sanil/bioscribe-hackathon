'use client';

import dynamic from 'next/dynamic';

const CareerPassport = dynamic(() => import('@/components/scholar/CareerPassport'), { ssr: false });

export default function CareerPassportPage() {
    return (
        <div className="scholar-page">
            <CareerPassport />
        </div>
    );
}

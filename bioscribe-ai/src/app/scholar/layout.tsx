import '../scholar-theme.css';
import { ScholarNavigation } from '@/components/scholar/ScholarNavigation';
import { AIProfessor } from '@/components/scholar/AIProfessor';

export default function ScholarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="scholar-layout scholar-scanlines">
            <ScholarNavigation />
            <main className="relative z-10">
                {children}
            </main>
            <AIProfessor />
        </div>
    );
}

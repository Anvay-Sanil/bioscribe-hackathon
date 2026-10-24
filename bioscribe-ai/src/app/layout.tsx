import type { Metadata } from 'next';
import { MainNavigation } from '@/components/MainNavigation';
import './globals.css';
import './workbench-theme.css';
export const metadata: Metadata = {title:'BioScribe · Molecular Workbench',description:'Explore molecular and sequence descriptors with traceable results.'};
export default function RootLayout({children}: {children:React.ReactNode}) {
  return <html lang="en"><body className="antialiased"><a href="#main-content" className="bioscribe-skip">Skip to content</a><MainNavigation />{children}</body></html>;
}


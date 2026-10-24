import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
export const metadata: Metadata = {title:'BioScribe descriptor workbench',description:'Traceable descriptors with explicit evidence limits. Scientific release blocked.'};
export default function RootLayout({children}: {children:React.ReactNode}) {
  return <html lang="en"><body><nav className="border-b p-4"><Link href="/pipeline/new">BioScribe · New run</Link></nav>{children}</body></html>;
}


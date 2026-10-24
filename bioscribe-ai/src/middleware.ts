import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path=request.nextUrl.pathname;
  if(path==='/')return NextResponse.redirect(new URL('/dashboard',request.url));
  const demoAssets = new Set(['/3dmol-min.js', '/hackathon/example-run.json', '/hackathon/example-request.json', '/hackathon/conformers.json', ...['index.html','viewer.css','report.js','filters.js','viewer.js','examples.js'].map(file=>`/hackathon-learning/${file}`)]);
  if(path==='/evidence-assistant'||path==='/evidence-assistant/example.json'||path==='/dashboard'||path==='/pipeline/new'||path==='/molecules'||path==='/evidence'||path==='/proof'||/^\/evidence-lab\/(reference-run|challenge-run|challenge-source-run|budget-one-run|schema)\.json$/.test(path)||demoAssets.has(path)||/^\/results\/[a-f0-9]{32}$/.test(path))return NextResponse.next();
  return new NextResponse('This legacy capability is disabled pending scientific and implementation validation. Open /pipeline/new for the supported public-data descriptor workflow.',{status:410,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};

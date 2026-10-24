import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path=request.nextUrl.pathname;
  if(path==='/')return NextResponse.redirect(new URL('/pipeline/new',request.url));
  if(path==='/pipeline/new'||/^\/results\/[a-f0-9]{32}$/.test(path))return NextResponse.next();
  return new NextResponse('This legacy capability is disabled pending scientific and implementation validation. Open /pipeline/new for the supported public-data descriptor workflow.',{status:410,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};

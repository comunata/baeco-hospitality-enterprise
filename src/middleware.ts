import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/portal") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isLocale(first)) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get("locale")?.value;
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferred = locales.find((l) => acceptLanguage.toLowerCase().includes(l));
  const locale = (cookieLocale && isLocale(cookieLocale) && cookieLocale) || preferred || defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};

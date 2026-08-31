import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DOCS_COOKIE = "occasio_docs_access";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const token = process.env.DOCS_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const queryAccess = request.nextUrl.searchParams.get("access");
  const cookieAccess = request.cookies.get(DOCS_COOKIE)?.value;
  const granted = queryAccess === token || cookieAccess === token;

  if (!granted) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (queryAccess === token) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("access");
    const response = NextResponse.redirect(url);
    response.cookies.set(DOCS_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/docs",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/docs", "/docs/:path*"],
};

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/")
  ) {
    const adminAuth = request.cookies.get("admin_auth");
    if (!adminAuth || adminAuth.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};

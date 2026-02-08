import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    // Check for refresh token in cookie (best-effort server-side check)
    const hasRefreshToken = request.cookies.get("refreshToken");
    if (!hasRefreshToken) {
      // Client-side localStorage check happens in the dashboard layout
      // For SSR, we allow through and let client handle redirect
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

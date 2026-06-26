// Security headers configuration – adds Permissions-Policy and Referrer-Policy
import { buildSecurityHeaders } from "./lib/securityHeaders.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Attach baseline security headers (incl. a Content-Security-Policy) to every
   * response. The header values are built in lib/securityHeaders.mjs so they can
   * be unit-tested (security/headers.test.tsx) and reused by middleware later.
   *
   * - NEXT_PUBLIC_API_URL is read here and allow-listed in connect-src so the
   *   frontend's fetch() calls to the backend are not blocked by the CSP.
   * - In development a few CSP rules are relaxed (unsafe-eval, ws:) so Next.js
   *   Hot Module Replacement keeps working; production stays strict.
   */
  async headers() {
    const securityHeaders = buildSecurityHeaders({
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      isDev: process.env.NODE_ENV !== "production",
    });

    return [
      {
        // Apply to every route, including API routes and static assets.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

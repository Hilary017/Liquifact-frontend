import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
  const headers = new Headers({
    "Content-Type": "text/plain",
  });
  // Use standard Response to ensure .text() works in tests
  return new Response(content, {
    status: 200,
    headers,
  });
}

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

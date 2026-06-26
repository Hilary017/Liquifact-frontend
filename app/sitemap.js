import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const routes = ["/", "/invoices", "/invest"];

function generateSitemap() {
  const urls = routes
    .map((path) => {
      const loc = `${baseUrl}${path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export async function GET() {
  const sitemap = generateSitemap();
  const headers = new Headers({
    "Content-Type": "application/xml",
  });
  return new NextResponse(sitemap, {
    status: 200,
    headers,
  });
}

export default function sitemap() {
  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}

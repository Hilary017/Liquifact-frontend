const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const routes = ['/', '/invoices', '/invest'];

function textResponse(body, init) {
  if (typeof Response !== 'undefined') {
    return new Response(body, init);
  }

  return {
    status: init.status,
    headers: init.headers,
    text: async () => body,
  };
}

function generateSitemap() {
  const urls = routes
    .map((path) => {
      const loc = `${baseUrl}${path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export default function sitemap() {
  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}

export async function GET() {
  const xml = generateSitemap();
  return textResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

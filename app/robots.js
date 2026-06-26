const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

export async function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
  return textResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

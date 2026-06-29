if (typeof (global as any).Request === 'undefined') {
  (global as any).Request = class Request {
    public url: string;
    public headers: Map<string, string>;
    constructor(input: any, init?: any) {
      this.url = typeof input === 'string' ? input : input?.url || '';
      this.headers = new Map();
    }
  };
}

import { NextResponse } from 'next/server';

// Import after polyfill so Next's request internals don't throw.
import { GET } from './sitemap';

describe('Sitemap Route', () => {
  it('returns XML with expected public routes', async () => {
    const response = (await GET()) as NextResponse;
    expect(response.status).toBe(200);
    const xml = await response.text();
    // Base URL fallback is localhost:3000
    expect(xml).toContain("<loc>http://localhost:3000/</loc>");
    expect(xml).toContain("<loc>http://localhost:3000/invoices</loc>");
    expect(xml).toContain("<loc>http://localhost:3000/invest</loc>");
    // Ensure no dynamic route placeholder
    expect(xml).not.toMatch(/\{.*\}/);
  });
});
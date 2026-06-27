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
import { GET } from './robots';

describe('Robots Route', () => {
  it('returns proper robots.txt content', async () => {
    const response = (await GET()) as NextResponse;
    expect(response.status).toBe(200);
    const txt = await response.text();
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Allow: /");
    // default base URL fallback
    expect(txt).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  });
});
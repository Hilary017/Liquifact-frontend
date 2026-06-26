import { GET } from "./sitemap";
import { NextResponse } from "next/server";

describe("Sitemap Route", () => {
  it("returns XML with expected public routes", async () => {
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

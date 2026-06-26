import { GET } from "./robots";
import { NextResponse } from "next/server";

describe("Robots Route", () => {
  it("returns proper robots.txt content", async () => {
    const response = (await GET()) as NextResponse;
    expect(response.status).toBe(200);
    const txt = await response.text();
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Allow: /");
    // default base URL fallback
    expect(txt).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  });
});

require("@testing-library/jest-dom");

// Simple polyfills for Node environment
global.Request = class Request {};
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }
  async text() {
    return typeof this.body === "string" ? this.body : JSON.stringify(this.body);
  }
  async json() {
    return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
  }
};

const { toHaveNoViolations } = require("jest-axe");
expect.extend(toHaveNoViolations);

jest.mock('next/server', () => {
  class MockResponse {
    constructor(body, init) {
      this.bodyContent = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? {};
    }
    text() {
      return Promise.resolve(this.bodyContent);
    }
  }
  return {
    NextResponse: MockResponse,
  };
});

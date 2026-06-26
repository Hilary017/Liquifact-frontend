require('@testing-library/jest-dom');

// Simple polyfills for Node environment
global.Request = class Request {};
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }
};

const { toHaveNoViolations } = require('jest-axe');
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

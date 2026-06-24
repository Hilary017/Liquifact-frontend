import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import Home from "./page";
import { getHealth } from "../lib/api/health";

// IMPORTANT: mock before tests
jest.mock("../lib/api/health", () => ({
  __esModule: true,
  getHealth: jest.fn(),
}));

const mockGetHealth = getHealth as jest.Mock;

describe("Home Page Health Check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("verifies mock", () => {
    expect(jest.isMockFunction(getHealth)).toBe(true);
  });

  it("renders the health check button", () => {
    render(<Home />);

    expect(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    ).toBeTruthy();
  });

  it("disables button while loading", async () => {
    mockGetHealth.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: "connected",
                message: "Backend is healthy",
              }),
            100
          )
        )
    );

    render(<Home />);

    const button = screen.getByRole("button", {
      name: /check backend health/i,
    });

    fireEvent.click(button);

    expect(button.hasAttribute("disabled")).toBe(true);

    expect(
      screen.getByText(/checking/i)
    ).toBeTruthy();
  });

  it("renders connected state", async () => {
    mockGetHealth.mockResolvedValue({
      status: "connected",
      message: "Backend is healthy",
      details: {
        status: "ok",
      },
    });

    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/backend is healthy/i)
      ).toBeTruthy();
    });
  });

  it("renders degraded state", async () => {
    mockGetHealth.mockResolvedValue({
      status: "degraded",
      message: "Backend responded with 500",
      details: {
        error: "Internal Server Error",
      },
    });

    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/backend responded with 500/i)
      ).toBeTruthy();
    });
  });

  it("renders unreachable state", async () => {
    mockGetHealth.mockResolvedValue({
      status: "unreachable",
      message: "Health check timed out",
    });

    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/health check timed out/i)
      ).toBeTruthy();
    });
  });

  it("renders raw response details", async () => {
    mockGetHealth.mockResolvedValue({
      status: "degraded",
      message: "Backend responded with 500",
      details: {
        error: "Internal Server Error",
      },
    });

    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/view details/i)
      ).toBeTruthy();
    });
  });

  it("announces status updates politely", async () => {
    mockGetHealth.mockResolvedValue({
      status: "connected",
      message: "Backend is healthy",
      details: {
        status: "ok",
      },
    });

    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /check backend health/i,
      })
    );

    const statusRegion = await screen.findByRole("status");

    expect(
      statusRegion.getAttribute("aria-live")
    ).toBe("polite");
  });
});
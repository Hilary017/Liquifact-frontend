import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import UploadZone, { FILE_CONSTRAINTS } from "./UploadZone";
import { copy } from "../app/copy/en";
import { isPdfMagicValid } from "../lib/validation/pdf";

jest.mock("../lib/validation/pdf", () => ({
  isPdfMagicValid: jest.fn()
}));

expect.extend(toHaveNoViolations);

/**
 * IMPORTANT: DataTransfer mocking for drag-and-drop tests
 *
 * jsdom does not implement the DataTransfer API. To simulate drag-and-drop events
 * with files, we mock the DataTransfer object as a plain object with:
 *  - files: Array of File objects
 *  - types: Array of string types (e.g., ['Files'])
 *
 * Example usage:
 *   const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
 *   const dataTransfer = { files: [file], types: ['Files'] };
 *   fireEvent.drop(element, { dataTransfer });
 *
 * This pattern is used throughout the drag-and-drop test suite.
 */

function createMockFile(name = "invoice.pdf", type = "application/pdf") {
  return new File(["mock content"], name, { type });
}

function createMockTextFile(name = "test.txt") {
  return new File(["mock content"], name, { type: "text/plain" });
}

function createMockLargeFile(sizeMb = 11) {
  const size = sizeMb * 1024 * 1024;
  return new File([new ArrayBuffer(size)], "large.pdf", { type: "application/pdf" });
}

function createDataTransfer(files) {
  return {
    files,
    types: ["Files"],
  };
}

function mockFetchOk(extra = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(extra),
  });
}

function mockFetchError(status = 500, message = "Server error") {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ message }),
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("UploadZone", () => {
  it("renders constraint notice and drop zone in idle state", () => {
    render(<UploadZone />);

    expect(screen.getByRole("note", { name: /file upload requirements/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /drop pdf invoice/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeDisabled();
  });

  it("shows file info after valid file selection", () => {
    render(<UploadZone />);

    const file = createMockFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeEnabled();
  });

  it("shows validation error for non-PDF file", () => {
    render(<UploadZone />);

    const file = createMockTextFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent(/invalid file type/i);
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeDisabled();
  });

  it("shows validation error for oversized file", () => {
    render(<UploadZone />);

    const file = createMockLargeFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent(/exceeds/);
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeDisabled();
  });
  it("rejects file with correct MIME but invalid PDF magic bytes", async () => {
    // Mock the magic validation to return false
    isPdfMagicValid.mockResolvedValueOnce(false);
    render(<UploadZone />);
    const file = createMockFile("fake.pdf", "application/pdf");
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/valid pdf/i));
  });

  it("progresses through uploading, tokenizing, and success on submit", async () => {
    mockFetchOk();
    render(<UploadZone />);

    const file = createMockFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const submitBtn = screen.getByRole("button", {
      name: /upload & tokenize invoice/i,
    });
    fireEvent.click(submitBtn);

    // uploading state shown immediately
    expect(screen.getByRole("status")).toHaveTextContent(/uploading invoice/i);
    expect(submitBtn).toBeDisabled();

    // after fetch resolves → tokenizing then success
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/queued for tokenization/i)
    );
    expect(submitBtn).toBeEnabled();
  });

  it("shows tokenizing status between upload and success when server returns tokenizationDelay", async () => {
    // fetch resolves with a tokenizationDelay so the component briefly enters tokenizing
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ tokenizationDelay: 1000 }),
    });

    render(<UploadZone />);

    const file = createMockFile();
    fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

    // uploading while fetch is in-flight
    expect(screen.getByRole("status")).toHaveTextContent(/uploading invoice/i);

    // let the fetch resolve, which moves to tokenizing
    await act(async () => {
      await Promise.resolve(); // flush microtasks
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/pending tokenization/i)
    );

    // advance through the tokenization delay
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/queued for tokenization/i)
    );
  });

  it('uses role="status" with aria-live for progress announcements', async () => {
    mockFetchOk();
    render(<UploadZone />);

    const file = createMockFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/uploading invoice/i);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/queued for tokenization/i)
    );
  });

  it("prevents double-submission during processing", async () => {
    // keep fetch pending so component stays in uploading
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<UploadZone />);

    const file = createMockFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const submitBtn = screen.getByRole("button", {
      name: /upload & tokenize invoice/i,
    });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(/uploading invoice/i);
  });

  it("opens file dialog on Enter key on the drop zone", () => {
    render(<UploadZone />);

    const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
    const input = screen.getByLabelText(/select pdf invoice file/i);
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.keyDown(dropZone, { key: "Enter", code: "Enter" });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("opens file dialog on Space key on the drop zone", () => {
    render(<UploadZone />);

    const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
    const input = screen.getByLabelText(/select pdf invoice file/i);
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.keyDown(dropZone, { key: " ", code: "Space" });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("resets to idle when a new valid file is selected after an error", () => {
    render(<UploadZone />);

    const input = screen.getByLabelText(/select pdf invoice file/i);

    fireEvent.change(input, { target: { files: [createMockTextFile()] } });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [createMockFile()] } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeEnabled();
  });

  it('shows validation error role="alert" with aria-live="assertive"', () => {
    render(<UploadZone />);

    const file = createMockTextFile();
    const input = screen.getByLabelText(/select pdf invoice file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("shows error and resets to idle when upload fails with server error", async () => {
    mockFetchError(500, "Internal server error");
    render(<UploadZone />);

    const file = createMockFile();
    fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/internal server error/i)
    );
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeEnabled();
  });

  it("shows error and resets to idle when fetch throws (network failure)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<UploadZone />);

    const file = createMockFile();
    fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/network error/i));
    expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeEnabled();
  });

  it("sends a POST request to /invoices with the file as FormData", async () => {
    mockFetchOk();
    render(<UploadZone />);

    const file = createMockFile();
    fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/invoices$/);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("invoice")).toBe(file);
  });

  describe("GROUP 1: Drag-and-drop", () => {
    it("changes border/highlight state on drag over", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });

      // Check initial state (no drag-active)
      expect(dropZone).toHaveClass("border-slate-700", "bg-slate-900/40");

      // Simulate dragOver
      fireEvent.dragOver(dropZone);

      // Check drag-active state
      expect(dropZone).toHaveClass("border-cyan-400", "bg-cyan-500/10");

      // Simulate dragLeave
      fireEvent.dragLeave(dropZone);

      // Check returned to normal state
      expect(dropZone).toHaveClass("border-slate-700", "bg-slate-900/40");
    });

    it("accepts valid PDF file on drop", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const file = createMockFile("invoice.pdf", "application/pdf");
      const dataTransfer = createDataTransfer([file]);

      fireEvent.drop(dropZone, { dataTransfer });

      // Assert file is accepted (no error message)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      // Assert file name appears in the UI
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
      // Assert submit button is enabled
      expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeEnabled();
    });

    it('rejects invalid file type on drop with role="alert" error', () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const file = createMockTextFile("document.txt");
      const dataTransfer = createDataTransfer([file]);

      fireEvent.drop(dropZone, { dataTransfer });

      // Assert role="alert" error message appears
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/invalid file type/i);
      // Assert file is rejected (no file name shown)
      expect(screen.queryByText("document.txt")).not.toBeInTheDocument();
      // Assert submit button is disabled
      expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeDisabled();
    });

    it('rejects oversized file on drop with role="alert" error', () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const file = createMockLargeFile(11); // 11 MB (exceeds 10 MB limit)
      const dataTransfer = createDataTransfer([file]);

      fireEvent.drop(dropZone, { dataTransfer });

      // Assert role="alert" error message appears
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/exceeds/i);
      // Assert file is rejected (no file name shown)
      expect(screen.queryByText("large.pdf")).not.toBeInTheDocument();
      // Assert submit button is disabled
      expect(screen.getByRole("button", { name: /upload & tokenize invoice/i })).toBeDisabled();
    });

    it("clears drag-over state after drop", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const file = createMockFile();
      const dataTransfer = createDataTransfer([file]);

      // Simulate dragOver then drop
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass("border-cyan-400", "bg-cyan-500/10");

      fireEvent.drop(dropZone, { dataTransfer });

      // Check drag-active state is cleared
      expect(dropZone).not.toHaveClass("border-cyan-400", "bg-cyan-500/10");
    });
  });

  describe("GROUP 2: Keyboard activation (existing tests validated)", () => {
    it("opens file dialog on Enter key on the drop zone (re-verify)", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const input = screen.getByLabelText(/select pdf invoice file/i);
      const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

      fireEvent.keyDown(dropZone, { key: "Enter", code: "Enter" });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it("opens file dialog on Space key on the drop zone (re-verify)", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const input = screen.getByLabelText(/select pdf invoice file/i);
      const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

      fireEvent.keyDown(dropZone, { key: " ", code: "Space" });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it("does NOT open file dialog on other keys (Tab, Escape)", () => {
      render(<UploadZone />);

      const dropZone = screen.getByRole("button", { name: /drop pdf invoice/i });
      const input = screen.getByLabelText(/select pdf invoice file/i);
      const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

      fireEvent.keyDown(dropZone, { key: "Tab", code: "Tab" });
      expect(clickSpy).not.toHaveBeenCalled();

      fireEvent.keyDown(dropZone, { key: "Escape", code: "Escape" });
      expect(clickSpy).not.toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });

  describe("GROUP 3: Submit state machine / double-submit guard (existing tests validated)", () => {
    it("disables submit button during uploading state", async () => {
      // Keep fetch pending so component stays in uploading
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
      render(<UploadZone />);

      const file = createMockFile();
      fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
        target: { files: [file] },
      });

      const submitBtn = screen.getByRole("button", {
        name: /upload & tokenize invoice/i,
      });

      // Click submit
      fireEvent.click(submitBtn);

      // Assert button is disabled
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveAttribute("aria-disabled", "true");
    });

    it('verifies uploading → tokenizing → success role="status" copy', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ tokenizationDelay: 50 }),
      });

      render(<UploadZone />);

      const file = createMockFile();
      fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
        target: { files: [file] },
      });

      fireEvent.click(screen.getByRole("button", { name: /upload & tokenize invoice/i }));

      // uploading state
      const statusUploading = screen.getByRole("status");
      expect(statusUploading).toHaveTextContent(copy.uploadZone.statusUploading);

      // Wait for tokenizing state
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(copy.uploadZone.statusTokenizing)
      );

      // Advance through tokenization delay
      await act(async () => {
        jest.advanceTimersByTime(50);
      });

      // success state
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(copy.uploadZone.statusSuccess)
      );
    });

    it("confirms double-submit guard — handler called exactly once", async () => {
      mockFetchOk();
      render(<UploadZone />);

      const file = createMockFile();
      fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
        target: { files: [file] },
      });

      const submitBtn = screen.getByRole("button", {
        name: /upload & tokenize invoice/i,
      });

      // Click submit once
      fireEvent.click(submitBtn);

      // Try to click again immediately (should be prevented by disabled state)
      fireEvent.click(submitBtn);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("GROUP 4: Accessibility", () => {
    it("passes axe accessibility check in idle state", async () => {
      const { container } = render(<UploadZone />);
      jest.useRealTimers();
      const results = await axe(container);
      jest.useFakeTimers();
      expect(results).toHaveNoViolations();
    });

    it("passes axe accessibility check after file is selected", async () => {
      const { container } = render(<UploadZone />);

      const file = createMockFile();
      fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
        target: { files: [file] },
      });

      jest.useRealTimers();
      const results = await axe(container);
      jest.useFakeTimers();
      expect(results).toHaveNoViolations();
    });

    it("passes axe accessibility check after file validation error", async () => {
      const { container } = render(<UploadZone />);

      const file = createMockTextFile();
      fireEvent.change(screen.getByLabelText(/select pdf invoice file/i), {
        target: { files: [file] },
      });

      jest.useRealTimers();
      const results = await axe(container);
      jest.useFakeTimers();
      expect(results).toHaveNoViolations();
    });
  });
});

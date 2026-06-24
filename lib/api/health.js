const DEFAULT_TIMEOUT = 8000;

/**
 * Fetches the backend health endpoint with timeout protection.
 *
 * Uses an AbortController class to prevent requests from hanging indefinitely.
 * Returns a normalized health object for connected, degraded,
 * and unreachable backend states.
 *
 * @param {string} apiUrl - Base URL of the backend API.
 * @param {number} [timeout=8000] - Timeout duration in milliseconds.
 *
 * @returns {Promise<{
 *   status: 'connected' | 'degraded' | 'unreachable',
 *   message: string,
 *   details?: any
 * }>}
 */

export async function getHealth(apiUrl, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const res = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
    });

    let payload = null;

    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => null);
    }

    if (!res.ok) {
      return {
        status: "degraded",
        message: `Backend responded with ${res.status}`,
        details: payload,
      };
    }

    return {
      status: "connected",
      message: "Backend is healthy",
      details: payload,
    };
  } catch (err) {
    if (err?.name === "AbortError") {
      return {
        status: "unreachable",
        message: "Health check timed out",
      };
    }

    return {
      status: "unreachable",
      message: err?.message || "Unable to reach backend",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
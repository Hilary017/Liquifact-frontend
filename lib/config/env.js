/**
 * Typed environment-variable loader with build-time validation.
 *
 * Only NEXT_PUBLIC_* variables are exposed — these are inlined by Next.js at
 * build time and are safe to ship to the browser. Never add server-only secrets
 * (e.g. DATABASE_URL, API secret keys) to this file.
 *
 * Call loadEnv() directly in tests (after mutating process.env) to validate
 * specific configurations without re-importing the module.
 * The exported `env` singleton is evaluated once at module load, failing the
 * build immediately if any variable is misconfigured.
 */

const STELLAR_NETWORKS = ['testnet', 'public'];

/**
 * Reads, validates, and returns all NEXT_PUBLIC_* configuration.
 *
 * @returns {{
 *   apiUrl: string,
 *   siteUrl: string,
 *   stellarNetwork: string | undefined
 * }}
 * @throws {Error} Lists every misconfigured variable in a single message.
 */
export function loadEnv() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || undefined;

  const errors = [];

  try {
    new URL(apiUrl);
  } catch {
    errors.push(`NEXT_PUBLIC_API_URL: "${apiUrl}" is not a valid URL`);
  }

  try {
    new URL(siteUrl);
  } catch {
    errors.push(`NEXT_PUBLIC_SITE_URL: "${siteUrl}" is not a valid URL`);
  }

  if (stellarNetwork && !STELLAR_NETWORKS.includes(stellarNetwork)) {
    errors.push(
      `NEXT_PUBLIC_STELLAR_NETWORK: "${stellarNetwork}" must be one of [${STELLAR_NETWORKS.join(', ')}]`,
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `[env] Environment misconfiguration — fix before deploying:\n` +
      errors.map((e) => `  • ${e}`).join('\n'),
    );
  }

  return { apiUrl, siteUrl, stellarNetwork };
}

// Evaluated at module load (= Next.js build time). A misconfigured variable
// surfaces as a build error rather than a silent runtime failure.
export const env = loadEnv();

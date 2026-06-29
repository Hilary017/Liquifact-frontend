import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  getNetworkDetails as freighterGetNetworkDetails,
} from '@stellar/freighter-api';

/**
 * Resolve the Freighter API surface.
 *
 * In the browser, an end-to-end test (Playwright) may inject a mocked provider
 * on `window.__MOCK_FREIGHTER__` exposing `isConnected`, `requestAccess`, and
 * `getNetworkDetails`. When present it is used instead of the real extension so
 * the connect flow can be driven deterministically without a real wallet or
 * any real keys. Production code paths are unaffected when no mock is set.
 *
 * @returns {{ isConnected: Function, requestAccess: Function, getNetworkDetails: Function }}
 */
function getFreighterApi() {
  if (typeof window !== 'undefined' && window.__MOCK_FREIGHTER__) {
    return window.__MOCK_FREIGHTER__;
  }
  return {
    isConnected: freighterIsConnected,
    requestAccess: freighterRequestAccess,
    getNetworkDetails: freighterGetNetworkDetails,
  };
}

/**
 * Checks if the Freighter wallet extension is installed and accessible.
 * @returns {Promise<boolean>} True if installed, false otherwise.
 */
export async function isFreighterConnected() {
  try {
    return await getFreighterApi().isConnected();
  } catch (error) {
    return false;
  }
}

/**
 * Requests connection to the Freighter wallet.
 * Triggers the extension popup if not already connected.
 * @returns {Promise<string>} The connected account's Stellar public key.
 * @throws {Error} If the user rejects the connection or an error occurs.
 */
export async function connectFreighter() {
  try {
    const address = await getFreighterApi().requestAccess();
    if (!address) {
      throw new Error("User rejected connection");
    }
    return address;
  } catch (error) {
    throw new Error(error.message || "User rejected connection");
  }
}

/**
 * Retrieves the current network details from Freighter.
 * @returns {Promise<string>} The network identifier (e.g., 'public' or 'testnet').
 * 
 * Note: The expected network environment variable is NEXT_PUBLIC_STELLAR_NETWORK.
 */
export async function getFreighterNetwork() {
  try {
    const networkDetails = await getFreighterApi().getNetworkDetails();
    if (networkDetails && networkDetails.network) {
      return networkDetails.network.toLowerCase();
    }
    return 'public';
  } catch (error) {
    return 'public';
  }
}

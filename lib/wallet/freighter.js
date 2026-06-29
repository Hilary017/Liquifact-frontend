import { isConnected, requestAccess, getNetworkDetails } from '@stellar/freighter-api';

/**
 * Checks if the Freighter wallet extension is installed and accessible.
 * @returns {Promise<boolean>} True if installed, false otherwise.
 */
export async function isFreighterConnected() {
  try {
    return await isConnected();
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
    const address = await requestAccess();
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
    const networkDetails = await getNetworkDetails();
    if (networkDetails && networkDetails.network) {
      return networkDetails.network.toLowerCase();
    }
    return 'public';
  } catch (error) {
    return 'public';
  }
}

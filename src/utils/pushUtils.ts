// src/utils/pushUtils.ts

/**
 * Converts a VAPID key from a URL-safe base64 string to a Uint8Array.
 * This is a required step before subscribing to push notifications.
 * @param base64String The URL-safe base64 encoded VAPID public key.
 * @returns A Uint8Array representation of the key.
 */
export const urlB64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

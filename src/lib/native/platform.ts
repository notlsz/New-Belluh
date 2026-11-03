// Is Belluh running as the iOS or Android app (Capacitor) or in a browser? The web build behaves exactly as before
// unless this says native. Tests set the platform with setPlatformForTests.
import { Capacitor } from '@capacitor/core';

export type NativePlatform = 'ios' | 'android';

let forced: string | null = null;

/** 'ios' or 'android' inside the app, null in a browser */
export function nativePlatform(): NativePlatform | null {
  const p = forced ?? (Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web');
  return p === 'ios' || p === 'android' ? p : null;
}

export const isNative = (): boolean => nativePlatform() !== null;

/** Tests only: pretend to be the iOS or Android app ('web' or null goes back to detecting) */
export function setPlatformForTests(p: NativePlatform | 'web' | null): void { forced = p; }

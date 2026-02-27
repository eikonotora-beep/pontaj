/**
 * Platform Detection
 * Detects whether app is running in Electron (desktop) or browser (web)
 */

export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Check for __ELECTRON__ flag set by preload script (most reliable)
    if ((window as any).__ELECTRON__ === true) return true;
    // Fallback to old method
    const hasRequire = !!(window as any).require;
    const processType = (window as any).process?.type;
    return hasRequire && processType === 'renderer';
  } catch {
    return false;
  }
}

export function isPlatformElectron(): boolean {
  try {
    return isElectron();
  } catch {
    return false;
  }
}

export function isPlatformWeb(): boolean {
  return !isPlatformElectron();
}

export function getPlatformName(): string {
  return isPlatformElectron() ? 'electron' : 'web';
}

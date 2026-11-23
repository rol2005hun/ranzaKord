export function isPwaApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isGlobalPwa = Boolean((window as unknown as { isPwa?: boolean }).isPwa);
  const isClassPwa =
    typeof document !== 'undefined' && document.documentElement.classList.contains('is-pwa');
  const hasMatchMedia = typeof window.matchMedia === 'function';
  const isStandalone =
    hasMatchMedia &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches);
  const isIosStandalone =
    typeof navigator !== 'undefined' &&
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  return isGlobalPwa || isClassPwa || isStandalone || isIosStandalone;
}

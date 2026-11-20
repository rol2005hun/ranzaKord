import { isTauri } from '@tauri-apps/api/core';

export function isTauriApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    '__TAURI_INTERNALS__' in window ||
    Boolean((window as unknown as { isTauri?: boolean }).isTauri) ||
    window.location.origin.includes('tauri.localhost') ||
    window.location.protocol === 'tauri:' ||
    isTauri()
  );
}

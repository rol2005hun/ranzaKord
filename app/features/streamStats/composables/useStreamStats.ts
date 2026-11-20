import { useStreamStatsStore } from '../stores/useStreamStatsStore';

export function useStreamStats() {
  const store = useStreamStatsStore();

  function formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  function formatDuration(ms: number): string {
    if (ms === 0) return '0 ms';
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function formatDate(iso: string): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function getDurationBadgeVariant(ms: number): 'success' | 'warning' | 'danger' | 'primary' {
    if (ms === 0) return 'primary';
    if (ms < 1000) return 'success';
    if (ms < 2500) return 'warning';
    return 'danger';
  }

  return {
    store,
    formatBytes,
    formatDuration,
    formatDate,
    getDurationBadgeVariant
  };
}

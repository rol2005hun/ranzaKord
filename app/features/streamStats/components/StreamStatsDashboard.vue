<script setup lang="ts">
import { useStreamStats } from '@/features/streamStats/composables/useStreamStats';

const { store, formatBytes, formatDuration, formatDate, getDurationBadgeVariant } =
  useStreamStats();
const toast = useToast();
const { t } = useI18n();

const pageSizes: number[] = [15, 25, 50, 100];

const paginationFrom = computed<number>(() => {
  if (store.pagination.total === 0) return 0;
  return (store.pagination.page - 1) * store.pagination.limit + 1;
});

const paginationTo = computed<number>(() => {
  if (store.pagination.total === 0) return 0;
  return Math.min(store.pagination.page * store.pagination.limit, store.pagination.total);
});

onMounted(() => {
  store.fetchStats();
});

async function handleRefresh(): Promise<void> {
  await store.fetchStats();
}

async function handleClear(): Promise<void> {
  const confirmed = window.confirm(t('streamStats.actions.clearConfirm'));
  if (!confirmed) return;

  const success = await store.clearStats();
  if (success) {
    toast.success(t('streamStats.toast.clearedSuccess'));
  } else {
    toast.danger(t('streamStats.toast.loadError'));
  }
}

function maxAvgDuration(averages: { avgDurationMs: number }[]): number {
  if (averages.length === 0) return 1;
  return Math.max(...averages.map((a) => a.avgDurationMs), 1);
}
</script>

<template>
  <div class="stream-stats">
    <div class="stream-stats__header">
      <div class="stream-stats__title-group">
        <div class="stream-stats__icon-wrapper">
          <AppIcon name="ph:chart-line-up" class="stream-stats__main-icon" />
        </div>
        <div>
          <h1 class="stream-stats__title">
            {{ $t('streamStats.title') || 'Stream Speed Analytics' }}
          </h1>
          <p class="stream-stats__subtitle">{{ $t('streamStats.subtitle') }}</p>
        </div>
      </div>

      <div class="stream-stats__actions">
        <AppButton
          variant="secondary"
          size="md"
          :aria-label="$t('streamStats.actions.refresh')"
          :loading="store.isLoading"
          @click="handleRefresh">
          <AppIcon name="ph:arrows-clockwise" />
          <span>{{ $t('streamStats.actions.refresh') }}</span>
        </AppButton>

        <AppButton
          variant="danger"
          size="md"
          :aria-label="$t('streamStats.actions.clearData')"
          :loading="store.isClearing"
          @click="handleClear">
          <AppIcon name="ph:trash" />
          <span>{{ $t('streamStats.actions.clearData') }}</span>
        </AppButton>
      </div>
    </div>

    <div v-if="store.isLoading && !store.data" class="stream-stats__loader">
      <AppSpinner size="lg" />
    </div>

    <div v-else class="stream-stats__content">
      <div class="stream-stats__kpis">
        <AppCard class="stream-stats__kpi-card">
          <div class="stream-stats__kpi-inner">
            <div class="stream-stats__kpi-icon stream-stats__kpi-icon--total">
              <AppIcon name="ph:waveform" />
            </div>
            <div>
              <div class="stream-stats__kpi-label">{{ $t('streamStats.kpi.totalRequests') }}</div>
              <div class="stream-stats__kpi-value">{{ store.totalRequests }}</div>
            </div>
          </div>
        </AppCard>

        <AppCard class="stream-stats__kpi-card">
          <div class="stream-stats__kpi-inner">
            <div class="stream-stats__kpi-icon stream-stats__kpi-icon--cache">
              <AppIcon name="ph:lightning" />
            </div>
            <div>
              <div class="stream-stats__kpi-label">{{ $t('streamStats.kpi.cacheHitRate') }}</div>
              <div class="stream-stats__kpi-value">{{ store.cacheHitRate }}%</div>
            </div>
          </div>
        </AppCard>

        <AppCard class="stream-stats__kpi-card">
          <div class="stream-stats__kpi-inner">
            <div class="stream-stats__kpi-icon stream-stats__kpi-icon--speed">
              <AppIcon name="ph:timer" />
            </div>
            <div>
              <div class="stream-stats__kpi-label">
                {{ $t('streamStats.kpi.avgResolutionTime') }}
              </div>
              <div class="stream-stats__kpi-value">
                {{ formatDuration(store.avgResolutionTime) }}
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard class="stream-stats__kpi-card">
          <div class="stream-stats__kpi-inner">
            <div class="stream-stats__kpi-icon stream-stats__kpi-icon--fastest">
              <AppIcon name="ph:rocket-launch" />
            </div>
            <div>
              <div class="stream-stats__kpi-label">{{ $t('streamStats.kpi.fastestClient') }}</div>
              <div class="stream-stats__kpi-value">{{ store.fastestClient || '-' }}</div>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="stream-stats__section">
        <h2 class="stream-stats__section-title">{{ $t('streamStats.clients.title') }}</h2>
        <AppCard>
          <div v-if="!store.data?.clientAverages.length" class="stream-stats__empty">
            {{ $t('streamStats.empty') }}
          </div>
          <div v-else class="stream-stats__table-wrapper">
            <table class="stream-stats__table">
              <thead>
                <tr>
                  <th>{{ $t('streamStats.clients.name') }}</th>
                  <th>{{ $t('streamStats.clients.resolvedCount') }}</th>
                  <th>{{ $t('streamStats.clients.avgSpeed') }}</th>
                  <th>{{ $t('streamStats.clients.minSpeed') }}</th>
                  <th>{{ $t('streamStats.clients.maxSpeed') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="client in store.data.clientAverages" :key="client._id">
                  <td class="stream-stats__client-name">
                    <span class="stream-stats__client-badge">{{ client._id }}</span>
                  </td>
                  <td>{{ client.count }}</td>
                  <td>
                    <div class="stream-stats__speed-bar-wrapper">
                      <div class="stream-stats__speed-bar-track">
                        <div
                          class="stream-stats__speed-bar-fill"
                          :class="`stream-stats__speed-bar-fill--${getDurationBadgeVariant(client.avgDurationMs)}`"
                          :style="{
                            width: `${Math.min(100, Math.max(8, (client.avgDurationMs / maxAvgDuration(store.data.clientAverages)) * 100))}%`
                          }" />
                      </div>
                      <span class="stream-stats__speed-text">
                        {{ formatDuration(client.avgDurationMs) }}
                      </span>
                    </div>
                  </td>
                  <td>{{ formatDuration(client.minDurationMs) }}</td>
                  <td>{{ formatDuration(client.maxDurationMs) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <div class="stream-stats__section">
        <h2 class="stream-stats__section-title">{{ $t('streamStats.logs.title') }}</h2>
        <AppCard>
          <div v-if="!store.data?.recentLogs.length" class="stream-stats__empty">
            {{ $t('streamStats.empty') }}
          </div>
          <div v-else class="stream-stats__table-wrapper">
            <table class="stream-stats__table">
              <thead>
                <tr>
                  <th>{{ $t('streamStats.logs.time') }}</th>
                  <th>{{ $t('streamStats.logs.videoId') }}</th>
                  <th>{{ $t('streamStats.logs.client') }}</th>
                  <th>{{ $t('streamStats.logs.duration') }}</th>
                  <th>{{ $t('streamStats.logs.status') }}</th>
                  <th>{{ $t('streamStats.logs.deciphered') }}</th>
                  <th>{{ $t('streamStats.logs.size') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in store.data.recentLogs" :key="log._id">
                  <td class="stream-stats__muted">{{ formatDate(log.createdAt) }}</td>
                  <td>
                    <a
                      :href="`https://youtu.be/${log.videoId}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="stream-stats__video-link">
                      <code>{{ log.videoId }}</code>
                      <AppIcon name="ph:arrow-square-out" />
                    </a>
                  </td>
                  <td>
                    <span class="stream-stats__client-badge">{{ log.client }}</span>
                  </td>
                  <td>
                    <AppBadge :variant="getDurationBadgeVariant(log.durationMs)" size="sm">
                      {{ formatDuration(log.durationMs) }}
                    </AppBadge>
                  </td>
                  <td>
                    <AppBadge
                      :variant="
                        log.status === 'hit'
                          ? 'primary'
                          : log.status === 'resolved'
                            ? 'success'
                            : 'danger'
                      "
                      size="sm">
                      {{ $t(`streamStats.status.${log.status}`) }}
                    </AppBadge>
                  </td>
                  <td>
                    <AppBadge v-if="log.isDeciphered" variant="warning" size="sm">
                      {{ $t('streamStats.logs.deciphered') }}
                    </AppBadge>
                    <span v-else class="stream-stats__muted">-</span>
                  </td>
                  <td class="stream-stats__muted">
                    {{ formatBytes(log.contentLength) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="store.pagination.total > 0" class="stream-stats__pagination">
            <div class="stream-stats__pagination-info">
              <span>
                {{
                  $t('streamStats.pagination.showing', {
                    from: paginationFrom,
                    to: paginationTo,
                    total: store.pagination.total
                  })
                }}
              </span>

              <div class="stream-stats__page-size">
                <span class="stream-stats__page-size-label">
                  {{ $t('streamStats.pagination.perPage') }}
                </span>
                <div class="stream-stats__page-size-options">
                  <button
                    v-for="size in pageSizes"
                    :key="size"
                    type="button"
                    class="stream-stats__page-size-btn"
                    :class="{ 'stream-stats__page-size-btn--active': store.itemsPerPage === size }"
                    @click="store.setLimit(size)">
                    {{ size }}
                  </button>
                </div>
              </div>
            </div>

            <div class="stream-stats__pagination-nav">
              <button
                type="button"
                class="stream-stats__nav-btn"
                :disabled="store.currentPage <= 1 || store.isLoading"
                :aria-label="$t('streamStats.pagination.first')"
                @click="store.setPage(1)">
                <AppIcon name="ph:caret-double-left" />
              </button>

              <button
                type="button"
                class="stream-stats__nav-btn"
                :disabled="store.currentPage <= 1 || store.isLoading"
                :aria-label="$t('streamStats.pagination.prev')"
                @click="store.setPage(store.currentPage - 1)">
                <AppIcon name="ph:caret-left" />
              </button>

              <span class="stream-stats__page-indicator">
                {{ store.currentPage }} / {{ store.pagination.totalPages }}
              </span>

              <button
                type="button"
                class="stream-stats__nav-btn"
                :disabled="store.currentPage >= store.pagination.totalPages || store.isLoading"
                :aria-label="$t('streamStats.pagination.next')"
                @click="store.setPage(store.currentPage + 1)">
                <AppIcon name="ph:caret-right" />
              </button>

              <button
                type="button"
                class="stream-stats__nav-btn"
                :disabled="store.currentPage >= store.pagination.totalPages || store.isLoading"
                :aria-label="$t('streamStats.pagination.last')"
                @click="store.setPage(store.pagination.totalPages)">
                <AppIcon name="ph:caret-double-right" />
              </button>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stream-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  &__title-group {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-lg);
    background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.15);
    color: var(--color-primary);
  }

  &__main-icon {
    font-size: 1.75rem;
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: var(--space-1) 0 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__loader {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-4);
  }

  &__kpi-card {
    transition: transform var(--transition-fast);
  }

  &__kpi-inner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__kpi-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-md);
    font-size: 1.5rem;

    &--total {
      background: hsl(210 100% 50% / 0.15);
      color: hsl(210 100% 60%);
    }

    &--cache {
      background: hsl(150 100% 40% / 0.15);
      color: hsl(150 100% 45%);
    }

    &--speed {
      background: hsl(40 100% 50% / 0.15);
      color: hsl(40 100% 55%);
    }

    &--fastest {
      background: hsl(280 100% 60% / 0.15);
      color: hsl(280 100% 70%);
    }
  }

  &__kpi-label {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__kpi-value {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-top: var(--space-1);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__table-wrapper {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);

    th {
      text-align: left;
      padding: var(--space-3) var(--space-4);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-semibold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--color-border);
    }

    td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      vertical-align: middle;
    }

    tbody tr:hover {
      background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.04);
    }
  }

  &__client-badge {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    font-family: monospace;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
  }

  &__speed-bar-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 180px;
  }

  &__speed-bar-track {
    flex: 1;
    height: 8px;
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__speed-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);

    &--primary {
      background: var(--color-primary);
    }

    &--success {
      background: var(--color-success);
    }

    &--warning {
      background: var(--color-warning);
    }

    &--danger {
      background: var(--color-danger);
    }
  }

  &__speed-text {
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-xs);
    min-width: 60px;
  }

  &__video-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    code {
      font-size: var(--text-xs);
    }
  }

  &__muted {
    color: var(--color-text-secondary);
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  &__pagination-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__page-size {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__page-size-options {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__page-size-btn {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover:not(&--active) {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.15);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__pagination-nav {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      border-color: var(--color-border-hover);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__page-indicator {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    padding: 0 var(--space-2);
  }
}
</style>

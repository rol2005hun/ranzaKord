<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';

const { updateInfo, installUpdate, dismissUpdate } = useAppUpdate();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const config = useRuntimeConfig();

const isExternalUpdate = computed(() => !!updateInfo.value.externalDownloadUrl);
const isAndroid = import.meta.client && /android/i.test(navigator.userAgent);

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function close() {
  if (!updateInfo.value.isMandatory) {
    emit('update:modelValue', false);
    dismissUpdate();
  }
}

async function downloadExternal() {
  const url = updateInfo.value.externalDownloadUrl;
  if (!url) return;
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank');
  }
}
</script>

<template>
  <AppModal
    :model-value="props.modelValue"
    :title="$t('updater.title')"
    :persistent="updateInfo.isMandatory"
    @update:model-value="close">
    <div class="update-modal">
      <div v-if="updateInfo.isMandatory" class="update-modal__mandatory-badge">
        <AppIcon name="ph:warning-circle" />
        <span>{{ $t('updater.mandatory') }}</span>
      </div>

      <p
        v-if="
          updateInfo.name &&
          updateInfo.name !== updateInfo.version &&
          updateInfo.name !== `v${updateInfo.version}`
        "
        class="update-modal__release-name">
        {{ updateInfo.name }}
      </p>

      <h3 class="update-modal__version">
        <span v-if="config.public.appVersion" class="update-modal__version-old">
          v{{ config.public.appVersion }}
        </span>
        <AppIcon
          v-if="config.public.appVersion"
          name="ph:arrow-right-bold"
          class="update-modal__version-arrow" />
        <span class="update-modal__version-new">v{{ updateInfo.version }}</span>
      </h3>

      <p v-if="updateInfo.date && !updateInfo.downloadSize" class="update-modal__date">
        {{ new Date(updateInfo.date).toLocaleDateString() }}
      </p>

      <div class="update-modal__notes">
        <h4>{{ $t('updater.releaseNotes') }}:</h4>
        <pre v-if="updateInfo.body">{{ updateInfo.body }}</pre>
        <p v-else class="update-modal__notes-empty">
          {{
            $t(
              'updater.noReleaseNotes',
              'Nincsenek megadva kiadási megjegyzések ehhez a verzióhoz.'
            )
          }}
        </p>
      </div>

      <div v-if="updateInfo.downloadSize || updateInfo.assetCount" class="update-modal__meta">
        <div v-if="updateInfo.downloadSize" class="update-modal__meta-item">
          <AppIcon name="ph:hard-drive" class="update-modal__meta-icon" />
          <span class="update-modal__meta-label">
            {{ $t('updater.downloadSize', 'Letöltési méret') }}:
          </span>
          <span class="update-modal__meta-value">{{ formatBytes(updateInfo.downloadSize) }}</span>
        </div>
        <div v-if="updateInfo.assetCount" class="update-modal__meta-item">
          <AppIcon name="ph:files" class="update-modal__meta-icon" />
          <span class="update-modal__meta-label">
            {{ $t('updater.fileCount', 'Fájlok száma') }}:
          </span>
          <span class="update-modal__meta-value">{{ updateInfo.assetCount }}</span>
        </div>
        <div v-if="updateInfo.date" class="update-modal__meta-item">
          <AppIcon name="ph:calendar" class="update-modal__meta-icon" />
          <span class="update-modal__meta-label">{{ $t('updater.releasedOn', 'Megjelent') }}:</span>
          <span class="update-modal__meta-value">
            {{ new Date(updateInfo.date).toLocaleDateString() }}
          </span>
        </div>
      </div>

      <div v-if="updateInfo.error" class="update-modal__error">
        {{ updateInfo.error }}
      </div>

      <div v-if="updateInfo.downloading" class="update-modal__progress-container">
        <div class="update-modal__progress-label">
          <AppIcon name="ph:arrow-circle-down" class="update-modal__progress-icon" />
          <span>
            {{ $t('updater.downloading') }}...
            <span v-if="updateInfo.total > 0">
              {{ Math.round((updateInfo.progress / updateInfo.total) * 100) }}% ({{
                formatBytes(updateInfo.progress)
              }}
              / {{ formatBytes(updateInfo.total) }})
            </span>
          </span>
        </div>
        <div class="update-modal__progress-bar">
          <div
            class="update-modal__progress-fill"
            :style="{
              width:
                updateInfo.total > 0 ? `${(updateInfo.progress / updateInfo.total) * 100}%` : '100%'
            }"></div>
        </div>
      </div>

      <div
        v-if="updateInfo.readyToInstall && !updateInfo.downloading"
        class="update-modal__ready-badge">
        <AppIcon name="ph:check-circle" />
        <span>{{ $t('updater.readyToInstall', 'Letöltés kész! Újraindítással frissül.') }}</span>
      </div>
    </div>

    <template #footer>
      <AppButton v-if="!updateInfo.isMandatory" variant="ghost" @click="close">
        {{ $t('updater.skip') }}
      </AppButton>

      <AppButton v-if="isExternalUpdate" variant="primary" @click="downloadExternal">
        <AppIcon name="ph:download-simple" />
        {{
          isAndroid
            ? $t('updater.downloadApk', 'Letöltés (APK)')
            : $t('updater.openInBrowser', 'Letöltés böngészőből')
        }}
      </AppButton>

      <AppButton
        v-else
        variant="primary"
        :loading="updateInfo.downloading"
        :disabled="updateInfo.downloading"
        @click="installUpdate">
        <AppIcon :name="updateInfo.readyToInstall ? 'ph:arrow-clockwise' : 'ph:download-simple'" />
        {{
          updateInfo.readyToInstall
            ? $t('updater.restartNow', 'Újraindítás most')
            : updateInfo.downloading
              ? $t('updater.installing')
              : $t('updater.installAndRestart')
        }}
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.update-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__mandatory-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
    color: var(--color-danger);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    align-self: flex-start;
  }

  &__version {
    font-size: var(--text-xl);
    margin: 0;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__version-old {
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
  }

  &__version-arrow {
    color: var(--color-primary);
    opacity: 0.8;
  }

  &__version-new {
    font-weight: var(--font-weight-bold);
  }

  &__release-name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__date {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    background-color: var(--color-surface-hover);
    padding: var(--space-3);
    border-radius: var(--radius-md);
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  &__meta-icon {
    color: var(--color-primary);
    opacity: 0.8;
    flex-shrink: 0;
  }

  &__meta-label {
    color: var(--color-text-secondary);
  }

  &__meta-value {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    margin-left: auto;
  }

  &__notes {
    background-color: var(--color-surface-hover);
    padding: var(--space-3);
    border-radius: var(--radius-md);

    h4 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    pre {
      margin: 0;
      font-family: inherit;
      white-space: pre-wrap;
      font-size: var(--text-sm);
      color: var(--color-text-primary);
    }

    &-empty {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-text-muted, #666);
      font-style: italic;
    }
  }

  &__error {
    color: var(--color-danger);
    font-size: var(--text-sm);
    padding: var(--space-3);
    background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
    border-radius: var(--radius-md);
  }

  &__progress-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  &__progress-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__progress-icon {
    color: var(--color-primary);
    animation: spin 1.5s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &__progress-bar {
    height: 6px;
    background-color: var(--color-surface-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    transition: width 0.3s ease;
  }

  &__ready-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background-color: color-mix(in srgb, var(--color-success, #22c55e) 15%, transparent);
    color: var(--color-success, #22c55e);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    align-self: flex-start;
  }
}
</style>

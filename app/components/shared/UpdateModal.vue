<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';

const { updateInfo, installUpdate, dismissUpdate } = useAppUpdate();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isMobileUpdate = computed(() => !!updateInfo.value.apkDownloadUrl);

function close() {
  if (!updateInfo.value.isMandatory && !updateInfo.value.downloading) {
    emit('update:modelValue', false);
    dismissUpdate();
  }
}

async function downloadApk() {
  const url = updateInfo.value.apkDownloadUrl;
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
    :persistent="updateInfo.isMandatory || updateInfo.downloading"
    @update:model-value="close">
    <div class="update-modal">
      <div v-if="updateInfo.isMandatory" class="update-modal__mandatory-badge">
        <AppIcon name="ph:warning-circle" />
        <span>{{ $t('updater.mandatory') }}</span>
      </div>

      <h3 class="update-modal__version">
        {{ $t('updater.newVersion') }}: v{{ updateInfo.version }}
      </h3>

      <p v-if="updateInfo.date" class="update-modal__date">
        {{ new Date(updateInfo.date).toLocaleDateString() }}
      </p>

      <div v-if="updateInfo.body" class="update-modal__notes">
        <h4>{{ $t('updater.releaseNotes') }}:</h4>
        <pre>{{ updateInfo.body }}</pre>
      </div>

      <div v-if="updateInfo.error" class="update-modal__error">
        {{ updateInfo.error }}
      </div>

      <div v-if="updateInfo.downloading" class="update-modal__progress-container">
        <div class="update-modal__progress-text">
          {{ $t('updater.downloading') }}...
          <span v-if="updateInfo.total > 0">
            {{ Math.round((updateInfo.progress / updateInfo.total) * 100) }}% ({{
              (updateInfo.progress / 1024 / 1024).toFixed(1)
            }}
            MB / {{ (updateInfo.total / 1024 / 1024).toFixed(1) }} MB)
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
    </div>

    <template #footer>
      <AppButton
        v-if="!updateInfo.isMandatory && !updateInfo.downloading"
        variant="ghost"
        @click="close">
        {{ $t('updater.skip') }}
      </AppButton>

      <AppButton v-if="isMobileUpdate" variant="primary" @click="downloadApk">
        <AppIcon name="ph:download-simple" />
        {{ $t('updater.downloadApk') }}
      </AppButton>

      <AppButton
        v-else
        variant="primary"
        :loading="updateInfo.downloading"
        :disabled="updateInfo.downloading"
        @click="installUpdate">
        <AppIcon name="ph:download-simple" />
        {{ updateInfo.downloading ? $t('updater.installing') : $t('updater.installAndRestart') }}
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
  }

  &__date {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
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

  &__progress-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    justify-content: space-between;
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
    transition: width 0.2s ease;
  }
}
</style>

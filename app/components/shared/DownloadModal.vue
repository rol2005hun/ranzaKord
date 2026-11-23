<script setup lang="ts">
interface Props {
  modelValue: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { isInstalled, promptInstall } = usePwaInstall();
const isInstalling = ref(false);
const showManualInstructions = ref(false);

async function handleInstallPwa(): Promise<void> {
  if (isInstalling.value) return;
  isInstalling.value = true;
  try {
    const result = await promptInstall();
    if (result === 'unsupported') {
      showManualInstructions.value = true;
    }
  } finally {
    isInstalling.value = false;
  }
}

function handleOpenReleases(): void {
  window.open('https://github.com/rol2005hun/ranzaKord/releases/latest', '_blank');
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="$t('core.downloadModal.title')"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)">
    <div class="download-modal">
      <p class="download-modal__subtitle">
        {{ $t('core.downloadModal.subtitle') }}
      </p>

      <div class="download-modal__grid">
        <div class="download-card download-card--pwa">
          <div class="download-card__header">
            <div class="download-card__icon-wrap">
              <AppIcon name="ph:browsers-bold" class="download-card__icon" />
            </div>
            <AppBadge variant="primary" size="sm">
              {{ $t('core.downloadModal.webBadge') }}
            </AppBadge>
          </div>

          <h3 class="download-card__title">
            {{ $t('core.downloadModal.webTitle') }}
          </h3>
          <p class="download-card__description">
            {{ $t('core.downloadModal.webDesc') }}
          </p>

          <div class="download-card__action">
            <AppButton v-if="isInstalled" variant="secondary" disabled class="download-card__btn">
              <AppIcon name="ph:check-circle-bold" />
              <span>{{ $t('core.downloadModal.webInstalledBtn') }}</span>
            </AppButton>
            <AppButton
              v-else
              variant="primary"
              :loading="isInstalling"
              class="download-card__btn"
              @click="handleInstallPwa">
              <AppIcon name="ph:download-simple-bold" />
              <span>{{ $t('core.downloadModal.webInstallBtn') }}</span>
            </AppButton>
          </div>
        </div>

        <div class="download-card download-card--native">
          <div class="download-card__header">
            <div class="download-card__icon-wrap">
              <AppIcon name="ph:desktop-bold" class="download-card__icon" />
            </div>
            <AppBadge variant="neutral" size="sm">
              {{ $t('core.downloadModal.nativeBadge') }}
            </AppBadge>
          </div>

          <h3 class="download-card__title">
            {{ $t('core.downloadModal.nativeTitle') }}
          </h3>
          <p class="download-card__description">
            {{ $t('core.downloadModal.nativeDesc') }}
          </p>

          <div class="download-card__action">
            <AppButton variant="secondary" class="download-card__btn" @click="handleOpenReleases">
              <span>{{ $t('core.downloadModal.nativeDownloadBtn') }}</span>
              <AppIcon name="ph:arrow-square-out-bold" />
            </AppButton>
          </div>
        </div>
      </div>

      <div class="download-modal__help">
        <button
          type="button"
          class="download-modal__help-toggle"
          @click="showManualInstructions = !showManualInstructions">
          <AppIcon name="ph:info-bold" />
          <span>{{ $t('core.downloadModal.webHowToInstall') }}</span>
          <AppIcon :name="showManualInstructions ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" />
        </button>

        <div v-if="showManualInstructions" class="download-modal__help-box">
          <div class="download-modal__help-item">
            <AppIcon name="ph:device-mobile-camera-bold" />
            <span>{{ $t('core.downloadModal.webIosHint') }}</span>
          </div>
          <div class="download-modal__help-item">
            <AppIcon name="ph:laptop-bold" />
            <span>{{ $t('core.downloadModal.webDesktopHint') }}</span>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.download-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__help {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-top: var(--space-1);
  }

  &__help-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-primary);
    }
  }

  &__help-box {
    width: 100%;
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__help-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);

    .app-icon {
      flex-shrink: 0;
      margin-top: 2px;
      font-size: var(--text-sm);
      color: var(--color-primary);
    }
  }
}

.download-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    border-color: var(--color-border-hover);
    background-color: var(--color-surface-hover);
  }

  &--pwa {
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
    border-radius: var(--radius-md);
  }

  &__icon {
    font-size: var(--text-xl);
  }

  &__title {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__description {
    margin: 0 0 var(--space-5) 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    flex: 1;
  }

  &__action {
    margin-top: auto;
  }

  &__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

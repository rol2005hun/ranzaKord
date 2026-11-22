<script setup lang="ts">
import type {
  YouTubeDeviceCodeResponse,
  YouTubeStatusResponse
} from '@/features/settings/types/settings.types';

const { t } = useI18n();
const toast = useToast();

const rawCookie = ref('');
const isSavingCookie = ref(false);

const statusData = ref<YouTubeStatusResponse | null>(null);
const isLoadingStatus = ref(true);

const isGeneratingCode = ref(false);
const deviceCode = ref('');
const verificationUrl = ref('');
const isAuthPending = ref(false);
const isAuthSuccess = ref(false);
const authError = ref('');
const isCopied = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchStatus(): Promise<void> {
  isLoadingStatus.value = true;
  try {
    const res = await $fetch<YouTubeStatusResponse>(useApiUrl('/api/admin/youtube/status'));
    statusData.value = res;
    if (res.deviceAuth?.status === 'success') {
      isAuthSuccess.value = true;
      isAuthPending.value = false;
      stopPolling();
    }
  } catch {
    void 0;
  } finally {
    isLoadingStatus.value = false;
  }
}

async function onSaveCookie(): Promise<void> {
  if (!rawCookie.value.trim()) return;
  isSavingCookie.value = true;

  try {
    await $fetch(useApiUrl('/api/admin/youtube/cookie'), {
      method: 'POST',
      body: { raw: rawCookie.value.trim() }
    });
    toast.success(t('settings.youtube.cookie.success'));
    rawCookie.value = '';
    await fetchStatus();
  } catch {
    toast.danger(t('settings.youtube.cookie.error'));
  } finally {
    isSavingCookie.value = false;
  }
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function onStartDeviceAuth(): Promise<void> {
  isGeneratingCode.value = true;
  authError.value = '';
  isAuthSuccess.value = false;

  try {
    const res = await $fetch<YouTubeDeviceCodeResponse>(
      useApiUrl('/api/admin/youtube/device-code'),
      {
        method: 'POST'
      }
    );

    if (res.userCode && res.verificationUrl) {
      deviceCode.value = res.userCode;
      verificationUrl.value = res.verificationUrl;
      isAuthPending.value = true;

      stopPolling();
      pollTimer = setInterval(async () => {
        await fetchStatus();
      }, 3000);
    } else if (res.error) {
      authError.value = res.error;
    }
  } catch (err) {
    authError.value = String(err);
  } finally {
    isGeneratingCode.value = false;
  }
}

async function copyCode(): Promise<void> {
  if (!deviceCode.value) return;
  try {
    await navigator.clipboard.writeText(deviceCode.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch {
    void 0;
  }
}

onMounted(() => {
  fetchStatus();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="youtube-settings">
    <div class="settings-panel__header">
      <h2 class="settings-panel__title">
        <AppIcon name="ph:youtube-logo-duotone" />
        {{ t('settings.youtube.title') }}
      </h2>
      <p class="settings-panel__description">{{ t('settings.youtube.description') }}</p>
    </div>

    <div class="settings-panel__content">
      <AppSettingsSection :title="t('settings.youtube.status.title')">
        <div class="status-grid">
          <div class="status-card">
            <div class="status-card__header">
              <div class="status-card__icon-box">
                <AppIcon name="ph:cookie-duotone" />
              </div>
              <span class="status-card__label">{{ t('settings.youtube.status.cookies') }}</span>
            </div>
            <div class="status-card__content">
              <AppSkeleton
                v-if="!statusData"
                width="88px"
                height="24px"
                border-radius="var(--radius-full)" />
              <AppBadge
                v-else
                :variant="statusData.hasCookies ? 'success' : 'warning'"
                size="sm"
                class="status-card__badge">
                <AppIcon
                  :name="
                    statusData.hasCookies ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                  " />
                {{
                  statusData.hasCookies
                    ? t('settings.youtube.status.active')
                    : t('settings.youtube.status.missing')
                }}
              </AppBadge>
            </div>
          </div>

          <div class="status-card">
            <div class="status-card__header">
              <div class="status-card__icon-box">
                <AppIcon name="ph:shield-check-duotone" />
              </div>
              <span class="status-card__label">{{ t('settings.youtube.status.poToken') }}</span>
            </div>
            <div class="status-card__content">
              <AppSkeleton
                v-if="!statusData"
                width="88px"
                height="24px"
                border-radius="var(--radius-full)" />
              <AppBadge
                v-else
                :variant="statusData.hasPoToken ? 'success' : 'warning'"
                size="sm"
                class="status-card__badge">
                <AppIcon
                  :name="
                    statusData.hasPoToken ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                  " />
                {{
                  statusData.hasPoToken
                    ? t('settings.youtube.status.active')
                    : t('settings.youtube.status.missing')
                }}
              </AppBadge>
            </div>
          </div>

          <div class="status-card">
            <div class="status-card__header">
              <div class="status-card__icon-box">
                <AppIcon name="ph:identification-card-duotone" />
              </div>
              <span class="status-card__label">{{ t('settings.youtube.status.visitorData') }}</span>
            </div>
            <div class="status-card__content">
              <AppSkeleton
                v-if="!statusData"
                width="88px"
                height="24px"
                border-radius="var(--radius-full)" />
              <AppBadge
                v-else
                :variant="statusData.hasVisitorData ? 'success' : 'warning'"
                size="sm"
                class="status-card__badge">
                <AppIcon
                  :name="
                    statusData.hasVisitorData ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                  " />
                {{
                  statusData.hasVisitorData
                    ? t('settings.youtube.status.active')
                    : t('settings.youtube.status.missing')
                }}
              </AppBadge>
            </div>
          </div>

          <div class="status-card">
            <div class="status-card__header">
              <div class="status-card__icon-box">
                <AppIcon name="ph:user-circle-gear-duotone" />
              </div>
              <span class="status-card__label">{{ t('settings.youtube.status.oauth') }}</span>
            </div>
            <div class="status-card__content">
              <AppSkeleton
                v-if="!statusData"
                width="88px"
                height="24px"
                border-radius="var(--radius-full)" />
              <AppBadge
                v-else
                :variant="statusData.hasOauth ? 'success' : 'warning'"
                size="sm"
                class="status-card__badge">
                <AppIcon
                  :name="statusData.hasOauth ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'" />
                {{
                  statusData.hasOauth
                    ? t('settings.youtube.status.active')
                    : t('settings.youtube.status.missing')
                }}
              </AppBadge>
            </div>
          </div>
        </div>

        <div class="status-actions">
          <AppButton variant="secondary" size="sm" :loading="isLoadingStatus" @click="fetchStatus">
            <AppIcon name="ph:arrows-clockwise-bold" />
            {{ t('settings.youtube.status.refresh') }}
          </AppButton>
        </div>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.youtube.cookie.title')">
        <p class="section-desc">{{ t('settings.youtube.cookie.description') }}</p>
        <div class="cookie-panel">
          <textarea
            v-model="rawCookie"
            class="cookie-textarea"
            rows="5"
            :placeholder="t('settings.youtube.cookie.placeholder')" />
          <div class="cookie-footer">
            <AppButton
              variant="primary"
              size="md"
              :loading="isSavingCookie"
              :disabled="!rawCookie.trim()"
              @click="onSaveCookie">
              <AppIcon name="ph:floppy-disk-bold" />
              {{
                isSavingCookie
                  ? t('settings.youtube.cookie.saving')
                  : t('settings.youtube.cookie.save')
              }}
            </AppButton>
          </div>
        </div>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.youtube.device.title')">
        <p class="section-desc">{{ t('settings.youtube.device.description') }}</p>

        <div v-if="!isAuthPending && !isAuthSuccess" class="device-init">
          <AppButton
            variant="secondary"
            size="md"
            :loading="isGeneratingCode"
            @click="onStartDeviceAuth">
            <AppIcon name="ph:key-bold" />
            {{ t('settings.youtube.device.start') }}
          </AppButton>
        </div>

        <div v-if="isAuthPending" class="device-flow">
          <p class="device-instruction">{{ t('settings.youtube.device.instruction') }}</p>

          <div class="device-code-box">
            <div class="device-code-value">
              <span class="device-code-text">{{ deviceCode }}</span>
            </div>
            <AppButton variant="secondary" size="md" @click="copyCode">
              <AppIcon :name="isCopied ? 'ph:check-bold' : 'ph:copy-bold'" />
              {{
                isCopied
                  ? t('settings.youtube.device.copied')
                  : t('settings.youtube.device.copyCode')
              }}
            </AppButton>
          </div>

          <div class="device-actions">
            <AppButton
              v-if="verificationUrl"
              :href="verificationUrl"
              variant="primary"
              size="md"
              target="_blank"
              rel="noopener noreferrer">
              <AppIcon name="ph:arrow-square-out-bold" />
              {{ t('settings.youtube.device.openLink') }}
            </AppButton>
          </div>

          <div class="device-waiting">
            <AppSpinner size="sm" />
            <span>{{ t('settings.youtube.device.waiting') }}</span>
          </div>
        </div>

        <div v-if="isAuthSuccess" class="device-card device-card--success">
          <AppIcon name="ph:check-circle-fill" />
          <span>{{ t('settings.youtube.device.success') }}</span>
        </div>

        <div v-if="authError" class="device-card device-card--error">
          <AppIcon name="ph:warning-circle-fill" />
          <span>{{ authError }}</span>
        </div>
      </AppSettingsSection>
    </div>
  </div>
</template>

<style scoped lang="scss">
.youtube-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-panel {
  &__header {
    margin-bottom: var(--space-4);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-2);
  }

  &__description {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-3);

  @media (min-width: 680px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    transform var(--transition-base);

  &:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover, rgba(255, 255, 255, 0.15));
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    background: var(--color-surface-raised, rgba(255, 255, 255, 0.05));
    color: var(--color-primary);
    font-size: var(--text-base);
    flex-shrink: 0;
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__content {
    display: flex;
    align-items: center;
    min-height: 24px;
  }

  &__badge {
    gap: var(--space-1);
  }
}

.status-actions {
  display: flex;
  justify-content: flex-end;
}

.section-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.cookie-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.cookie-textarea {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: monospace;
  font-size: var(--text-xs);
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-glow, rgba(99, 102, 241, 0.25));
  }
}

.cookie-footer {
  display: flex;
  justify-content: flex-end;
}

.device-init {
  display: flex;
}

.device-flow {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.device-instruction {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.device-code-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.device-code-value {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-5);
  background: var(--color-background);
  border: 1.5px dashed var(--color-primary);
  border-radius: var(--radius-md);
}

.device-code-text {
  font-family: monospace;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.18em;
  color: var(--color-primary);
}

.device-actions {
  display: flex;
}

.device-waiting {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.device-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);

  &--success {
    background: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid var(--color-success);
  }

  &--error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }
}
</style>

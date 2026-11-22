<script setup lang="ts">
interface YouTubeStatusResponse {
  hasCookies: boolean;
  hasPoToken: boolean;
  hasVisitorData: boolean;
  hasOauth: boolean;
  deviceAuth: {
    status: 'idle' | 'pending' | 'success' | 'error';
    userCode?: string;
    verificationUrl?: string;
    error?: string;
  };
}

const { t } = useI18n();
const toast = useToast();

const rawCookie = ref('');
const isSavingCookie = ref(false);

const statusData = ref<YouTubeStatusResponse | null>(null);
const isLoadingStatus = ref(false);

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
    const res = await $fetch<{
      status: string;
      userCode?: string;
      verificationUrl?: string;
      error?: string;
    }>(useApiUrl('/api/admin/youtube/device-code'), {
      method: 'POST'
    });

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
          <div class="status-item">
            <span class="status-item__label">{{ t('settings.youtube.status.cookies') }}</span>
            <span
              class="status-item__badge"
              :class="
                statusData?.hasCookies
                  ? 'status-item__badge--active'
                  : 'status-item__badge--missing'
              ">
              <AppIcon
                :name="
                  statusData?.hasCookies ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                " />
              {{
                statusData?.hasCookies
                  ? t('settings.youtube.status.active')
                  : t('settings.youtube.status.missing')
              }}
            </span>
          </div>

          <div class="status-item">
            <span class="status-item__label">{{ t('settings.youtube.status.poToken') }}</span>
            <span
              class="status-item__badge"
              :class="
                statusData?.hasPoToken
                  ? 'status-item__badge--active'
                  : 'status-item__badge--missing'
              ">
              <AppIcon
                :name="
                  statusData?.hasPoToken ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                " />
              {{
                statusData?.hasPoToken
                  ? t('settings.youtube.status.active')
                  : t('settings.youtube.status.missing')
              }}
            </span>
          </div>

          <div class="status-item">
            <span class="status-item__label">{{ t('settings.youtube.status.visitorData') }}</span>
            <span
              class="status-item__badge"
              :class="
                statusData?.hasVisitorData
                  ? 'status-item__badge--active'
                  : 'status-item__badge--missing'
              ">
              <AppIcon
                :name="
                  statusData?.hasVisitorData ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'
                " />
              {{
                statusData?.hasVisitorData
                  ? t('settings.youtube.status.active')
                  : t('settings.youtube.status.missing')
              }}
            </span>
          </div>

          <div class="status-item">
            <span class="status-item__label">{{ t('settings.youtube.status.oauth') }}</span>
            <span
              class="status-item__badge"
              :class="
                statusData?.hasOauth ? 'status-item__badge--active' : 'status-item__badge--missing'
              ">
              <AppIcon
                :name="statusData?.hasOauth ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'" />
              {{
                statusData?.hasOauth
                  ? t('settings.youtube.status.active')
                  : t('settings.youtube.status.missing')
              }}
            </span>
          </div>
        </div>

        <div class="status-actions">
          <button class="status-refresh-btn" :disabled="isLoadingStatus" @click="fetchStatus">
            <AppIcon
              name="ph:arrows-clockwise-bold"
              :class="{ 'status-refresh-btn--spin': isLoadingStatus }" />
            {{ t('settings.youtube.status.refresh') }}
          </button>
        </div>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.youtube.cookie.title')">
        <p class="cookie-desc">{{ t('settings.youtube.cookie.description') }}</p>
        <textarea
          v-model="rawCookie"
          class="cookie-textarea"
          rows="5"
          :placeholder="t('settings.youtube.cookie.placeholder')" />
        <div class="cookie-actions">
          <button
            class="cookie-save-btn"
            :disabled="isSavingCookie || !rawCookie.trim()"
            @click="onSaveCookie">
            <AppSpinner v-if="isSavingCookie" size="sm" />
            <AppIcon v-else name="ph:floppy-disk-bold" />
            {{
              isSavingCookie
                ? t('settings.youtube.cookie.saving')
                : t('settings.youtube.cookie.save')
            }}
          </button>
        </div>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.youtube.device.title')">
        <p class="device-desc">{{ t('settings.youtube.device.description') }}</p>

        <div v-if="!isAuthPending && !isAuthSuccess" class="device-init">
          <button class="device-start-btn" :disabled="isGeneratingCode" @click="onStartDeviceAuth">
            <AppSpinner v-if="isGeneratingCode" size="sm" />
            <AppIcon v-else name="ph:key-bold" />
            {{ t('settings.youtube.device.start') }}
          </button>
        </div>

        <div v-if="isAuthPending" class="device-flow">
          <p class="device-instruction">{{ t('settings.youtube.device.instruction') }}</p>
          <div class="device-code-display">
            <span class="device-code-text">{{ deviceCode }}</span>
            <button class="device-copy-btn" @click="copyCode">
              <AppIcon :name="isCopied ? 'ph:check-bold' : 'ph:copy-bold'" />
              {{
                isCopied
                  ? t('settings.youtube.device.copied')
                  : t('settings.youtube.device.copyCode')
              }}
            </button>
          </div>

          <div class="device-links">
            <a
              v-if="verificationUrl"
              :href="verificationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="device-open-btn">
              <AppIcon name="ph:arrow-square-out-bold" />
              {{ t('settings.youtube.device.openLink') }} ({{ verificationUrl }})
            </a>
          </div>

          <div class="device-waiting">
            <AppSpinner size="sm" />
            <span>{{ t('settings.youtube.device.waiting') }}</span>
          </div>
        </div>

        <div v-if="isAuthSuccess" class="device-success">
          <AppIcon name="ph:check-circle-fill" />
          <span>{{ t('settings.youtube.device.success') }}</span>
        </div>

        <div v-if="authError" class="device-error">
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

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  &__label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);

    &--active {
      color: #10b981;
    }

    &--missing {
      color: #f59e0b;
    }
  }
}

.status-actions {
  display: flex;
  justify-content: flex-end;
}

.status-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    background: var(--color-surface-hover);
  }

  &--spin svg {
    animation: spin 1s linear infinite;
  }
}

.cookie-desc,
.device-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.cookie-textarea {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: monospace;
  font-size: var(--text-xs);
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.cookie-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
}

.cookie-save-btn,
.device-start-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-primary-foreground, #ffffff);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.device-instruction {
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.device-code-display {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.device-code-text {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  font-family: monospace;
  letter-spacing: 0.15em;
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-raised, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-primary);
}

.device-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    background: var(--color-surface-hover);
  }
}

.device-links {
  margin-bottom: var(--space-3);
}

.device-open-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  text-decoration: underline;
  font-size: var(--text-sm);
}

.device-waiting {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.device-success {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: #10b981;
  font-weight: var(--font-weight-medium);
}

.device-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: #ef4444;
  font-size: var(--text-sm);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

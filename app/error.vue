<script setup lang="ts">
import type { NuxtError } from '#app';
import { useThemeStore } from '~/features/theme/stores/useThemeStore';
import { computed } from 'vue';

const props = defineProps<{
  error: NuxtError;
}>();

const { t } = useI18n({ useScope: 'global' });
const themeStore = useThemeStore();

const handleError = () => {
  clearError({ redirect: '/' });
};

// We apply the current theme manually here because error.vue is completely outside app.vue
const themeDataAttr = computed(() => themeStore.themeId || 'wc2026');

const customColorStyle = computed(() => {
  const cc = themeStore.currentCustomColor;
  if (!cc) return '';
  return `:root { --color-primary-h: ${cc.h}; --color-primary-s: ${cc.s}%; --color-primary-l: ${cc.l}%; }`;
});

useHead(() => ({
  htmlAttrs: {
    'data-theme': themeDataAttr.value
  },
  style: [{ innerHTML: customColorStyle.value, id: 'theme-custom-color' }]
}));

const is404 = computed(() => props.error.statusCode === 404);

const errorTitle = computed(() =>
  is404.value ? t('core.error.notFound') : t('core.error.fatalTitle')
);

const errorDesc = computed(() =>
  is404.value
    ? 'Úgy tűnik, ez az oldal elvándorolt, vagy sosem létezett. Ellenőrizd az URL-t!'
    : t('core.error.fatalDescription')
);
</script>

<template>
  <div class="error-layout">
    <!-- Grid background mimicking app layout structure -->
    <div class="error-grid-overlay"></div>

    <div class="error-container">
      <div class="error-header">
        <AppIcon v-if="is404" name="ph:file-search" size="18" class="header-icon" />
        <AppIcon v-else name="ph:warning-circle" size="18" class="header-icon" />
        <span class="header-text">
          {{ is404 ? '404 - Not Found' : (error.statusCode || '500') + ' - System Error' }}
        </span>
      </div>

      <div class="error-body">
        <h1 class="error-title">{{ errorTitle }}</h1>
        <p class="error-desc">{{ errorDesc }}</p>

        <div v-if="!is404 && error.message" class="error-code-block">
          <div class="code-header">
            <AppIcon name="ph:terminal" size="14" />
            <span>stacktrace.log</span>
          </div>
          <div class="code-content">
            <pre class="message">{{ error.message }}</pre>
            <pre v-if="error.stack" class="stack">{{ error.stack }}</pre>
          </div>
        </div>
      </div>

      <div class="error-footer">
        <AppButton variant="primary" @click="handleError">
          <AppIcon name="ph:house-fill" />
          {{ t('core.error.fatalHomeBtn') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg, #03140e);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  padding: var(--space-4);
}

.error-grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, var(--color-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-border) 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.15;
  z-index: 0;
}

.error-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 600px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.error-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);

  .header-icon {
    color: var(--color-primary);
  }

  .header-text {
    font-family: monospace;
    font-weight: 500;
  }
}

.error-body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.error-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  color: var(--color-text-primary);
}

.error-desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.error-code-block {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: var(--space-2);

  .code-header {
    background: rgba(0, 0, 0, 0.6);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .code-content {
    padding: var(--space-3);
    max-height: 250px;
    overflow-y: auto;
  }

  pre {
    margin: 0;
    font-family: monospace;
    font-size: var(--text-sm);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .message {
    color: var(--color-danger);
    font-weight: 500;
  }

  .stack {
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px dashed var(--color-border);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    opacity: 0.8;
  }
}

.error-footer {
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface-raised);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}
</style>

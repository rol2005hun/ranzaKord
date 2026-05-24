<script setup lang="ts">
// Reusable Brand component for the application logo and name
</script>

<template>
  <div class="app-brand">
    <svg
      width="22"
      height="22"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      class="app-brand__logo">
      <path d="M14 2L26 8.5V19.5L14 26L2 19.5V8.5L14 2Z" fill="url(#brand-dlg)" />
      <path d="M14 8L20 11.5V18.5L14 22L8 18.5V11.5L14 8Z" fill="rgba(255,255,255,0.2)" />
      <defs>
        <linearGradient id="brand-dlg" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop
            stop-color="hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 15%))" />
          <stop
            offset="1"
            stop-color="hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l))" />
        </linearGradient>
      </defs>
    </svg>
    <span class="app-brand__name">BrandName</span>
  </div>
</template>

<style lang="scss" scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  filter: drop-shadow(0 0 6px var(--color-primary-glow));

  &__logo {
    flex-shrink: 0;
  }

  &__name {
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(
      135deg,
      var(--color-primary),
      hsl(var(--color-primary-h) 90% calc(var(--color-primary-l) + 15%))
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
}
</style>

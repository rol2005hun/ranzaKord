<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--titlebar-height, 0px));
  margin-top: var(--titlebar-height, 0px);
  background: var(--color-bg, #09090f);
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding-top: env(safe-area-inset-top, 0px);
  }
}
</style>

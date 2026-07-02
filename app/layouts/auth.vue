<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100dvh - var(--titlebar-height, 0px));
  margin-top: var(--titlebar-height, 0px);
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  box-sizing: border-box;
  background-color: var(--color-bg);
  background-image: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--color-primary) 10%, transparent) 0%,
    transparent 70%
  );
}
</style>

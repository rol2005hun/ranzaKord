<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: calc(100dvh - var(--titlebar-height, 0px));
  margin-top: var(--titlebar-height, 0px);
  background: var(--color-bg, #09090f);
}
</style>

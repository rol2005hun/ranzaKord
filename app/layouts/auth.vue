<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100dvh;
  background: var(--color-bg, #09090f);
}
</style>

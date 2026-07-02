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
  box-sizing: border-box;
  background: var(--color-bg, #09090f);
  overflow: hidden;
}
</style>

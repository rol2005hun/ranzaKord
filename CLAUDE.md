# Nuxt Boilerplate – AI Agent Instructions

## Project Stack

- **Nuxt 4** with `srcDir: app/`, `serverDir: server/`
- **TypeScript** strict mode
- **Pinia** (setup store) + **Pinia ORM** for entity models
- **@nuxtjs/i18n** with auto-loading glob loader
- **SCSS** with CSS custom properties (design tokens)
- **ESLint** + **oxlint** + **Prettier**
- Tests: **Vitest** (unit + Nuxt integration) + **Playwright** (e2e)

## Architecture: Feature-Based

```
app/features/<name>/
  components/   – feature-local components
  composables/  – useFeature.ts (logic, calls store)
  stores/       – useFeatureStore.ts (Pinia setup store)
  models/       – Pinia ORM models
  types/        – feature.types.ts
  locales/      – en.json
```

- **Pages** (`app/pages/`) are thin: use `definePageMeta`, render feature components
- **Shared components** (`app/components/shared/`) are auto-prefixed with `App` (AppButton → Button.vue)
- **Global stores** (`app/stores/`) only for cross-feature concerns (theme, session)
- **Global composables** (`app/composables/`) only for infrastructure (useApi)

## Non-Negotiable Rules

### TypeScript
- No `any` — define explicit types or interfaces
- Every function parameter and return value must be typed
- Use `interface` for object shapes, `type` for unions
- Feature-specific types: `features/<name>/types/<name>.types.ts`
- Global types: `app/types/index.ts`

### No Comments
- No inline comments, no JSDoc
- Code must be self-documenting through naming
- Only `// TODO:` allowed for intentional stubs

### i18n
- Every user-facing string uses `$t()` or `t()` from `useI18n()`
- Locale files at `features/<name>/locales/en.json` → namespaced as `$t('<name>.key')`
- Global strings at `app/shared/locales/en.json` → `$t('key')`
- English only — no other locales

### Pinia Stores
```ts
export const useFeatureStore = defineStore('feature', () => {
  const data = ref<FeatureData | null>(null)
  const isLoaded = computed(() => data.value !== null)
  function load(payload: FeatureData) { data.value = payload }
  return { data, isLoaded, load }
})
```

### Pinia ORM Models
```ts
export class User extends Model {
  static entity = 'users'
  @Num(0) declare id: number
  @Str('') declare name: string
  @Bool(false) declare isAdmin: boolean
}
```

### Components
```vue
<script setup lang="ts">
interface Props { label: string; disabled?: boolean }
const props = withDefaults(defineProps<Props>(), { disabled: false })
</script>
<template>...</template>
<style lang="scss" scoped>
.component { color: var(--color-text-primary); }
</style>
```

### SCSS
- BEM naming: `.block__element--modifier`
- Always `scoped` in components
- Use CSS custom properties: `var(--color-primary)`, `var(--space-4)`, `var(--radius-md)`
- Never hardcode colors, spacing, or border-radius values

## Nuxt Auto-Imports

Do NOT add these imports manually — Nuxt handles them:
- `ref`, `computed`, `reactive`, `watch`, `onMounted`, `readonly` (Vue)
- `definePageMeta`, `useHead`, `navigateTo`, `useRoute`, `useRouter`, `createError`, `$fetch`, `useNuxtApp`, `defineNuxtRouteMiddleware` (Nuxt)
- `defineStore` (Pinia)
- All exports from `app/composables/`, `app/stores/`, `app/features/*/composables/`, `app/features/*/stores/`

## Adding a New Feature Checklist

1. Create `app/features/<name>/types/<name>.types.ts`
2. Create `app/features/<name>/locales/en.json`
3. Create `app/features/<name>/stores/use<Name>Store.ts`
4. Create `app/features/<name>/composables/use<Name>.ts`
5. Create components in `app/features/<name>/components/`
6. Add a page in `app/pages/<name>.vue` (thin wrapper)
7. Add a test in `test/nuxt/<name>.test.ts`

## Git Commits – Conventional Commits

Format: `type(scope): short description`

| Type | When to use |
|---|---|
| `feat` | New feature or page |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `style` | Formatting only (no logic change) |
| `docs` | Documentation, README, agent rules |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependencies |
| `build` | Build system changes (nuxt.config, vite) |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `revert` | Revert a previous commit |

**Scope** = affected feature or area (`auth`, `home`, `i18n`, `deps`, `layout`)

```
feat(auth): add login page and auth store
fix(home): correct hero subtitle alignment
chore(deps): update nuxt to 4.4.5
refactor(auth): extract login logic into useAuth composable
test(home): add HomeHero component integration test
docs(rules): add conventional commits convention
build(nuxt): enable pinia-orm module
```

- Subject: max 72 chars, lowercase, no trailing period
- Body (optional): explain *why*, not *what*
- Breaking change: `feat(auth)!: remove legacy session`

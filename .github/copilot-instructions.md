# Project Instructions for GitHub Copilot

## Project Overview
This is a **Nuxt 4** application using TypeScript strict mode, feature-based architecture, Pinia for state management, Pinia ORM for entity models, and `@nuxtjs/i18n` for internationalization.

## Architecture: Feature-Based Design

Every domain concept lives in its own feature folder:

```
app/
├── features/
│   └── <feature-name>/
│       ├── components/    # Vue components used only in this feature
│       ├── composables/   # useFeature.ts – business logic bridge
│       ├── stores/        # useFeatureStore.ts – Pinia store
│       ├── models/        # Pinia ORM models (if entity-based)
│       ├── types/         # feature.types.ts – TypeScript interfaces
│       └── locales/       # en.json – i18n strings
├── components/shared/     # App-prefixed reusable components (AppButton, AppIcon)
├── composables/           # Global composables (useApi.ts)
├── stores/                # Global stores (useAppStore.ts)
├── layouts/               # Nuxt layouts
├── pages/                 # Nuxt pages (thin – delegate to features)
├── types/                 # Global shared types
└── middleware/            # Nuxt route middleware
```

**Rules:**
- Pages are thin – they only import feature components and set page meta
- New features always go into `app/features/<name>/`
- Cross-feature shared components go into `app/components/shared/`
- Global state only goes in `app/stores/` (e.g. theme, auth session)

## TypeScript

- **Never use `any`** – always define explicit types or interfaces
- All function parameters and return types must be typed
- Use `interface` for object shapes, `type` for unions/aliases
- Place feature-specific types in `features/<name>/types/<name>.types.ts`
- Place global types in `app/types/index.ts`
- `tsconfig.json` has `strict: true` – do not disable any strict checks

```ts
// ✅ correct
function formatDate(date: Date): string { ... }

// ❌ wrong
function formatDate(date: any) { ... }
```

## No Code Comments

- Absolutely no comments are allowed in the code.
- No inline comments, no JSDoc blocks, and no `// TODO:` markers. No exceptions.
- Code should be self-documenting through clear naming.

```ts
// ❌ wrong
// Checks if user is authenticated
const isAuth = computed(() => !!session.value)

// ✅ correct
const isAuthenticated = computed(() => !!session.value)
```

## Import Ordering

Group imports in blocks separated by a blank line in the following order:
1. Node modules dependencies
2. Own custom dependencies
3. Types
4. Vue components

Always use the `@/` alias for all internal imports instead of `~/` (e.g., `@/types`, `@/features/...`).

```ts
// ✅ correct
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';

import { useToast } from '@/composables/useToast';

import type { ApiResponse } from '@/types';

import HomeHero from '@/features/home/components/HomeHero.vue';
```

## i18n

- All user-facing strings must use `$t()` or `useI18n()`
- Never hardcode UI strings in templates or composables
- Place locale files at: `app/features/<name>/locales/en.json`
- Global strings: `app/shared/locales/en.json`
- Keys are auto-namespaced by parent folder: feature `auth` → `$t('auth.login.title')`
- Only English (`en`) locale is supported

```vue
<!-- ✅ correct -->
<p>{{ $t('auth.login.title') }}</p>

<!-- ❌ wrong -->
<p>Sign in</p>
```

## Pinia Stores

- Use **Setup Store** style (not Options API style)
- Name stores as `useFeatureStore` and register with `defineStore('feature', ...)`
- Feature stores live in `features/<name>/stores/useFeatureStore.ts`
- Global stores live in `app/stores/useAppStore.ts`
- Always type reactive state explicitly

```ts
// ✅ correct
export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)
  const isAuthenticated = computed(() => !!session.value)
  return { session, isAuthenticated }
})
```

## Pinia ORM

- Use ORM models for persistent entities (User, Post, etc.)
- Models live in `features/<name>/models/ModelName.ts`
- Always use typed decorators: `@Num(0)`, `@Str('')`, `@Bool(false)`
- Access repositories via `useRepo(ModelName)`

```ts
import { Model } from 'pinia-orm'
import { Num, Str } from 'pinia-orm/decorators'

export class User extends Model {
  static entity = 'users'
  @Num(0) declare id: number
  @Str('') declare name: string
}
```

## Components

- Always use `<script setup lang="ts">`
- Define props with `interface Props` and `defineProps<Props>()`
- Use `withDefaults` for default prop values
- Scoped styles with `<style lang="scss" scoped>`
- Shared components get the `App` prefix (e.g. `AppButton`, `AppIcon`) automatically via Nuxt config
- Feature components have no prefix (e.g. `HomeHero`, `AuthLoginForm`)

## TypeScript – Types Location

- Feature-specific types → `features/<name>/types/<name>.types.ts`
- Global shared types → `app/types/index.ts`
- Domain-specific global types → `app/types/<domain>.types.ts` (e.g. `app/types/i18n.types.ts`)
- **Never define inline types in composables, stores, or components** — always import from the types file
- `interface` for object shapes, `type` for unions/string literals

## SCSS & Styling

### Theme System

Themes live in `app/assets/scss/themes/`, one file per theme:

```
app/assets/scss/
├── main.scss           ← imports reset + variables + all themes
├── _reset.scss
├── _variables.scss     ← non-color tokens only (spacing, typography, radii)
└── themes/
    ├── _default.scss   ← light theme (indigo)
    ├── _dark.scss      ← dark theme
    └── _ocean.scss     ← ocean teal theme
```

Each theme defines its colors via `[data-theme="<name>"]` selector using HSL components:

```scss
[data-theme='dark'] {
  color-scheme: dark;
  --color-primary-h: 239;
  --color-primary-s: 84%;
  --color-primary-l: 67%;
  --color-primary: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
  --color-bg: #0f172a;
}
```

**User custom color:** The three HSL components (`--color-primary-h/s/l`) can be overridden at runtime via JS to apply a user-chosen primary color — the rest of the theme stays intact.

**Adding a new theme:**
1. Create `app/assets/scss/themes/_<name>.scss` with `[data-theme='<name>']` block
2. Add the `ThemeId` type union in `app/features/theme/types/theme.types.ts`
3. Add the option to `THEME_OPTIONS` in `useTheme.ts`
4. Import the file in `main.scss`

### Theme Store & Composable

- `features/theme/stores/useThemeStore.ts` — sets `data-theme` on `<html>`, stores in localStorage
- `features/theme/composables/useTheme.ts` — exposes `setTheme`, `setCustomColor`, `resetCustomColor`
- `app/plugins/theme.client.ts` — calls `initialize()` on page load to restore saved theme

### Styling Rules

- BEM naming: `.block__element--modifier`
- Always `<style lang="scss" scoped>` in components
- Use CSS custom properties only — never hardcode colors, spacing, or radii
- `_variables.scss` = spacing + typography + radii (NO colors)
- Colors always live in theme files

- Use CSS custom properties (design tokens) from `_variables.scss` – never hardcode colors or spacing
- Use BEM-like class naming: `.block__element--modifier`
- Always use `scoped` styles in components
- Do not use Tailwind or utility classes

```scss
// ✅ correct
.card {
  background-color: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

// ❌ wrong
.card {
  background-color: #ffffff;
  padding: 16px;
}
```

## Nuxt Auto-Imports

The following are auto-imported – **do not manually import them**:
- `ref`, `computed`, `reactive`, `watch`, `onMounted` etc. (Vue)
- `definePageMeta`, `useHead`, `navigateTo`, `useRoute`, `useRouter` (Nuxt)
- `defineStore` (Pinia)
- All composables from `app/composables/` and `app/features/*/composables/`
- All stores from `app/stores/` and `app/features/*/stores/`

## Server

- API routes live in `server/api/<name>.<method>.ts`
- Use `defineEventHandler` for all handlers
- Return typed objects, not raw strings

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
| `build` | Build system changes (vite, nuxt config) |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `revert` | Revert a previous commit |

**Scope** = the affected feature or area (e.g. `auth`, `home`, `i18n`, `deps`, `layout`)

```
feat(auth): add login page and auth store
fix(home): correct hero subtitle alignment
chore(deps): update nuxt to 4.4.5
refactor(auth): extract login logic into useAuth composable
test(home): add HomeHero component integration test
docs(rules): add conventional commits convention
```

- Subject line: max 72 characters, lowercase, no trailing period
- Body (optional): explain *why*, not *what*
- Breaking changes: add `!` after scope → `feat(auth)!: remove legacy session`

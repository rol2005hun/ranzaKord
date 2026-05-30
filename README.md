<div align="center">
  <img src="public/logo.webp" alt="ranzaKord Logo" width="120" />
  <h1>ranzaKord</h1>
  <p><strong>Premium Music Streaming Experience</strong></p>
</div>

---

**ranzaKord** is a modern, premium music streaming application built for speed, aesthetics, and cross-platform compatibility. Powered by a robust technology stack featuring **Nuxt 4** and **Tauri**, it delivers a seamless native desktop and web experience.

## ✨ Features

- **Cross-Platform**: Available as a native desktop app via Tauri and accessible via the web.
- **Premium UI/UX**: Sleek, modern interface with smooth micro-animations and a dynamic design system.
- **Multi-Theme Support**: Built-in themes (`default`, `dark`, `ocean`) with runtime custom primary color adjustments.
- **Robust State Management**: Powered by Pinia and Pinia ORM for complex entity relationships.
- **Internationalization (i18n)**: Fully supported multi-language interface (`en`, `hu`).
- **Feature-Based Architecture**: Highly scalable domain-driven codebase organization.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Nuxt 4](https://nuxt.com/) (`srcDir: app/`, `serverDir: server/`) |
| **Desktop / Native** | [Tauri v2](https://tauri.app/) |
| **Language** | TypeScript (strict mode) |
| **State Management** | [Pinia](https://pinia.vuejs.org/) + [Pinia ORM](https://pinia-orm.vuejs.org/) |
| **Async State** | [@pinia/colada](https://pinia-colada.esm.is/) |
| **Styling** | SCSS + CSS Custom Properties (Design Tokens) |
| **i18n** | `@nuxtjs/i18n` with auto-loading glob plugin |
| **Testing** | Vitest (unit/integration) + Playwright (e2e) |
| **Linting & Formatting** | ESLint + oxlint + Prettier |

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** (Package manager)
- **Rust** (For Tauri desktop builds)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/rrol2/ranzaKord.git
cd ranzaKord
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory and configure the required variables (refer to `runtimeConfig` in `nuxt.config.ts`):

```env
NUXT_MONGODB_URI=
NUXT_SESSION_SECRET=
NUXT_RANZAKONNECT_DOMAIN=
NUXT_RANZAKONNECT_CLIENT_ID=
NUXT_RANZAKONNECT_CLIENT_SECRET=
NUXT_YOUTUBE_OAUTH_TOKEN=
NUXT_IMGUR_CLIENT_ID=
```

## 💻 Development

Start the development server for the web:

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000)

Start the desktop app development environment (Tauri):

```bash
pnpm tauri dev
```

## 🏗 Architecture

The project follows a **Feature-based architecture** where every domain concept lives in its own folder inside `app/features/`.

```
app/
├── features/
│   └── <feature_name>/
│       ├── components/    # Feature-local Vue components
│       ├── composables/   # Business logic (useFeature.ts)
│       ├── stores/        # Pinia setup store
│       ├── models/        # Pinia ORM models
│       ├── types/         # TypeScript definitions
│       └── locales/       # i18n JSON files (e.g., en.json)
├── components/shared/     # App-prefixed shared components (e.g., AppButton)
├── composables/           # Global infrastructure composables (e.g., useApi)
├── layouts/               # Vue layouts (default, auth)
├── pages/                 # Thin wrapper pages that delegate to feature components
├── plugins/               # Nuxt plugins (i18n, theme loader)
├── stores/                # Global cross-feature stores
└── assets/scss/           # Global styles, variables, and themes
```

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the web development server |
| `pnpm tauri dev` | Start the Tauri desktop app in dev mode |
| `pnpm build` | Build the web application for production |
| `pnpm tauri build` | Build the Tauri desktop executable |
| `pnpm check` | Run typecheck, linting, and formatting checks |
| `pnpm lint` / `lint:fix` | Run ESLint / auto-fix |
| `pnpm format:fix` | Run Prettier auto-format |
| `pnpm test` | Run all Vitest tests |
| `pnpm test:e2e` | Run Playwright end-to-end tests |

## 🎨 Theme System

ranzaKord features a powerful custom styling and theming engine:
- Tokens live in `app/assets/scss/themes/`.
- Utilizes `[data-theme='<name>']` with HSL component variables.
- Themes strictly persist in `localStorage` and initialize before the first render to prevent flashing.
- Runtime user customization overrides HSL values via `useThemeStore.setCustomColor(hex)`.

## 🤝 Conventions & Guidelines

- **No Comments**: Code must be self-documenting through intuitive naming.
- **Strict TypeScript**: No `any` types. Explicitly type all variables and returns.
- **Imports**: Use the `@/` alias for all internal path imports. Nuxt auto-imports Vue/Nuxt/Pinia APIs automatically.
- **Commits**: Conventional Commits format is strictly enforced (`feat`, `fix`, `refactor`, etc.).

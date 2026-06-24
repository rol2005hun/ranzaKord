import pkg from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s | ranzaKord',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [{ rel: 'icon', type: 'image/webp', href: '/logo.webp' }],
      script: [
        {
          innerHTML: `
            (function() {
              try {
                var theme = document.cookie.match(/theme-id=([^;]+)/)?.[1] || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if ('__TAURI_INTERNALS__' in window) {
                  document.documentElement.classList.add('is-tauri');
                }
              } catch (e) {}
            })();
          `
        }
      ]
    }
  },

  devtools: { enabled: true },
  srcDir: 'app/',
  serverDir: 'server/',

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/a11y',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    'pinia-plugin-persistedstate/nuxt'
  ],

  runtimeConfig: {
    mongodbUri: '',
    sessionSecret: '',
    ranzakonnectDomain: '',
    ranzakonnectClientId: '',
    ranzakonnectClientSecret: '',
    imgurClientId: '',
    youtubeCookies: '',
    public: {
      baseUrl: '',
      appVersion: pkg.version
    }
  },

  ssr: process.env.NUXT_SSR === 'true',
  nitro: {
    preset: process.env.NUXT_SSR === 'true' ? 'netlify' : 'static',
    experimental: {
      wasm: true
    },
    compressPublicAssets: { gzip: true, brotli: true },
    minify: true,
    externals: {
      external: ['mongoose']
    }
  },

  routeRules: {
    '/api/**': { cors: true },
    '/auth/**': { cors: true },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/logo.webp': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  },

  image: {
    domains: [
      'yt3.googleusercontent.com',
      'i.ytimg.com',
      'image-cdn-ak.spotifycdn.com',
      'i.scdn.co',
      'i.imgur.com'
    ],
    format: ['webp', 'avif'],
    quality: 80
  },

  site: {
    url: 'https://kord.ranzak.dev',
    name: 'ranzaKord',
    description: 'Premium music streaming.'
  },

  sitemap: {
    zeroRuntime: true
  },

  ogImage: {
    enabled: false
  },

  schemaOrg: {
    enabled: process.env.NUXT_SSR === 'true'
  },

  hints: {
    devtools: true,
    features: {
      lazyLoad: { logs: false, devtools: true }
    }
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 2048
    }
  },

  css: ['@/assets/scss/main.scss'],

  components: [
    { path: '~/components/shared', prefix: 'App' },
    { path: '~/features', pattern: '**/components/**/*.vue', pathPrefix: false }
  ],

  imports: {
    dirs: ['composables', 'stores', 'features/*/composables', 'features/*/stores']
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
      { code: 'hu', name: 'Magyar' }
    ],
    strategy: 'no_prefix'
  },

  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        experimentalDecorators: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        allowUnreachableCode: false
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        'pinia-orm',
        'pinia-orm/decorators',
        '@tauri-apps/api/core',
        '@tauri-apps/api/window',
        '@tauri-apps/plugin-process',
        '@tauri-apps/plugin-updater',
        '@tauri-apps/plugin-deep-link',
        '@tauri-apps/plugin-opener',
        '@unhead/schema-org/vue'
      ]
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true
        }
      }
    }
  }
});

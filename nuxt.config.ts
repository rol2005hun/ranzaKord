export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  app: {
    head: {
      titleTemplate: '%s | ranzaKord',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1'
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
    mongodbUri: process.env.MONGODB_URI || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    ranzaKonnectDomain: process.env.RANZAKONNECT_DOMAIN || '',
    ranzaKonnectClientId: process.env.RANZAKONNECT_CLIENT_ID || '',
    ranzaKonnectClientSecret: process.env.RANZAKONNECT_CLIENT_SECRET || '',
    youtubeCookies: process.env.YOUTUBE_COOKIES || '',
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || ''
    }
  },

  nitro: {
    preset: 'netlify',
    experimental: {
      wasm: true
    }
  },

  site: {
    url: 'https://ranzakord.netlify.app',
    name: 'ranzaKord',
    description: 'Prémium zenei streaming alkalmazás.'
  },



  sitemap: {
    zeroRuntime: true
  },

  ogImage: {
    enabled: false
  },

  hints: {
    devtools: true,
    features: {
      lazyLoad: { logs: false, devtools: true }
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
    locales: [{ code: 'en', name: 'English' }],
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
      include: ['pinia-orm', 'pinia-orm/decorators']
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

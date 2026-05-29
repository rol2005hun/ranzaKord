export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  app: {
    head: {
      titleTemplate: '%s | ranzaKord',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/logo.webp' }]
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
    youtubeOauthToken: '',
    imgurClientId: '',
    public: {
      baseUrl: ''
    }
  },

  nitro: {
    preset: 'netlify',
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
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/logo.webp': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
  },

  image: {
    provider: 'ipx',
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

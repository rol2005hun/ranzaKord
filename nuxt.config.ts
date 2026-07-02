import os from 'node:os';
import pkg from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  spaLoadingTemplate: 'spa-loading-template.html',

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s | ranzaKord',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [{ rel: 'icon', type: 'image/webp', href: '/logo.webp' }],
      script: [
        {
          innerHTML: `
            (function() {
              try {
                var theme = document.cookie.match(/theme-id=([^;]+)/)?.[1] || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if ('__TAURI_INTERNALS__' in window && !/android|ios|iphone|ipad/i.test(navigator.userAgent)) {
                  document.documentElement.classList.add('is-tauri');
                }
                
                if (!window.crypto) window.crypto = {};
                if (!window.crypto.randomUUID) {
                  window.crypto.randomUUID = function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
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
    '/logo.webp': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/sitemap.xml': { prerender: false },
    '/__sitemap__/style.xsl': { prerender: false }
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
    url: process.env.NUXT_PUBLIC_BASE_URL,
    name: 'ranzaKord',
    description: 'Premium music streaming.'
  },

  sitemap: {
    // Disable prerendering for sitemap to avoid H3 v2 node-mock-http crash
    exclude: ['/api/**'],
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
        '@tauri-apps/api/event',
        '@tauri-apps/api/window',
        '@tauri-apps/plugin-process',
        '@tauri-apps/plugin-updater',
        '@tauri-apps/plugin-deep-link',
        '@tauri-apps/plugin-opener',
        ...(process.env.NUXT_SSR === 'true' ? ['@unhead/schema-org/vue'] : [])
      ]
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true
        }
      }
    },
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host:
          process.env.TAURI_DEV_HOST ||
          (os.networkInterfaces()
            ? Object.values(os.networkInterfaces())
                .flat()
                .find((i) => i?.family === 'IPv4' && !i?.internal)?.address
            : 'localhost') ||
          'localhost',
        port: 5183
      }
    }
  }
});

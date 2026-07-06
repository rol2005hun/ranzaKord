import { createORM } from 'pinia-orm';

export default defineNuxtPlugin((nuxtApp) => {
  (nuxtApp.$pinia as ReturnType<typeof import('pinia').createPinia>).use(createORM());
});

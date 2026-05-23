import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { HomeHeroData } from '../types/home.types';

export const useHomeStore = defineStore('home', () => {
  const hero = ref<HomeHeroData>({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '/'
  });

  const isInitialized = ref(false);

  function initialize(data: Partial<HomeHeroData>) {
    hero.value = { ...hero.value, ...data };
    isInitialized.value = true;
  }

  return { hero, isInitialized, initialize };
});

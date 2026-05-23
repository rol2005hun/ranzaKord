import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { HomeHeroData } from '../types/home.types';

/**
 * Home feature store.
 * Manages state that is local to the home feature.
 */
export const useHomeStore = defineStore('home', () => {
  // --- State ---
  const hero = ref<HomeHeroData>({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '/'
  });

  const isInitialized = ref(false);

  // --- Actions ---
  function initialize(data: Partial<HomeHeroData>) {
    hero.value = { ...hero.value, ...data };
    isInitialized.value = true;
  }

  return { hero, isInitialized, initialize };
});

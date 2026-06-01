import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Login from '../../app/pages/login.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

const { mockLoginWithRanzaKonnect, mockNavigateTo } = vi.hoisted(() => ({
  mockLoginWithRanzaKonnect: vi.fn(),
  mockNavigateTo: vi.fn()
}));

const mockIsAuthenticated = ref(false);

mockNuxtImport('useAuth', () => {
  return () => ({
    loginWithRanzaKonnect: mockLoginWithRanzaKonnect,
    isAuthenticated: mockIsAuthenticated,
    isTauri: ref(false)
  });
});

mockNuxtImport('navigateTo', () => mockNavigateTo);

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key,
    locale: ref('en'),
    setLocale: vi.fn()
  });
});

mockNuxtImport('useHead', () => vi.fn());
mockNuxtImport('definePageMeta', () => vi.fn());

describe('login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.value = false;
  });

  const mountLogin = () => {
    return mount(
      {
        template: '<Suspense><Login /></Suspense>',
        components: { Login }
      },
      {
        global: {
          mocks: { $t: (k: string) => k },
          stubs: { AppIcon: true, AppSpinner: true, Suspense: false, AppButton: false }
        }
      }
    );
  };

  it('renders login page correctly', async () => {
    const wrapper = mountLogin();
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).toContain('auth.login.title');
    expect(wrapper.text()).toContain('auth.login.subtitle');
    expect(wrapper.find('#login-with-ranzakonnect').text()).toContain('auth.login.button');
  });

  it('handles login button click', async () => {
    const wrapper = mountLogin();
    await new Promise((r) => setTimeout(r, 0));
    const btn = wrapper.find('#login-with-ranzakonnect');

    await btn.trigger('click');
    expect(mockLoginWithRanzaKonnect).toHaveBeenCalled();

    // Check loading state
    expect(wrapper.text()).toContain('auth.login.redirecting');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('redirects if already authenticated', async () => {
    mockIsAuthenticated.value = true;
    mountLogin(); // trigger setup
    await new Promise((r) => setTimeout(r, 0));
    expect(mockNavigateTo).toHaveBeenCalledWith('/');
  });
});

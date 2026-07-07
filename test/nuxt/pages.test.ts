import { describe, it, expect, vi } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';

import LoginPage from '@/pages/login.vue';
import UnauthorizedPage from '@/pages/unauthorized.vue';

const mockLoginWithRanzaKonnect = vi.fn();
const mockLogout = vi.fn();
const mockIsAuthenticated = ref(false);
const mockIsTauri = ref(false);

mockNuxtImport('useAuth', () => () => ({
  loginWithRanzaKonnect: mockLoginWithRanzaKonnect,
  logout: mockLogout,
  isAuthenticated: mockIsAuthenticated,
  isTauri: mockIsTauri
}));

mockNuxtImport('navigateTo', () => vi.fn());

describe('LoginPage', () => {
  it('renders login button and title', async () => {
    const wrapper = await mountSuspended(LoginPage);
    expect(wrapper.find('#login-with-ranzakonnect').exists()).toBe(true);
    expect(wrapper.find('.login-page__title').exists()).toBe(true);
  });

  it('calls loginWithRanzaKonnect and sets redirecting state on click', async () => {
    const wrapper = await mountSuspended(LoginPage);

    // Accept terms
    const checkbox = wrapper.find('.login-page__terms-checkbox');
    await checkbox.setValue(true);

    await wrapper.find('#login-with-ranzakonnect').trigger('click');

    expect(mockLoginWithRanzaKonnect).toHaveBeenCalled();
  });

  it('renders language toggle buttons', async () => {
    const wrapper = await mountSuspended(LoginPage);
    const buttons = wrapper.findAll('.login-page__lang-toggle button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.text()).toBe('EN');
    expect(buttons[1]?.text()).toBe('HU');
  });
});

describe('UnauthorizedPage', () => {
  it('renders title and logout button', async () => {
    const wrapper = await mountSuspended(UnauthorizedPage);
    expect(wrapper.find('h1').exists()).toBe(true);
    expect(wrapper.find('#logout-btn').exists()).toBe(true);
  });

  it('calls logout on button click', async () => {
    const wrapper = await mountSuspended(UnauthorizedPage);
    await wrapper.find('#logout-btn').trigger('click');
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders github link', async () => {
    const wrapper = await mountSuspended(UnauthorizedPage);
    const link = wrapper.find('.login-page__github-link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toContain('github.com');
  });
});

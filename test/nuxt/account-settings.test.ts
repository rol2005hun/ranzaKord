import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import AccountSettings from '@/features/settings/components/panels/AccountSettings.vue';
import type { OAuthUser } from '@/features/auth/types/auth.types';
import { ref } from 'vue';

const mockFetchUser = vi.fn();
const mockLogout = vi.fn();
const mockCurrentUser = ref<OAuthUser | null>(null);
const mockIsAuthenticated = ref(false);

const mockToastSuccess = vi.fn();
const mockToastDanger = vi.fn();

mockNuxtImport('useAuth', () => () => ({
  currentUser: mockCurrentUser,
  isAuthenticated: mockIsAuthenticated,
  logout: mockLogout,
  fetchUser: mockFetchUser
}));

mockNuxtImport('useToast', () => () => ({
  success: mockToastSuccess,
  danger: mockToastDanger
}));

const mockFetch = vi.fn();
global.$fetch = mockFetch as unknown as typeof $fetch;

describe('AccountSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser.value = null;
    mockIsAuthenticated.value = false;
  });

  it('renders correctly when not authenticated', async () => {
    const wrapper = await mountSuspended(AccountSettings, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: true,
          AppSettingsSection: { template: '<div><slot/></div>' }
        }
      }
    });

    expect(wrapper.text()).toContain('settings.account.noAccount');
  });

  it('renders account info and privacy toggles when authenticated', async () => {
    mockIsAuthenticated.value = true;
    mockCurrentUser.value = {
      sub: '123',
      hasAccess: true,
      name: 'Test User',
      email: 'test@example.com',
      picture: 'pic.jpg',
      isPublicProfile: false,
      showPlaylists: true
    };

    const wrapper = await mountSuspended(AccountSettings, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: true,
          AppSettingsSection: { template: '<div><slot/></div>' },
          AppSettingsItem: {
            template: '<div>{{ title }}{{ description }}<slot/></div>',
            props: ['title', 'description']
          },
          AppToggle: {
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue']
          }
        }
      }
    });

    expect(wrapper.text()).toContain('Test User');
    expect(wrapper.text()).toContain('test@example.com');
    expect(wrapper.text()).toContain('Adatvédelem');
  });

  it('calls API and shows success toast when saving privacy settings', async () => {
    mockIsAuthenticated.value = true;
    mockCurrentUser.value = {
      sub: '123',
      hasAccess: true,
      name: 'Test User',
      email: 'test@example.com',
      picture: 'pic.jpg',
      isPublicProfile: false,
      showPlaylists: true
    };

    mockFetch.mockResolvedValueOnce({ success: true });

    const wrapper = await mountSuspended(AccountSettings, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: true,
          AppSettingsSection: { template: '<div><slot/></div>' },
          AppSettingsItem: {
            template: '<div>{{ title }}{{ description }}<slot/></div>',
            props: ['title', 'description']
          },
          AppToggle: {
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue']
          }
        }
      }
    });

    // Manually trigger the updatePrivacySettings function by changing the toggle
    const toggle = wrapper.find('input[type="checkbox"]');
    await toggle.setValue(true); // set isPublicProfile to true

    expect(mockFetch).toHaveBeenCalledWith('/api/me/settings', {
      method: 'PATCH',
      body: {
        isPublicProfile: true, // we emitted true on the first toggle which is isPublicProfile
        showPlaylists: true
      }
    });

    expect(mockFetchUser).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith('Adatvédelmi beállítások elmentve');
  });

  it('shows error toast on API failure', async () => {
    mockIsAuthenticated.value = true;
    mockCurrentUser.value = {
      sub: '123',
      hasAccess: true,
      name: 'Test User',
      email: 'test@example.com',
      picture: 'pic.jpg',
      isPublicProfile: true,
      showPlaylists: true
    };

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = await mountSuspended(AccountSettings, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: true,
          AppSettingsSection: { template: '<div><slot/></div>' },
          AppSettingsItem: {
            template: '<div>{{ title }}{{ description }}<slot/></div>',
            props: ['title', 'description']
          },
          AppToggle: {
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue']
          }
        }
      }
    });

    const toggle = wrapper.find('input[type="checkbox"]');
    await toggle.setValue(false);

    expect(mockFetch).toHaveBeenCalled();
    expect(mockToastDanger).toHaveBeenCalledWith('Hiba történt a mentés során');
  });
});

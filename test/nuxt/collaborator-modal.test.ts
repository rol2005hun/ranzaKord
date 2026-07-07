import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import CollaboratorModal from '@/features/playlists/components/CollaboratorModal.vue';
import { createTestingPinia } from '@pinia/testing';

const mockToastSuccess = vi.fn();
const mockToastDanger = vi.fn();

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    danger: mockToastDanger
  })
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

const mockFetch = vi.fn();
global.$fetch = mockFetch as unknown as typeof $fetch;

describe('CollaboratorModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  const mountComponent = async (props = {}) => {
    const wrapper = mount(CollaboratorModal, {
      props: {
        modelValue: true,
        playlistId: 'pl-1',
        collaborators: [],
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: { currentUser: { sub: 'me', name: 'Me' } }
            }
          })
        ],
        stubs: {
          AppModal: {
            template: '<div><slot /></div>'
          },
          AppInput: {
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          AppButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          },
          AppIcon: true,
          AppSpinner: true,
          NuxtLink: {
            template: '<a><slot /></a>'
          }
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });
    await flushPromises();
    return wrapper;
  };

  it('renders list of collaborators', async () => {
    const wrapper = await mountComponent({
      collaborators: [
        { sub: 'sub-1', name: 'User 1' },
        { sub: 'sub-2', name: 'User 2' }
      ]
    });
    expect(wrapper.text()).toContain('User 1');
    expect(wrapper.text()).toContain('User 2');
  });

  it('calls API and emits saved event when adding a collaborator', async () => {
    // 1. Mock search API call
    mockFetch.mockResolvedValueOnce({ users: [{ sub: 'new-sub', name: 'New User' }] });
    // 2. Mock add collaborator API call
    mockFetch.mockResolvedValueOnce({ success: true });

    const wrapper = await mountComponent();

    const input = wrapper.find('input');
    await input.setValue('new-sub');

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 600));
    await flushPromises();

    // The add button should appear as a result of the search
    const buttons = wrapper.findAll('button');
    // The first button will be the add button
    const addBtn = buttons[0];
    if (addBtn) {
      await addBtn.trigger('click');
    }

    expect(mockFetch).toHaveBeenCalledWith('/api/playlists/pl-1/collaborators', {
      method: 'POST',
      body: {
        action: 'add',
        collaboratorSub: 'new-sub'
      }
    });

    await flushPromises();
    expect(mockToastSuccess).toHaveBeenCalledWith('playlists.collaboratorAdded');
    expect(wrapper.emitted('saved')).toBeTruthy();
  });

  it('shows error toast on API failure when adding', async () => {
    mockFetch.mockResolvedValueOnce({ users: [{ sub: 'new-sub', name: 'New User' }] });
    mockFetch.mockRejectedValueOnce({ data: { statusMessage: 'Not found' } });

    const wrapper = await mountComponent();

    const input = wrapper.find('input');
    await input.setValue('new-sub');

    await new Promise((r) => setTimeout(r, 600));
    await flushPromises();

    const buttons = wrapper.findAll('button');
    const addBtn = buttons[0];
    if (addBtn) {
      await addBtn.trigger('click');
    }

    await flushPromises();
    expect(mockToastDanger).toHaveBeenCalledWith('Not found');
  });

  it('removes collaborator and emits saved', async () => {
    mockFetch.mockResolvedValueOnce({ success: true });
    const wrapper = await mountComponent({
      collaborators: [{ sub: 'sub-to-remove', name: 'Remove Me' }]
    });

    // There is only one button in the list (remove button)
    const removeBtn = wrapper.find('button');
    await removeBtn.trigger('click');

    expect(window.confirm).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/playlists/pl-1/collaborators', {
      method: 'POST',
      body: {
        action: 'remove',
        collaboratorSub: 'sub-to-remove'
      }
    });

    await flushPromises();
    expect(mockToastSuccess).toHaveBeenCalledWith('playlists.collaboratorRemoved');
    expect(wrapper.emitted('saved')).toBeTruthy();
  });
});

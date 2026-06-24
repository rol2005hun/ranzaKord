import type { SidebarMode } from '@/features/player/types/sidebar.types';

const RIGHT_SIDEBAR_DEFAULT_WIDTH = 300;
const RIGHT_SIDEBAR_MIN_WIDTH = 220;
const RIGHT_SIDEBAR_MAX_PERCENT = 0.3;

export const useLayoutStore = defineStore(
  'layout',
  () => {
    const isRightSidebarOpen = ref(true);
    const rightSidebarMode = ref<SidebarMode>('info');
    const rightSidebarWidth = ref(RIGHT_SIDEBAR_DEFAULT_WIDTH);

    function toggleRightSidebar() {
      isRightSidebarOpen.value = !isRightSidebarOpen.value;
    }

    function openRightSidebar(mode?: SidebarMode) {
      isRightSidebarOpen.value = true;
      if (mode) rightSidebarMode.value = mode;
    }

    function closeRightSidebar() {
      isRightSidebarOpen.value = false;
    }

    function setRightSidebarMode(mode: SidebarMode) {
      rightSidebarMode.value = mode;
    }

    function setRightSidebarWidth(width: number) {
      const maxWidth = window.innerWidth * RIGHT_SIDEBAR_MAX_PERCENT;
      rightSidebarWidth.value = Math.max(RIGHT_SIDEBAR_MIN_WIDTH, Math.min(width, maxWidth));
    }

    return {
      isRightSidebarOpen,
      rightSidebarMode,
      rightSidebarWidth,
      toggleRightSidebar,
      openRightSidebar,
      closeRightSidebar,
      setRightSidebarMode,
      setRightSidebarWidth
    };
  },
  {
    persist: [
      {
        pick: ['isRightSidebarOpen', 'rightSidebarWidth', 'rightSidebarMode'],
        storage: {
          getItem: (key) => {
            const cookie = useCookie<string | null>(key);
            return cookie.value;
          },
          setItem: (key, value) => {
            const cookie = useCookie<string | null>(key, { maxAge: 31536000 });
            cookie.value = value;
          }
        }
      }
    ]
  }
);

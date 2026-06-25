import type { SidebarMode } from '@/features/player/types/sidebar.types';
import type { VisualizerStyle } from '@/features/core/types/layout.types';

const RIGHT_SIDEBAR_DEFAULT_WIDTH = 300;
const RIGHT_SIDEBAR_MIN_WIDTH = 220;
const RIGHT_SIDEBAR_MAX_PERCENT = 0.3;

export const useLayoutStore = defineStore(
  'layout',
  () => {
    const isRightSidebarOpen = ref(true);
    const rightSidebarMode = ref<SidebarMode>('info');
    const rightSidebarWidth = ref(RIGHT_SIDEBAR_DEFAULT_WIDTH);
    const isSettingsOpen = ref(false);

    const visualizerStyle = ref<VisualizerStyle>('circle');
    const isFullscreenVisualizer = ref(false);

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

    function toggleSettings() {
      isSettingsOpen.value = !isSettingsOpen.value;
    }

    function openSettings() {
      isSettingsOpen.value = true;
    }

    function closeSettings() {
      isSettingsOpen.value = false;
    }

    function setVisualizerStyle(style: VisualizerStyle) {
      visualizerStyle.value = style;
    }

    function toggleFullscreenVisualizer() {
      isFullscreenVisualizer.value = !isFullscreenVisualizer.value;
    }

    return {
      isRightSidebarOpen,
      rightSidebarMode,
      rightSidebarWidth,
      isSettingsOpen,
      visualizerStyle,
      isFullscreenVisualizer,
      toggleRightSidebar,
      openRightSidebar,
      closeRightSidebar,
      setRightSidebarMode,
      setRightSidebarWidth,
      toggleSettings,
      openSettings,
      closeSettings,
      setVisualizerStyle,
      toggleFullscreenVisualizer
    };
  },
  {
    persist: [
      {
        pick: ['isRightSidebarOpen', 'rightSidebarWidth', 'rightSidebarMode', 'visualizerStyle'],
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

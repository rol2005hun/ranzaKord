import type { UpdateInfo } from '@/features/updater/types/updater.types';

export const useUpdaterStore = defineStore('updater', () => {
  const info = ref<UpdateInfo>({
    available: false,
    version: '',
    body: '',
    date: '',
    isMandatory: false,
    downloading: false,
    progress: 0,
    total: 0,
    error: null,
    apkDownloadUrl: null
  });

  const showModal = ref(false);
  const hasChecked = ref(false);

  function patch(data: Partial<UpdateInfo>) {
    info.value = { ...info.value, ...data };
  }

  function dismiss() {
    if (!info.value.isMandatory) {
      info.value.available = false;
      showModal.value = false;
    }
  }

  return { info, showModal, hasChecked, patch, dismiss };
});

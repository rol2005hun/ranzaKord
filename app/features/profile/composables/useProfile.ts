import { getAuthHeaders } from '@/utils/auth';

import type { PlaylistSummary } from '@/features/playlists/types/playlists.types';
import type { UserProfileInfo, UserProfileResponse } from '../types/profile.types';

export function useProfile(userId: string) {
  const toast = useToast();

  const profile = ref<UserProfileInfo | null>(null);
  const playlists = ref<PlaylistSummary[]>([]);
  const pending = ref(true);
  const error = ref<Error | null>(null);

  const loadProfile = async () => {
    pending.value = true;
    error.value = null;
    try {
      const response = await $fetch<UserProfileResponse>(
        useApiUrl(`/api/user/profile?id=${encodeURIComponent(userId)}`),
        {
          headers: getAuthHeaders()
        }
      );
      profile.value = response.profile;
      playlists.value = response.playlists;
    } catch (err) {
      const e = err as { statusMessage?: string };
      error.value = e as Error;
      toast.danger(e.statusMessage || 'Failed to load profile');
    } finally {
      pending.value = false;
    }
  };

  const toggleFollow = async () => {
    if (!profile.value) return;

    const action = profile.value.isFollowing ? 'unfollow' : 'follow';
    const prevFollowing = profile.value.isFollowing;
    const prevCount = profile.value.followersCount;

    profile.value.isFollowing = !prevFollowing;
    profile.value.followersCount += prevFollowing ? -1 : 1;

    try {
      await $fetch(useApiUrl('/api/user/follow'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { targetSub: userId, action }
      });
    } catch {
      profile.value.isFollowing = prevFollowing;
      profile.value.followersCount = prevCount;
      toast.danger('Failed to update follow status');
    }
  };

  return {
    profile,
    playlists,
    pending,
    error,
    loadProfile,
    toggleFollow
  };
}

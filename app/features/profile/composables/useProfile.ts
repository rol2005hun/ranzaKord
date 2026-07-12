import type { PlaylistSummary } from '@/features/playlists/types/playlists.types';

export interface UserProfile {
  sub: string;
  name: string;
  picture: string;
  isPublicProfile: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface UserProfileResponse {
  profile: UserProfile;
  playlists: PlaylistSummary[];
}

export function useProfile(userId: string) {
  const toast = useToast();

  const profile = ref<UserProfile | null>(null);
  const playlists = ref<PlaylistSummary[]>([]);
  const pending = ref(true);
  const error = ref<Error | null>(null);

  const loadProfile = async () => {
    pending.value = true;
    error.value = null;
    try {
      const response = await $fetch<UserProfileResponse>('/api/user/profile', {
        query: { id: userId }
      });
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

    // Optimistic update
    profile.value.isFollowing = !prevFollowing;
    profile.value.followersCount += prevFollowing ? -1 : 1;

    try {
      await $fetch('/api/user/follow', {
        method: 'POST',
        body: { targetSub: userId, action }
      });
    } catch {
      // Revert on error
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

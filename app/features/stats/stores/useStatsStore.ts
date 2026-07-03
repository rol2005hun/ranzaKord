import type { TopTrackAggregated, TopArtistAggregated } from '../types/stats.types';

interface StatsResponse {
  topTracks: TopTrackAggregated[];
  topArtists: TopArtistAggregated[];
  totalListenSeconds: number;
}

export const useStatsStore = defineStore('stats', () => {
  const topTracks = ref<TopTrackAggregated[]>([]);
  const topArtists = ref<TopArtistAggregated[]>([]);
  const totalListeningSeconds = ref(0);
  const isLoading = ref(false);

  async function fetchStats() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const data = await $fetch<StatsResponse>('/api/stats');
      topTracks.value = data.topTracks;
      topArtists.value = data.topArtists;
      totalListeningSeconds.value = data.totalListenSeconds;
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    topTracks,
    topArtists,
    totalListeningSeconds,
    isLoading,
    fetchStats
  };
});

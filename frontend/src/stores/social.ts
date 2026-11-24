import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '../api/client.js';
import { FriendRelation, LibraryComparisonItem } from '../types/social.js';
import { MediaItem } from '../types/media.js';

export const useSocialStore = defineStore('social', () => {
  const friends = ref<FriendRelation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Comparison state
  const comparisonData = ref<{
    friend: { id: string; username: string; avatarUrl?: string | null };
    totalFriendItems: number;
    sharedCompletedCount: number;
    comparisonList: LibraryComparisonItem[];
  } | null>(null);
  const comparing = ref(false);

  // Recommendations state
  const topGenres = ref<string[]>([]);
  const recommendations = ref<MediaItem[]>([]);
  const loadingRecs = ref(false);

  async function fetchFriends() {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.get<{ friends: FriendRelation[] }>('/social/friends');
      friends.value = res.data.friends;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch friends';
    } finally {
      loading.value = false;
    }
  }

  async function sendFriendRequest(username: string) {
    try {
      const res = await apiClient.post('/social/friends/request', { username });
      await fetchFriends();
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send friend request');
    }
  }

  async function respondFriendRequest(friendshipId: string, action: 'ACCEPT' | 'DECLINE') {
    try {
      await apiClient.patch(`/social/friends/${friendshipId}`, { action });
      await fetchFriends();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to respond to request');
    }
  }

  async function compareWithFriend(friendId: string, mediaType?: string) {
    comparing.value = true;
    try {
      const res = await apiClient.get('/social/compare/' + friendId, {
        params: mediaType ? { mediaType } : {},
      });
      comparisonData.value = res.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to compare libraries';
    } finally {
      comparing.value = false;
    }
  }

  async function fetchRecommendations() {
    loadingRecs.value = true;
    try {
      const res = await apiClient.get<{ topGenres: string[]; recommendations: MediaItem[] }>(
        '/social/recommendations'
      );
      topGenres.value = res.data.topGenres;
      recommendations.value = res.data.recommendations;
    } catch (err) {
      console.warn('Failed to load recommendations', err);
    } finally {
      loadingRecs.value = false;
    }
  }

  return {
    friends,
    loading,
    error,
    comparisonData,
    comparing,
    topGenres,
    recommendations,
    loadingRecs,
    fetchFriends,
    sendFriendRequest,
    respondFriendRequest,
    compareWithFriend,
    fetchRecommendations,
  };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client.js';
import { UserLibraryItem, MediaType, ItemStatus, MediaItem } from '../types/media.js';

export const useLibraryStore = defineStore('library', () => {
  const items = ref<UserLibraryItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filters
  const selectedType = ref<MediaType | 'ALL'>('ALL');
  const selectedStatus = ref<ItemStatus | 'ALL'>('ALL');
  const searchQuery = ref('');

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (selectedType.value !== 'ALL' && item.mediaItem.mediaType !== selectedType.value) {
        return false;
      }
      if (selectedStatus.value !== 'ALL' && item.status !== selectedStatus.value) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        return (
          item.mediaItem.title.toLowerCase().includes(q) ||
          item.mediaItem.originalTitle?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  // Stats
  const stats = computed(() => {
    return {
      total: items.value.length,
      inProgress: items.value.filter((i) => i.status === 'IN_PROGRESS').length,
      completed: items.value.filter((i) => i.status === 'COMPLETED').length,
      planToConsume: items.value.filter((i) => i.status === 'PLAN_TO_CONSUME').length,
      onHold: items.value.filter((i) => i.status === 'ON_HOLD').length,
      dropped: items.value.filter((i) => i.status === 'DROPPED').length,
    };
  });

  async function fetchLibrary() {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.get<{ items: UserLibraryItem[] }>('/library');
      items.value = res.data.items;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch library';
    } finally {
      loading.value = false;
    }
  }

  async function addToLibrary(payload: {
    mediaItem: Partial<MediaItem>;
    status?: ItemStatus;
    rating?: number;
    progressUnits?: number;
    customPlatform?: string;
    notes?: string;
  }) {
    loading.value = true;
    try {
      const res = await apiClient.post<{ libraryEntry: UserLibraryItem }>('/library', payload);
      const existingIdx = items.value.findIndex((i) => i.id === res.data.libraryEntry.id);
      if (existingIdx !== -1) {
        items.value[existingIdx] = res.data.libraryEntry;
      } else {
        items.value.unshift(res.data.libraryEntry);
      }
      return res.data.libraryEntry;
    } catch (err: any) {
      error.value = err.message || 'Failed to add item to library';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateLibraryItem(
    id: string,
    updates: {
      status?: ItemStatus;
      rating?: number | null;
      progressUnits?: number;
      notes?: string | null;
      customPlatform?: string | null;
    }
  ) {
    try {
      const res = await apiClient.patch<{ libraryEntry: UserLibraryItem }>(`/library/${id}`, updates);
      const idx = items.value.findIndex((i) => i.id === id);
      if (idx !== -1) {
        items.value[idx] = res.data.libraryEntry;
      }
      return res.data.libraryEntry;
    } catch (err: any) {
      error.value = err.message || 'Failed to update library item';
      throw err;
    }
  }

  async function incrementProgress(item: UserLibraryItem) {
    const nextProgress = item.progressUnits + 1;
    let newStatus = item.status;
    if (item.status === 'PLAN_TO_CONSUME') {
      newStatus = 'IN_PROGRESS';
    }
    return updateLibraryItem(item.id, {
      progressUnits: nextProgress,
      status: newStatus,
    });
  }

  async function removeFromLibrary(id: string) {
    try {
      await apiClient.delete(`/library/${id}`);
      items.value = items.value.filter((i) => i.id !== id);
    } catch (err: any) {
      error.value = err.message || 'Failed to remove library item';
      throw err;
    }
  }

  function getLibraryItemByExternalId(mediaType: MediaType, externalSource: string, externalId: string) {
    return items.value.find(
      (i) =>
        i.mediaItem.mediaType === mediaType &&
        i.mediaItem.externalSource === externalSource &&
        i.mediaItem.externalId === externalId
    );
  }

  return {
    items,
    loading,
    error,
    selectedType,
    selectedStatus,
    searchQuery,
    filteredItems,
    stats,
    fetchLibrary,
    addToLibrary,
    updateLibraryItem,
    incrementProgress,
    removeFromLibrary,
    getLibraryItemByExternalId,
  };
});

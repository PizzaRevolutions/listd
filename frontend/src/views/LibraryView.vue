<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Film, 
  Tv, 
  Sparkles, 
  BookOpen, 
  Gamepad2, 
  Music, 
  Search, 
  Layers,
  Plus
} from 'lucide-vue-next';
import { useLibraryStore } from '../stores/library.js';
import { MediaType, ItemStatus, MediaItem, UserLibraryItem } from '../types/media.js';
import MediaCard from '../components/MediaCard.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';

const libraryStore = useLibraryStore();

const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isModalOpen = ref(false);

onMounted(async () => {
  await libraryStore.fetchLibrary();
});

const mediaCategories: { type: MediaType | 'ALL'; label: string; icon: any }[] = [
  { type: 'ALL', label: 'All Media', icon: Layers },
  { type: 'MOVIE', label: 'Movies', icon: Film },
  { type: 'TV', label: 'TV Shows', icon: Tv },
  { type: 'ANIME', label: 'Anime', icon: Sparkles },
  { type: 'MANGA', label: 'Manga', icon: BookOpen },
  { type: 'GAME', label: 'Games', icon: Gamepad2 },
  { type: 'MUSIC', label: 'Music', icon: Music },
];

const statusTabs: { status: ItemStatus | 'ALL'; label: string }[] = [
  { status: 'ALL', label: 'All' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'PLAN_TO_CONSUME', label: 'Plan to Watch / Play' },
  { status: 'ON_HOLD', label: 'On Hold' },
  { status: 'DROPPED', label: 'Dropped' },
];

function openDetail(media: Partial<MediaItem>) {
  selectedMedia.value = media;
  isModalOpen.value = true;
}

async function handleIncrement(item: UserLibraryItem) {
  await libraryStore.incrementProgress(item);
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Media Library</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1">
          Managing {{ libraryStore.filteredItems.length }} tracked titles
        </p>
      </div>

      <router-link
        to="/discover"
        class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors self-start sm:self-auto"
      >
        <Plus class="w-4 h-4" />
        Add New Title
      </router-link>
    </div>

    <!-- Media Category Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="cat in mediaCategories"
        :key="cat.type"
        class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border"
        :class="[
          libraryStore.selectedType === cat.type
            ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
            : 'bg-dark-surface border-dark-border/60 text-gray-300 hover:text-white hover:bg-dark-card'
        ]"
        @click="libraryStore.selectedType = cat.type"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-dark-surface border border-dark-border/60 rounded-2xl">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="tab in statusTabs"
          :key="tab.status"
          class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            libraryStore.selectedStatus === tab.status
              ? 'bg-dark-card text-brand-400 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          ]"
          @click="libraryStore.selectedStatus = tab.status"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input within Library -->
      <div class="relative w-full sm:w-64 shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="libraryStore.searchQuery"
          type="text"
          placeholder="Filter by title..."
          class="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="libraryStore.filteredItems.length === 0"
      class="text-center py-16 px-4 bg-dark-surface/40 border border-dark-border/40 rounded-3xl"
    >
      <Layers class="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
      <h3 class="text-base font-bold text-gray-200">No media found in this filter</h3>
      <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
        Try selecting another status tab or add new media to your collection from the Discover section.
      </p>
      <router-link
        to="/discover"
        class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
      >
        <Search class="w-4 h-4" />
        Explore Catalog
      </router-link>
    </div>

    <!-- Media Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <MediaCard
        v-for="item in libraryStore.filteredItems"
        :key="item.id"
        :media="item.mediaItem"
        :library-item="item"
        @click="openDetail(item.mediaItem)"
        @increment="handleIncrement(item)"
      />
    </div>

    <!-- Detail Modal -->
    <MediaDetailModal
      :media="selectedMedia"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />
  </div>
</template>

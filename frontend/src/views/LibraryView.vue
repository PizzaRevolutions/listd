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
  { type: 'ALL', label: 'All', icon: Layers },
  { type: 'MOVIE', label: 'Movies', icon: Film },
  { type: 'TV', label: 'TV Series', icon: Tv },
  { type: 'ANIME', label: 'Anime', icon: Sparkles },
  { type: 'MANGA', label: 'Manga', icon: BookOpen },
  { type: 'GAME', label: 'Games', icon: Gamepad2 },
  { type: 'MUSIC', label: 'Music', icon: Music },
];

const statusTabs: { status: ItemStatus | 'ALL'; label: string }[] = [
  { status: 'ALL', label: 'All' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'PLAN_TO_CONSUME', label: 'Planned' },
  { status: 'ON_HOLD', label: 'On hold' },
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
        <h1 class="text-xl sm:text-2xl font-semibold text-white tracking-tight">Library</h1>
        <p class="text-xs text-carbon-400 mt-0.5">
          {{ libraryStore.filteredItems.length }} titles recorded
        </p>
      </div>

      <router-link
        to="/discover"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-carbon-100 hover:bg-white text-carbon-950 text-xs font-medium rounded-lg shadow-sm transition-colors self-start sm:self-auto"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add title</span>
      </router-link>
    </div>

    <!-- Category Filter Bar -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="cat in mediaCategories"
        :key="cat.type"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border"
        :class="[
          libraryStore.selectedType === cat.type
            ? 'bg-carbon-800 text-white border-white/[0.12]'
            : 'bg-carbon-900 border-white/[0.06] text-carbon-400 hover:text-white hover:bg-carbon-850'
        ]"
        @click="libraryStore.selectedType = cat.type"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5 text-carbon-400" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Status Tabs & Filter -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 bg-carbon-900 border border-white/[0.06] rounded-xl">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="tab in statusTabs"
          :key="tab.status"
          class="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            libraryStore.selectedStatus === tab.status
              ? 'bg-carbon-800 text-white'
              : 'text-carbon-400 hover:text-carbon-200'
          ]"
          @click="libraryStore.selectedStatus = tab.status"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input within Library -->
      <div class="relative w-full sm:w-60 shrink-0">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-carbon-500" />
        <input
          v-model="libraryStore.searchQuery"
          type="text"
          placeholder="Filter titles..."
          class="w-full bg-carbon-950 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-carbon-500 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="libraryStore.filteredItems.length === 0"
      class="text-center py-14 px-4 bg-carbon-900/50 border border-white/[0.06] rounded-2xl"
    >
      <Layers class="w-8 h-8 text-carbon-600 mx-auto mb-2.5" />
      <h3 class="text-sm font-medium text-carbon-200">No titles match this filter</h3>
      <p class="text-xs text-carbon-400 mt-1 max-w-sm mx-auto">
        Switch category tabs or search the catalog to track new media.
      </p>
      <router-link
        to="/discover"
        class="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 bg-carbon-800 hover:bg-carbon-700 text-carbon-200 border border-white/[0.08] text-xs font-medium rounded-lg transition-colors"
      >
        <Search class="w-3.5 h-3.5" />
        <span>Search catalog</span>
      </router-link>
    </div>

    <!-- Media Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

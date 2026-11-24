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
  <div class="space-y-6 pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 px-1">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Your Library</h1>
        <p class="text-xs text-zinc-400 mt-0.5">
          {{ libraryStore.filteredItems.length }} titles recorded
        </p>
      </div>

      <router-link
        to="/discover"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-full shadow-sm transition-all active:scale-95"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add title</span>
      </router-link>
    </div>

    <!-- Category Filter Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        v-for="cat in mediaCategories"
        :key="cat.type"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border active:scale-95"
        :class="[
          libraryStore.selectedType === cat.type
            ? 'bg-white text-black border-white'
            : 'bg-[#16171B] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-[#202227]'
        ]"
        @click="libraryStore.selectedType = cat.type"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Status Tabs & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#121316] border border-white/[0.06] rounded-[20px]">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="tab in statusTabs"
          :key="tab.status"
          class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            libraryStore.selectedStatus === tab.status
              ? 'bg-white/10 text-white'
              : 'text-zinc-400 hover:text-white'
          ]"
          @click="libraryStore.selectedStatus = tab.status"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input within Library -->
      <div class="relative w-full sm:w-64 shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          v-model="libraryStore.searchQuery"
          type="text"
          placeholder="Filter titles..."
          class="w-full bg-black/60 border border-white/[0.08] rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="libraryStore.filteredItems.length === 0"
      class="text-center py-16 px-4 bg-[#121316]/50 border border-white/[0.06] rounded-[24px]"
    >
      <Layers class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
      <h3 class="text-sm font-semibold text-zinc-200">No titles match this filter</h3>
      <p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
        Switch category tabs or search the catalog to track new media.
      </p>
      <router-link
        to="/discover"
        class="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#16171B] hover:bg-[#202227] text-white border border-white/[0.08] text-xs font-semibold rounded-full transition-colors"
      >
        <Search class="w-3.5 h-3.5" />
        <span>Search catalog</span>
      </router-link>
    </div>

    <!-- Media Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

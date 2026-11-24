<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Compass, 
  Bookmark 
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';
import { useLibraryStore } from '../stores/library.js';
import { useSocialStore } from '../stores/social.js';
import { MediaItem, UserLibraryItem } from '../types/media.js';
import MediaCard from '../components/MediaCard.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';

const authStore = useAuthStore();
const libraryStore = useLibraryStore();
const socialStore = useSocialStore();

const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isModalOpen = ref(false);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await Promise.all([
      libraryStore.fetchLibrary(),
      socialStore.fetchRecommendations(),
    ]);
  }
});

const inProgressItems = computed(() => {
  return libraryStore.items.filter((i) => i.status === 'IN_PROGRESS');
});

function openDetail(media: Partial<MediaItem>) {
  selectedMedia.value = media;
  isModalOpen.value = true;
}

function handleAdd(media: Partial<MediaItem>) {
  openDetail(media);
}

async function handleIncrement(item: UserLibraryItem) {
  await libraryStore.incrementProgress(item);
}
</script>

<template>
  <div class="space-y-7 pb-16">
    <!-- Calm Header Block -->
    <div class="p-6 sm:p-8 bg-carbon-900 border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div class="space-y-2 max-w-xl">
        <span class="text-[11px] font-mono uppercase tracking-wider text-carbon-400 block">
          Personal Media Archive
        </span>
        <h1 class="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Unified Catalog & Tracker
        </h1>
        <p class="text-xs sm:text-sm text-carbon-300 leading-relaxed">
          Manage progress across film, television, anime, manga, games, and music with direct streaming access and library comparison.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <router-link
          to="/discover"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-carbon-100 hover:bg-white text-carbon-950 text-xs font-medium transition-colors shadow-sm"
        >
          <Compass class="w-3.5 h-3.5" />
          <span>Discover</span>
        </router-link>
        <router-link
          to="/library"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-carbon-800 hover:bg-carbon-750 text-carbon-200 border border-white/[0.08] text-xs font-medium transition-colors"
        >
          <Bookmark class="w-3.5 h-3.5 text-carbon-400" />
          <span>Library</span>
        </router-link>
      </div>
    </div>

    <!-- Stats Row (Archival metrics) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 bg-carbon-900 border border-white/[0.08] rounded-xl">
        <span class="text-[11px] text-carbon-400 block font-medium">Total entries</span>
        <span class="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
          {{ libraryStore.stats.total }}
        </span>
      </div>

      <div class="p-4 bg-carbon-900 border border-white/[0.08] rounded-xl">
        <span class="text-[11px] text-carbon-400 block font-medium">In progress</span>
        <span class="text-2xl font-mono tabular-nums font-semibold text-amber-400 mt-1 block">
          {{ libraryStore.stats.inProgress }}
        </span>
      </div>

      <div class="p-4 bg-carbon-900 border border-white/[0.08] rounded-xl">
        <span class="text-[11px] text-carbon-400 block font-medium">Completed</span>
        <span class="text-2xl font-mono tabular-nums font-semibold text-carbon-100 mt-1 block">
          {{ libraryStore.stats.completed }}
        </span>
      </div>

      <div class="p-4 bg-carbon-900 border border-white/[0.08] rounded-xl">
        <span class="text-[11px] text-carbon-400 block font-medium">Planned queue</span>
        <span class="text-2xl font-mono tabular-nums font-semibold text-carbon-300 mt-1 block">
          {{ libraryStore.stats.planToConsume }}
        </span>
      </div>
    </div>

    <!-- Currently In Progress Section -->
    <div v-if="inProgressItems.length > 0" class="space-y-3.5">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-white">Continue progress</h2>
          <span class="text-xs font-mono text-carbon-500">({{ inProgressItems.length }})</span>
        </div>
        <router-link to="/library" class="text-xs text-carbon-400 hover:text-white transition-colors">
          View all &rarr;
        </router-link>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MediaCard
          v-for="item in inProgressItems.slice(0, 6)"
          :key="item.id"
          :media="item.mediaItem"
          :library-item="item"
          @click="openDetail(item.mediaItem)"
          @increment="handleIncrement(item)"
        />
      </div>
    </div>

    <!-- Recommendations Section -->
    <div v-if="socialStore.recommendations.length > 0" class="space-y-3.5">
      <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-white">Suggested titles</h2>
          <span
            v-if="socialStore.topGenres.length"
            class="hidden sm:inline text-xs text-carbon-400 font-normal"
          >
            Matching {{ socialStore.topGenres.slice(0, 3).join(', ') }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MediaCard
          v-for="media in socialStore.recommendations.slice(0, 6)"
          :key="media.id"
          :media="media"
          :library-item="libraryStore.getLibraryItemByExternalId(media.mediaType, media.externalSource, media.externalId)"
          @click="openDetail(media)"
          @add="handleAdd(media)"
        />
      </div>
    </div>

    <!-- Detail Modal -->
    <MediaDetailModal
      :media="selectedMedia"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />
  </div>
</template>

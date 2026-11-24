<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Layers 
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
  <div class="space-y-8 pb-16">
    <!-- Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/60 via-dark-surface to-dark-surface border border-dark-border/80 p-6 sm:p-10 shadow-2xl">
      <div class="relative z-10 max-w-2xl space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold">
          <Sparkles class="w-3.5 h-3.5" />
          Unified Tracking Hub
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Track Everything <br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">
            In One Single Place.
          </span>
        </h1>
        <p class="text-gray-300 text-sm sm:text-base leading-relaxed">
          Movies, TV Shows, Anime, Manga, Games, and Music. Track progress, compare libraries with friends, and launch titles directly with 1-Click access.
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <router-link
            to="/discover"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all"
          >
            <Compass class="w-4 h-4" />
            Discover & Add Media
          </router-link>
          <router-link
            to="/library"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-card hover:bg-dark-border text-gray-200 border border-dark-border text-sm font-semibold transition-all"
          >
            <Bookmark class="w-4 h-4" />
            View My Library
          </router-link>
        </div>
      </div>

      <!-- Background decorative glow -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 sm:p-5 bg-dark-surface border border-dark-border/60 rounded-2xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <Layers class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block font-medium">Total Tracked</span>
          <span class="text-2xl font-bold text-white">{{ libraryStore.stats.total }}</span>
        </div>
      </div>

      <div class="p-4 sm:p-5 bg-dark-surface border border-dark-border/60 rounded-2xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block font-medium">In Progress</span>
          <span class="text-2xl font-bold text-white">{{ libraryStore.stats.inProgress }}</span>
        </div>
      </div>

      <div class="p-4 sm:p-5 bg-dark-surface border border-dark-border/60 rounded-2xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block font-medium">Completed</span>
          <span class="text-2xl font-bold text-white">{{ libraryStore.stats.completed }}</span>
        </div>
      </div>

      <div class="p-4 sm:p-5 bg-dark-surface border border-dark-border/60 rounded-2xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Bookmark class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block font-medium">Plan to Watch/Play</span>
          <span class="text-2xl font-bold text-white">{{ libraryStore.stats.planToConsume }}</span>
        </div>
      </div>
    </div>

    <!-- Currently In Progress Section -->
    <div v-if="inProgressItems.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 text-amber-400" />
          <h2 class="text-lg sm:text-xl font-bold text-white">Continue Watching & Playing</h2>
        </div>
        <router-link to="/library" class="text-xs text-brand-400 hover:text-brand-300 font-semibold">
          View All &rarr;
        </router-link>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
    <div v-if="socialStore.recommendations.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-brand-400" />
          <h2 class="text-lg sm:text-xl font-bold text-white">Recommended for You</h2>
          <span
            v-if="socialStore.topGenres.length"
            class="hidden sm:inline text-xs text-gray-400 font-normal"
          >
            (Based on your taste: {{ socialStore.topGenres.join(', ') }})
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

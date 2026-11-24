<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { 
  Search, 
  Film, 
  Tv, 
  Sparkles, 
  BookOpen, 
  Gamepad2, 
  Music, 
  Loader2 
} from 'lucide-vue-next';
import { searchTMDB } from '../api/external/tmdb.js';
import { searchAniList } from '../api/external/anilist.js';
import { searchRAWG } from '../api/external/rawg.js';
import { searchMusic } from '../api/external/spotify.js';
import { MediaItem } from '../types/media.js';
import { useLibraryStore } from '../stores/library.js';
import MediaCard from '../components/MediaCard.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';

const libraryStore = useLibraryStore();

type SearchCategory = 'movie' | 'tv' | 'anime' | 'manga' | 'game' | 'music';

const activeCategory = ref<SearchCategory>('movie');
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<Partial<MediaItem>[]>([]);

const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isModalOpen = ref(false);

let debounceTimer: any = null;

const categories: { key: SearchCategory; label: string; icon: any; placeholder: string }[] = [
  { key: 'movie', label: 'Movies', icon: Film, placeholder: 'Search films (e.g. Interstellar, Dune)' },
  { key: 'tv', label: 'TV Shows', icon: Tv, placeholder: 'Search series (e.g. Breaking Bad, Arcane)' },
  { key: 'anime', label: 'Anime', icon: Sparkles, placeholder: 'Search anime (e.g. Attack on Titan, Frieren)' },
  { key: 'manga', label: 'Manga', icon: BookOpen, placeholder: 'Search manga (e.g. Berserk, One Piece)' },
  { key: 'game', label: 'Video Games', icon: Gamepad2, placeholder: 'Search games (e.g. Elden Ring, Zelda)' },
  { key: 'music', label: 'Music', icon: Music, placeholder: 'Search albums or artists (e.g. Daft Punk)' },
];

async function performSearch() {
  const q = searchQuery.value.trim();
  if (!q) {
    loadDefaults();
    return;
  }

  isSearching.value = true;
  try {
    switch (activeCategory.value) {
      case 'movie':
        searchResults.value = await searchTMDB(q, 'movie');
        break;
      case 'tv':
        searchResults.value = await searchTMDB(q, 'tv');
        break;
      case 'anime':
        searchResults.value = await searchAniList(q, 'ANIME');
        break;
      case 'manga':
        searchResults.value = await searchAniList(q, 'MANGA');
        break;
      case 'game':
        searchResults.value = await searchRAWG(q);
        break;
      case 'music':
        searchResults.value = await searchMusic(q);
        break;
    }
  } catch (err) {
    console.error('Search error', err);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

async function loadDefaults() {
  isSearching.value = true;
  try {
    switch (activeCategory.value) {
      case 'movie':
        searchResults.value = await searchTMDB('Avengers', 'movie');
        break;
      case 'tv':
        searchResults.value = await searchTMDB('Game of Thrones', 'tv');
        break;
      case 'anime':
        searchResults.value = await searchAniList('Attack on Titan', 'ANIME');
        break;
      case 'manga':
        searchResults.value = await searchAniList('Berserk', 'MANGA');
        break;
      case 'game':
        searchResults.value = await searchRAWG('Witcher');
        break;
      case 'music':
        searchResults.value = await searchMusic('Radiohead');
        break;
    }
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performSearch();
  }, 350);
});

watch(activeCategory, () => {
  performSearch();
});

onMounted(() => {
  loadDefaults();
});

function openDetail(media: Partial<MediaItem>) {
  selectedMedia.value = media;
  isModalOpen.value = true;
}

function handleAdd(media: Partial<MediaItem>) {
  openDetail(media);
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-semibold text-white tracking-tight">
        Discover
      </h1>
      <p class="text-xs text-carbon-400 mt-0.5">
        Query TMDB, AniList, RAWG and Apple Music standard catalogs
      </p>
    </div>

    <!-- Category selector tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border"
        :class="[
          activeCategory === cat.key
            ? 'bg-carbon-800 text-white border-white/[0.12]'
            : 'bg-carbon-900 border-white/[0.06] text-carbon-400 hover:text-white hover:bg-carbon-850'
        ]"
        @click="activeCategory = cat.key"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5 text-carbon-400" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Live Search Input -->
    <div class="relative">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="categories.find(c => c.key === activeCategory)?.placeholder"
        class="w-full bg-carbon-900 border border-white/[0.08] focus:border-amber-500/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-carbon-500 focus:outline-none transition-colors"
      />
      <div v-if="isSearching" class="absolute right-3.5 top-1/2 -translate-y-1/2">
        <Loader2 class="w-4 h-4 text-carbon-400 animate-spin" />
      </div>
    </div>

    <!-- Search Results Grid -->
    <div>
      <div v-if="searchResults.length === 0 && !isSearching" class="text-center py-14 text-carbon-500 text-xs">
        No results found
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MediaCard
          v-for="media in searchResults"
          :key="media.externalId"
          :media="media"
          :library-item="media.mediaType && media.externalSource && media.externalId ? libraryStore.getLibraryItemByExternalId(media.mediaType, media.externalSource, media.externalId) : null"
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

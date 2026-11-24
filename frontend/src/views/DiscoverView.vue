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
  <div class="space-y-6 pb-20">
    <!-- Header -->
    <div class="px-1">
      <h1 class="text-2xl font-bold text-white tracking-tight">
        Discover
      </h1>
      <p class="text-xs text-zinc-400 mt-0.5">
        Explore movies, TV, anime, manga, games, and music catalogs
      </p>
    </div>

    <!-- Category selector pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border active:scale-95"
        :class="[
          activeCategory === cat.key
            ? 'bg-white text-black border-white'
            : 'bg-[#16171B] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-[#202227]'
        ]"
        @click="activeCategory = cat.key"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Live Search Input Pill -->
    <div class="relative">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="categories.find(c => c.key === activeCategory)?.placeholder"
        class="w-full bg-[#121316] border border-white/[0.08] focus:border-white/30 rounded-full pl-11 pr-11 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors shadow-lg"
      />
      <div v-if="isSearching" class="absolute right-4 top-1/2 -translate-y-1/2">
        <Loader2 class="w-4 h-4 text-zinc-400 animate-spin" />
      </div>
    </div>

    <!-- Search Results Grid -->
    <div>
      <div v-if="searchResults.length === 0 && !isSearching" class="text-center py-16 text-zinc-500 text-xs">
        No results found
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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

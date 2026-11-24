<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Search, 
  Film, 
  Tv, 
  Sparkles, 
  BookOpen, 
  Gamepad2, 
  Music, 
  Loader2,
  X
} from 'lucide-vue-next';
import { searchTMDB, getTMDBDetails } from '../api/external/tmdb.js';
import { searchAniList } from '../api/external/anilist.js';
import { searchRAWG } from '../api/external/rawg.js';
import { searchMusic } from '../api/external/spotify.js';
import { MediaItem } from '../types/media.js';
import { useLibraryStore } from '../stores/library.js';
import MediaCard from '../components/MediaCard.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';

const route = useRoute();
const libraryStore = useLibraryStore();

type SearchCategory = 'movie' | 'tv' | 'anime' | 'manga' | 'game' | 'music';

const activeCategory = ref<SearchCategory>('movie');
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<Partial<MediaItem>[]>([]);

const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isModalOpen = ref(false);

let debounceTimer: any = null;

interface CategoryConfig {
  key: SearchCategory;
  label: string;
  icon: any;
  placeholder: string;
  suggestions: string[];
}

const categories: CategoryConfig[] = [
  { 
    key: 'movie', 
    label: 'Movies', 
    icon: Film, 
    placeholder: 'Search movies (e.g. Interstellar, Dune)',
    suggestions: ['Interstellar', 'Dune', 'Oppenheimer', 'Spirited Away', 'The Dark Knight']
  },
  { 
    key: 'tv', 
    label: 'TV Shows', 
    icon: Tv, 
    placeholder: 'Search TV series (e.g. Breaking Bad, Arcane)',
    suggestions: ['Breaking Bad', 'Severance', 'Stranger Things', 'Arcane', 'Succession']
  },
  { 
    key: 'anime', 
    label: 'Anime', 
    icon: Sparkles, 
    placeholder: 'Search anime (e.g. Attack on Titan, Frieren)',
    suggestions: ['Attack on Titan', 'Frieren', 'Jujutsu Kaisen', 'Chainsaw Man', 'Death Note']
  },
  { 
    key: 'manga', 
    label: 'Manga', 
    icon: BookOpen, 
    placeholder: 'Search manga (e.g. Berserk, One Piece)',
    suggestions: ['Berserk', 'One Piece', 'Vagabond', 'Monster', 'Tokyo Ghoul']
  },
  { 
    key: 'game', 
    label: 'Video Games', 
    icon: Gamepad2, 
    placeholder: 'Search games (e.g. Elden Ring, Zelda)',
    suggestions: ['Elden Ring', 'Zelda: Tears of the Kingdom', 'Baldur\'s Gate 3', 'Cyberpunk 2077']
  },
  { 
    key: 'music', 
    label: 'Music', 
    icon: Music, 
    placeholder: 'Search albums or artists (e.g. Daft Punk)',
    suggestions: ['Daft Punk', 'Radiohead', 'Pink Floyd', 'The Weeknd', 'Kendrick Lamar']
  },
];

const activeCategoryData = computed(() => {
  return categories.find(c => c.key === activeCategory.value) || categories[0];
});

async function performSearch() {
  const q = searchQuery.value.trim();
  if (!q) {
    searchResults.value = [];
    isSearching.value = false;
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

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
}

function selectSuggestion(title: string) {
  searchQuery.value = title;
  performSearch();
}

watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer);
  if (!newVal.trim()) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }
  debounceTimer = setTimeout(() => {
    performSearch();
  }, 350);
});

watch(activeCategory, () => {
  if (searchQuery.value.trim()) {
    performSearch();
  } else {
    searchResults.value = [];
  }
});

onMounted(() => {
  if (route.query.category && categories.some(c => c.key === route.query.category)) {
    activeCategory.value = route.query.category as SearchCategory;
  }
  if (route.query.q) {
    searchQuery.value = String(route.query.q);
    performSearch();
  }
});

async function openDetail(media: Partial<MediaItem>) {
  selectedMedia.value = media;
  isModalOpen.value = true;

  if (media.externalSource === 'omdb' || media.externalSource === 'tvmaze' || media.externalSource === 'tmdb') {
    if (media.externalId && (!media.metadata?.overview || !media.metadata?.runtime)) {
      const type = media.mediaType === 'TV' ? 'tv' : 'movie';
      const full = await getTMDBDetails(media.externalId, type);
      if (full) {
        selectedMedia.value = { ...media, ...full };
      }
    }
  }
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
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 border"
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
        :placeholder="activeCategoryData.placeholder"
        class="w-full bg-[#121316] border border-white/[0.08] focus:border-white/30 rounded-full pl-11 pr-11 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors duration-150"
      />
      <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
        <Loader2 v-if="isSearching" class="w-4 h-4 text-zinc-400 animate-spin" />
        <button
          v-else-if="searchQuery"
          @click="clearSearch"
          class="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Clear search"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Content Area: Prompt State vs Loading vs Empty Results vs Search Results -->
    <div>
      <!-- 1. Initial State: Start typing to discover content -->
      <div 
        v-if="!searchQuery.trim() && !isSearching" 
        class="mt-4 bg-[#121316] border border-white/[0.08] rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto"
      >
        <div class="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-[#16171B] border border-white/[0.08]">
          <component :is="activeCategoryData.icon" class="w-7 h-7 text-white" />
          <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
            <Search class="w-3 h-3" />
          </div>
        </div>

        <p class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
          Explore {{ activeCategoryData.label }}
        </p>
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Start typing to discover content
        </h2>
        <p class="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
          Type any title, franchise, or creator to explore our catalog and add items directly to your lists.
        </p>

        <!-- Quick suggestion pills -->
        <div class="mt-6 pt-6 border-t border-white/[0.06]">
          <p class="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Popular in {{ activeCategoryData.label }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button
              v-for="item in activeCategoryData.suggestions"
              :key="item"
              @click="selectSuggestion(item)"
              class="px-3.5 py-1.5 rounded-full bg-[#16171B] hover:bg-white hover:text-black border border-white/[0.08] text-xs text-zinc-300 font-medium transition-colors duration-150"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Loading State -->
      <div v-else-if="isSearching" class="text-center py-20 space-y-3">
        <Loader2 class="w-7 h-7 text-white animate-spin mx-auto" />
        <p class="text-xs text-zinc-400">
          Searching {{ activeCategoryData.label.toLowerCase() }} for "{{ searchQuery }}"...
        </p>
      </div>

      <!-- 3. No Results State -->
      <div 
        v-else-if="searchResults.length === 0" 
        class="mt-4 bg-[#121316] border border-white/[0.08] rounded-3xl p-8 sm:p-10 text-center max-w-md mx-auto"
      >
        <div class="w-12 h-12 rounded-2xl bg-[#16171B] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-400">
          <Search class="w-5 h-5" />
        </div>
        <h3 class="text-base font-bold text-white">
          No results found
        </h3>
        <p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">
          We couldn't find any {{ activeCategoryData.label.toLowerCase() }} matching "{{ searchQuery }}". Try checking for typos or searching with different keywords.
        </p>
      </div>

      <!-- 4. Search Results Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

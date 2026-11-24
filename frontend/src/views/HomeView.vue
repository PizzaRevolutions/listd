<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  MessageSquare, 
  ChevronRight
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';
import { useLibraryStore } from '../stores/library.js';
import { useSocialStore } from '../stores/social.js';
import { MediaItem, UserLibraryItem } from '../types/media.js';
import MediaCard from '../components/MediaCard.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const libraryStore = useLibraryStore();
const socialStore = useSocialStore();

const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isModalOpen = ref(false);

// Monochrome sketch/avatar fallback matching the mockup vibe
const heroAvatar = computed(() => {
  return authStore.user?.avatarUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80';
});

// Curated starter items if the library is currently empty
const fallbackLikedFictions: Partial<MediaItem>[] = [
  {
    id: 'f1',
    title: 'Cyberpunk: Edgerunners',
    mediaType: 'ANIME',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2022-09-13',
    metadata: { voteAverage: 8.9 }
  },
  {
    id: 'f2',
    title: 'Dune: Part Two',
    mediaType: 'MOVIE',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2024-03-01',
    metadata: { voteAverage: 8.6 }
  },
  {
    id: 'f3',
    title: 'Chainsaw Man',
    mediaType: 'MANGA',
    posterUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2018-12-03',
    metadata: { voteAverage: 8.8 }
  },
  {
    id: 'f4',
    title: 'Elden Ring: Shadow of the Erdtree',
    mediaType: 'GAME',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2024-06-21',
    metadata: { voteAverage: 9.4 }
  }
];

const fallbackFriendUnwatched: Partial<MediaItem>[] = [
  {
    id: 'fw1',
    title: 'Arcane: League of Legends',
    mediaType: 'TV',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2021-11-06',
    metadata: { voteAverage: 9.1 }
  },
  {
    id: 'fw2',
    title: 'Frieren: Beyond Journey\'s End',
    mediaType: 'ANIME',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2023-09-29',
    metadata: { voteAverage: 9.2 }
  },
  {
    id: 'fw3',
    title: 'Severance',
    mediaType: 'TV',
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2022-02-18',
    metadata: { voteAverage: 8.7 }
  },
  {
    id: 'fw4',
    title: 'Metaphor: ReFantazio',
    mediaType: 'GAME',
    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2024-10-11',
    metadata: { voteAverage: 9.3 }
  }
];

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await Promise.all([
      libraryStore.fetchLibrary(),
      socialStore.fetchRecommendations(),
      socialStore.fetchFriends(),
    ]);
  }
});

// Section 1: In progress / fictions you liked
const userLikedFictions = computed(() => {
  if (libraryStore.items.length > 0) {
    return libraryStore.items.map(i => ({
      media: i.mediaItem,
      libraryItem: i
    }));
  }
  return fallbackLikedFictions.map(media => ({
    media,
    libraryItem: null
  }));
});

// Section 2: Friend unwatched recommendations ("Friend Diff")
const friendDiffItems = computed(() => {
  if (socialStore.recommendations.length > 0) {
    return socialStore.recommendations.map(media => ({
      media,
      libraryItem: libraryStore.getLibraryItemByExternalId(media.mediaType, media.externalSource, media.externalId)
    }));
  }
  return fallbackFriendUnwatched.map(media => ({
    media,
    libraryItem: null
  }));
});

// Section 3: Community discussions
const discussions = [
  {
    id: 'd1',
    author: 'Enrico',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    topic: 'Should I start reading the Berserk manga or watch the 1997 anime first?',
    mediaTag: 'Berserk',
    repliesCount: 14,
    timeAgo: '2h ago'
  },
  {
    id: 'd2',
    author: 'Alex_99',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    topic: 'Dune Part 2 IMAX experience was mindblowing. How does it compare to the book?',
    mediaTag: 'Dune: Part Two',
    repliesCount: 29,
    timeAgo: '5h ago'
  },
  {
    id: 'd3',
    author: 'Maya_K',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    topic: 'Ranking all FromSoftware soundtracks: Bloodborne vs Elden Ring',
    mediaTag: 'Elden Ring',
    repliesCount: 42,
    timeAgo: '1d ago'
  }
];

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
  <div class="space-y-10 pt-2 pb-12">
    
    <!-- CENTERED USER PROFILE GREETING (Exact Ld. Mockup) -->
    <section class="flex flex-col items-center justify-center text-center pt-2">
      <!-- Circular Avatar with subtle white ring border -->
      <div class="relative group cursor-pointer" @click="router.push('/library')">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-2 ring-white/20 hover:ring-white/40 overflow-hidden bg-black p-0.5 shadow-2xl transition-all duration-300 group-hover:scale-105">
          <img
            :src="heroAvatar"
            alt="Profile avatar"
            class="w-full h-full rounded-full object-cover grayscale contrast-125"
          />
        </div>
      </div>

      <!-- User Greeting Text -->
      <div class="mt-3.5 space-y-0.5">
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Hi, {{ authStore.user?.username || 'Enrico' }}
        </h1>
        <p class="text-sm text-zinc-400 font-normal">
          there are some news.
        </p>
      </div>
    </section>

    <!-- SECTION 1: News on fictions you liked -->
    <section class="space-y-3.5">
      <div class="flex items-center justify-between px-1">
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          News on fictions you liked
        </h2>
        <router-link
          to="/library"
          class="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-0.5 font-medium"
        >
          <span>See all</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </router-link>
      </div>

      <!-- Horizontal Carousel of High-Radius Rounded Cards -->
      <div class="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        <MediaCard
          v-for="(item, index) in userLikedFictions"
          :key="item.media.id || index"
          :media="item.media"
          :library-item="item.libraryItem"
          carousel-mode
          @click="openDetail(item.media)"
          @increment="item.libraryItem && handleIncrement(item.libraryItem)"
          @add="handleAdd(item.media)"
        />
      </div>
    </section>

    <!-- SECTION 2: Your friends have watched/read these / BUT YOU HAVEN'T -->
    <section class="space-y-3.5">
      <div class="space-y-0.5 px-1">
        <p class="text-zinc-400 text-lg sm:text-xl font-normal leading-tight tracking-tight">
          Your friends have watched/read these
        </p>
        <h2 class="text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight">
          but you haven't
        </h2>
      </div>

      <!-- Horizontal Carousel of Friend Diff Recommendations -->
      <div class="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        <MediaCard
          v-for="(item, index) in friendDiffItems"
          :key="item.media.id || index"
          :media="item.media"
          :library-item="item.libraryItem"
          carousel-mode
          @click="openDetail(item.media)"
          @add="handleAdd(item.media)"
        />
      </div>
    </section>

    <!-- SECTION 3: Your followers started some discussions / DO YOU MIND JOINING? -->
    <section class="space-y-3.5">
      <div class="space-y-0.5 px-1">
        <p class="text-zinc-400 text-lg sm:text-xl font-normal leading-tight tracking-tight">
          Your followers started some discussions
        </p>
        <h2 class="text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight">
          do you mind joining?
        </h2>
      </div>

      <!-- Horizontal / Vertical Cards of Community Discussions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        <div
          v-for="disc in discussions"
          :key="disc.id"
          class="bg-[#121316] border border-white/[0.06] hover:border-white/[0.18] rounded-[22px] p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group shadow-lg"
          @click="router.push('/social')"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <img
                  :src="disc.avatar"
                  :alt="disc.author"
                  class="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                />
                <div>
                  <span class="text-xs font-semibold text-white block">{{ disc.author }}</span>
                  <span class="text-[10px] text-zinc-400 block font-mono">{{ disc.timeAgo }}</span>
                </div>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-zinc-300">
                {{ disc.mediaTag }}
              </span>
            </div>

            <p class="text-xs sm:text-sm text-zinc-200 leading-relaxed group-hover:text-white transition-colors">
              "{{ disc.topic }}"
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
            <div class="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
              <MessageSquare class="w-3.5 h-3.5" />
              <span class="font-mono text-[11px]">{{ disc.repliesCount }} comments</span>
            </div>
            <span class="text-[11px] text-zinc-300 font-medium group-hover:underline flex items-center gap-0.5">
              Join discussion &rarr;
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Detail Modal -->
    <MediaDetailModal
      :media="selectedMedia"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />

  </div>
</template>

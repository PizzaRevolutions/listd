<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  MessageSquare, 
  ChevronRight,
  ChevronLeft,
  Compass,
  Bookmark
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

const carousel1Ref = ref<HTMLElement | null>(null);
const carousel2Ref = ref<HTMLElement | null>(null);

function scrollCarousel(el: HTMLElement | null, direction: 'left' | 'right') {
  if (!el) return;
  const offset = direction === 'left' ? -400 : 400;
  el.scrollBy({ left: offset, behavior: 'smooth' });
}

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
  },
  {
    id: 'f5',
    title: 'Arcane: Season 2',
    mediaType: 'TV',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2024-11-09',
    metadata: { voteAverage: 9.3 }
  },
  {
    id: 'f6',
    title: 'Interstellar',
    mediaType: 'MOVIE',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2014-11-07',
    metadata: { voteAverage: 8.7 }
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
  },
  {
    id: 'fw5',
    title: 'Solo Leveling',
    mediaType: 'MANGA',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2018-03-04',
    metadata: { voteAverage: 8.9 }
  },
  {
    id: 'fw6',
    title: 'The Dark Knight',
    mediaType: 'MOVIE',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60',
    releaseDate: '2008-07-18',
    metadata: { voteAverage: 9.0 }
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
  <div class="space-y-10 pt-2 pb-14">
    
    <!-- ================= MOBILE HERO (< md) ================= -->
    <section class="md:hidden flex flex-col items-center justify-center text-center pt-2">
      <!-- Circular Avatar with white ring border -->
      <div class="relative group cursor-pointer" @click="router.push('/library')">
        <div class="w-20 h-20 rounded-full ring-2 ring-white/20 hover:ring-white/40 overflow-hidden bg-black p-0.5 shadow-2xl transition-all duration-300 group-hover:scale-105">
          <img
            :src="heroAvatar"
            alt="Profile avatar"
            class="w-full h-full rounded-full object-cover grayscale contrast-125"
          />
        </div>
      </div>

      <!-- User Greeting Text -->
      <div class="mt-3.5 space-y-0.5">
        <h1 class="text-xl font-bold text-white tracking-tight">
          Hi, {{ authStore.user?.username || 'Enrico' }}
        </h1>
        <p class="text-sm text-zinc-400 font-normal">
          there are some news.
        </p>
      </div>
    </section>

    <!-- ================= DESKTOP HERO BANNER (>= md) ================= -->
    <section class="hidden md:flex items-center justify-between p-6 bg-[#121316] border border-white/[0.08] rounded-[26px] shadow-2xl">
      <div class="flex items-center gap-5">
        <div class="relative group cursor-pointer" @click="router.push('/library')">
          <div class="w-20 h-20 rounded-full ring-2 ring-white/20 hover:ring-white/50 overflow-hidden bg-black p-0.5 shadow-xl transition-transform group-hover:scale-105">
            <img
              :src="heroAvatar"
              alt="Profile avatar"
              class="w-full h-full rounded-full object-cover grayscale contrast-125"
            />
          </div>
        </div>

        <div>
          <div class="space-y-0.5">
            <h1 class="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Hi, {{ authStore.user?.username || 'Enrico' }}
            </h1>
            <p class="text-sm text-zinc-400">
              there are some news. Here's what's happening across your tracked media and social circle.
            </p>
          </div>

          <!-- Archive Stats Row Desktop -->
          <div class="flex items-center gap-2 mt-3.5">
            <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full text-xs font-mono">
              <span class="text-zinc-400">Total: </span>
              <span class="text-white font-semibold">{{ libraryStore.stats.total }}</span>
            </div>
            <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full text-xs font-mono">
              <span class="text-zinc-400">In Progress: </span>
              <span class="text-amber-400 font-semibold">{{ libraryStore.stats.inProgress }}</span>
            </div>
            <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full text-xs font-mono">
              <span class="text-zinc-400">Completed: </span>
              <span class="text-white font-semibold">{{ libraryStore.stats.completed }}</span>
            </div>
            <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full text-xs font-mono">
              <span class="text-zinc-400">Planned: </span>
              <span class="text-zinc-300 font-semibold">{{ libraryStore.stats.planToConsume }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons Desktop -->
      <div class="flex items-center gap-3 shrink-0">
        <router-link
          to="/discover"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all shadow-md active:scale-95"
        >
          <Compass class="w-4 h-4" />
          <span>Explore Catalog</span>
        </router-link>
        <router-link
          to="/library"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#16171B] hover:bg-[#202227] text-white border border-white/[0.08] text-xs font-semibold transition-all shadow-sm active:scale-95"
        >
          <Bookmark class="w-4 h-4" />
          <span>Your Library</span>
        </router-link>
      </div>
    </section>

    <!-- SECTION 1: News on fictions you liked -->
    <section class="space-y-3.5">
      <div class="flex items-center justify-between px-1">
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          News on fictions you liked
        </h2>

        <div class="flex items-center gap-2">
          <!-- Desktop Carousel Navigation Buttons -->
          <div class="hidden sm:flex items-center gap-1">
            <button
              class="p-2 bg-[#121316] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.08] rounded-full transition-colors active:scale-90"
              title="Previous"
              @click="scrollCarousel(carousel1Ref, 'left')"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-2 bg-[#121316] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.08] rounded-full transition-colors active:scale-90"
              title="Next"
              @click="scrollCarousel(carousel1Ref, 'right')"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>

          <router-link
            to="/library"
            class="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-0.5 font-medium ml-2"
          >
            <span>See all</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>

      <!-- Horizontal Carousel of High-Radius Rounded Cards -->
      <div
        ref="carousel1Ref"
        class="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
      >
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
      <div class="flex items-end justify-between px-1">
        <div class="space-y-0.5">
          <p class="text-zinc-400 text-lg sm:text-xl font-normal leading-tight tracking-tight">
            Your friends have watched/read these
          </p>
          <h2 class="text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight">
            but you haven't
          </h2>
        </div>

        <!-- Desktop Carousel Navigation Buttons -->
        <div class="hidden sm:flex items-center gap-1">
          <button
            class="p-2 bg-[#121316] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.08] rounded-full transition-colors active:scale-90"
            title="Previous"
            @click="scrollCarousel(carousel2Ref, 'left')"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            class="p-2 bg-[#121316] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/[0.08] rounded-full transition-colors active:scale-90"
            title="Next"
            @click="scrollCarousel(carousel2Ref, 'right')"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Horizontal Carousel of Friend Diff Recommendations -->
      <div
        ref="carousel2Ref"
        class="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
      >
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

      <!-- Horizontal / Vertical Cards of Community Discussions (Responsive 3 Columns Desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div
          v-for="disc in discussions"
          :key="disc.id"
          class="bg-[#121316] border border-white/[0.06] hover:border-white/[0.18] rounded-[24px] p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group shadow-lg"
          @click="router.push('/social')"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <img
                  :src="disc.avatar"
                  :alt="disc.author"
                  class="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
                <div>
                  <span class="text-xs font-semibold text-white block">{{ disc.author }}</span>
                  <span class="text-[10px] text-zinc-400 block font-mono">{{ disc.timeAgo }}</span>
                </div>
              </div>
              <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-zinc-300">
                {{ disc.mediaTag }}
              </span>
            </div>

            <p class="text-xs sm:text-sm text-zinc-200 leading-relaxed group-hover:text-white transition-colors">
              "{{ disc.topic }}"
            </p>
          </div>

          <div class="mt-5 pt-3.5 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
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

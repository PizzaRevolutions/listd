<script setup lang="ts">
import { computed } from 'vue';
import { Star, Plus, Film, Tv, Sparkles, BookOpen, Gamepad2, Music } from 'lucide-vue-next';
import { MediaItem, UserLibraryItem } from '../types/media.js';
import QuickWatchButton from './QuickWatchButton.vue';

const props = defineProps<{
  media: Partial<MediaItem>;
  libraryItem?: UserLibraryItem | null;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'add'): void;
  (e: 'increment'): void;
}>();

const mediaTypeConfig = computed(() => {
  switch (props.media.mediaType) {
    case 'MOVIE':
      return { label: 'Movie', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Film };
    case 'TV':
      return { label: 'TV Show', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: Tv };
    case 'ANIME':
      return { label: 'Anime', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Sparkles };
    case 'MANGA':
      return { label: 'Manga', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: BookOpen };
    case 'GAME':
      return { label: 'Game', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Gamepad2 };
    case 'MUSIC':
      return { label: 'Music', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Music };
    default:
      return { label: 'Media', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Film };
  }
});

const statusLabel = computed(() => {
  if (!props.libraryItem) return null;
  switch (props.libraryItem.status) {
    case 'IN_PROGRESS': return 'Watching / Playing';
    case 'COMPLETED': return 'Completed';
    case 'PLAN_TO_CONSUME': return 'Plan to Watch';
    case 'ON_HOLD': return 'On Hold';
    case 'DROPPED': return 'Dropped';
    default: return props.libraryItem.status;
  }
});

const fallbackPoster = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60';
</script>

<template>
  <div
    class="group relative flex flex-col bg-dark-surface border border-dark-border/60 hover:border-brand-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    @click="emit('click')"
  >
    <!-- Poster Container -->
    <div class="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
      <img
        :src="media.posterUrl || fallbackPoster"
        :alt="media.title"
        class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      <!-- Overlay gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark-surface via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity"></div>

      <!-- Top badges -->
      <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <span
          class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md"
          :class="mediaTypeConfig.color"
        >
          <component :is="mediaTypeConfig.icon" class="w-3 h-3" />
          {{ mediaTypeConfig.label }}
        </span>

        <span
          v-if="media.metadata?.voteAverage || media.metadata?.averageScore || media.metadata?.rating"
          class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/70 text-amber-400 border border-amber-500/20 backdrop-blur-md"
        >
          <Star class="w-3 h-3 fill-amber-400" />
          {{ ((media.metadata.voteAverage || (media.metadata.averageScore ? media.metadata.averageScore / 10 : null) || media.metadata.rating) || 0).toFixed(1) }}
        </span>
      </div>

      <!-- Bottom overlay on poster: 1-Click Watch or Progress -->
      <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
        <QuickWatchButton
          v-if="media.watchProviders?.link || media.watchProviders?.providers?.length"
          :watch-providers="media.watchProviders"
          compact
        />

        <div v-if="libraryItem" class="ml-auto flex items-center gap-1.5">
          <button
            class="px-2 py-1 text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg shadow backdrop-blur-sm transition-colors"
            title="Increment progress (+1)"
            @click.stop="emit('increment')"
          >
            +1 {{ media.mediaType === 'GAME' ? 'hr' : (media.mediaType === 'MANGA' ? 'ch' : 'ep') }}
          </button>
        </div>
        <div v-else class="ml-auto">
          <button
            class="p-1.5 bg-white/10 hover:bg-brand-600 text-white rounded-lg backdrop-blur-md transition-all shadow"
            title="Add to Library"
            @click.stop="emit('add')"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-3 flex flex-col justify-between">
      <div>
        <h3 class="font-semibold text-sm text-gray-100 group-hover:text-brand-400 line-clamp-1 transition-colors">
          {{ media.title }}
        </h3>
        <p v-if="media.releaseDate" class="text-xs text-gray-400 mt-0.5">
          {{ new Date(media.releaseDate).getFullYear() }}
        </p>
      </div>

      <!-- Tracking status info if in library -->
      <div v-if="libraryItem" class="mt-2.5 pt-2 border-t border-dark-border/40 flex items-center justify-between text-xs">
        <span class="text-gray-400 flex items-center gap-1 truncate">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          {{ statusLabel }}
        </span>
        <span class="font-mono text-gray-300 font-medium">
          {{ libraryItem.progressUnits }}{{ media.totalUnits ? ` / ${media.totalUnits}` : '' }}
        </span>
      </div>
    </div>
  </div>
</template>

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
      return { label: 'Film', icon: Film };
    case 'TV':
      return { label: 'TV', icon: Tv };
    case 'ANIME':
      return { label: 'Anime', icon: Sparkles };
    case 'MANGA':
      return { label: 'Manga', icon: BookOpen };
    case 'GAME':
      return { label: 'Game', icon: Gamepad2 };
    case 'MUSIC':
      return { label: 'Music', icon: Music };
    default:
      return { label: 'Media', icon: Film };
  }
});

const statusLabel = computed(() => {
  if (!props.libraryItem) return null;
  switch (props.libraryItem.status) {
    case 'IN_PROGRESS': return 'In progress';
    case 'COMPLETED': return 'Completed';
    case 'PLAN_TO_CONSUME': return 'Planned';
    case 'ON_HOLD': return 'On hold';
    case 'DROPPED': return 'Dropped';
    default: return props.libraryItem.status;
  }
});

const progressUnitLabel = computed(() => {
  switch (props.media.mediaType) {
    case 'GAME': return 'h';
    case 'MANGA': return 'ch';
    default: return 'ep';
  }
});

const formattedRating = computed(() => {
  const val = props.media.metadata?.voteAverage ||
    (props.media.metadata?.averageScore ? props.media.metadata.averageScore / 10 : null) ||
    props.media.metadata?.rating;
  return val ? Number(val).toFixed(1) : null;
});

const fallbackPoster = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60';
</script>

<template>
  <div
    class="group relative flex flex-col bg-carbon-900 border border-white/[0.08] hover:border-white/[0.2] rounded-xl overflow-hidden transition-colors cursor-pointer"
    @click="emit('click')"
  >
    <!-- Poster Container -->
    <div class="relative aspect-[2/3] w-full overflow-hidden bg-carbon-950">
      <img
        :src="media.posterUrl || fallbackPoster"
        :alt="media.title"
        class="w-full h-full object-cover object-center"
        loading="lazy"
      />

      <!-- Subtle bottom gradient for overlay actions readability -->
      <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-carbon-950/90 to-transparent pointer-events-none"></div>

      <!-- Top badges -->
      <div class="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-carbon-950/80 text-carbon-300 border border-white/[0.08] backdrop-blur-sm">
          <component :is="mediaTypeConfig.icon" class="w-3 h-3 text-carbon-400" />
          {{ mediaTypeConfig.label }}
        </span>

        <span
          v-if="formattedRating"
          class="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-carbon-950/80 text-amber-400 border border-white/[0.08] backdrop-blur-sm"
        >
          <Star class="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          {{ formattedRating }}
        </span>
      </div>

      <!-- Bottom overlay on poster: 1-Click Watch or Quick Progress -->
      <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
        <QuickWatchButton
          v-if="media.watchProviders?.link || media.watchProviders?.providers?.length"
          :watch-providers="media.watchProviders"
          compact
        />

        <div v-if="libraryItem" class="ml-auto">
          <button
            class="px-2 py-0.5 text-[11px] font-mono font-medium bg-carbon-800 hover:bg-carbon-700 text-carbon-100 border border-white/[0.12] rounded transition-colors"
            title="Increment progress by 1"
            @click.stop="emit('increment')"
          >
            +1 {{ progressUnitLabel }}
          </button>
        </div>
        <div v-else class="ml-auto">
          <button
            class="p-1 bg-carbon-800/90 hover:bg-carbon-700 text-carbon-200 hover:text-white border border-white/[0.12] rounded transition-colors"
            title="Add to library"
            @click.stop="emit('add')"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3 flex-1 flex flex-col justify-between">
      <div>
        <h3 class="font-medium text-xs text-white line-clamp-1">
          {{ media.title }}
        </h3>
        <p v-if="media.releaseDate" class="text-[11px] font-mono text-carbon-400 mt-0.5">
          {{ new Date(media.releaseDate).getFullYear() }}
        </p>
      </div>

      <!-- Tracking status info if in library -->
      <div v-if="libraryItem" class="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
        <span class="text-carbon-400 truncate">
          {{ statusLabel }}
        </span>
        <span class="font-mono tabular-nums text-carbon-300">
          {{ libraryItem.progressUnits }}{{ media.totalUnits ? ` / ${media.totalUnits}` : '' }}
        </span>
      </div>
    </div>
  </div>
</template>

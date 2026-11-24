<script setup lang="ts">
import { computed } from 'vue';
import { Play, ExternalLink } from 'lucide-vue-next';
import { WatchProvider } from '../types/media.js';

const props = defineProps<{
  watchProviders?: {
    link?: string;
    providers?: WatchProvider[];
  };
  compact?: boolean;
}>();

const primaryProvider = computed(() => {
  return props.watchProviders?.providers?.[0];
});

const watchUrl = computed(() => {
  return primaryProvider.value?.url || props.watchProviders?.link || '#';
});

const label = computed(() => {
  if (primaryProvider.value) {
    return primaryProvider.value.name;
  }
  return 'Watch / Play';
});
</script>

<template>
  <a
    v-if="watchUrl && watchUrl !== '#'"
    :href="watchUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1.5 font-medium transition-colors rounded-md border border-white/[0.12] bg-carbon-900/90 hover:bg-carbon-800 text-carbon-100"
    :class="[
      compact
        ? 'px-2 py-0.5 text-[11px]'
        : 'px-3 py-1.5 text-xs'
    ]"
    @click.stop
  >
    <img
      v-if="primaryProvider?.logoUrl"
      :src="primaryProvider.logoUrl"
      :alt="primaryProvider.name"
      class="w-3.5 h-3.5 rounded object-cover"
    />
    <Play v-else class="w-3 h-3 fill-current text-amber-500" />
    <span class="truncate">{{ label }}</span>
    <ExternalLink class="w-3 h-3 opacity-50 ml-0.5" />
  </a>
</template>

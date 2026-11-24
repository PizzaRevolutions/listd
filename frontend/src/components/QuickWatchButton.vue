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
    return `Watch on ${primaryProvider.value.name}`;
  }
  return '1-Click Watch / Play';
});
</script>

<template>
  <a
    v-if="watchUrl && watchUrl !== '#'"
    :href="watchUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1.5 font-medium transition-all duration-200 rounded-lg shadow-sm"
    :class="[
      compact
        ? 'px-2 py-1 text-xs bg-brand-600 hover:bg-brand-500 text-white'
        : 'px-3.5 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white hover:shadow-brand-500/25 hover:shadow-md'
    ]"
    @click.stop
  >
    <img
      v-if="primaryProvider?.logoUrl"
      :src="primaryProvider.logoUrl"
      :alt="primaryProvider.name"
      class="w-3.5 h-3.5 rounded object-cover"
    />
    <Play v-else class="w-3.5 h-3.5 fill-current" />
    <span class="truncate">{{ label }}</span>
    <ExternalLink class="w-3 h-3 opacity-70 ml-0.5" />
  </a>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Star, Check, Trash2, Send, Layers } from 'lucide-vue-next';
import { MediaItem, ItemStatus } from '../types/media.js';
import { useLibraryStore } from '../stores/library.js';
import { useSocialStore } from '../stores/social.js';
import { useMessagesStore } from '../stores/messages.js';
import QuickWatchButton from './QuickWatchButton.vue';

const props = defineProps<{
  media: Partial<MediaItem> | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const libraryStore = useLibraryStore();
const socialStore = useSocialStore();
const messagesStore = useMessagesStore();

const libraryItem = computed(() => {
  if (!props.media?.mediaType || !props.media?.externalSource || !props.media?.externalId) return null;
  return libraryStore.getLibraryItemByExternalId(
    props.media.mediaType,
    props.media.externalSource,
    props.media.externalId
  );
});

// Form state
const status = ref<ItemStatus>('PLAN_TO_CONSUME');
const rating = ref<number | null>(null);
const progressUnits = ref(0);
const customPlatform = ref('');
const notes = ref('');

// Friend recommendation state
const showFriendPicker = ref(false);
const selectedFriendId = ref('');
const recommendMessage = ref('');
const recommendSent = ref(false);

watch(
  () => libraryItem.value,
  (item) => {
    if (item) {
      status.value = item.status;
      rating.value = item.rating ?? null;
      progressUnits.value = item.progressUnits;
      customPlatform.value = item.customPlatform || '';
      notes.value = item.notes || '';
    } else {
      status.value = 'PLAN_TO_CONSUME';
      rating.value = null;
      progressUnits.value = 0;
      customPlatform.value = '';
      notes.value = '';
    }
  },
  { immediate: true }
);

async function handleSave() {
  if (!props.media) return;

  await libraryStore.addToLibrary({
    mediaItem: props.media,
    status: status.value,
    rating: rating.value ?? undefined,
    progressUnits: progressUnits.value,
    customPlatform: customPlatform.value || undefined,
    notes: notes.value || undefined,
  });

  emit('close');
}

async function handleDelete() {
  if (libraryItem.value) {
    await libraryStore.removeFromLibrary(libraryItem.value.id);
    emit('close');
  }
}

async function handleSendRecommendation() {
  if (!selectedFriendId.value || !props.media) return;

  await messagesStore.sendMessage({
    receiverId: selectedFriendId.value,
    content: recommendMessage.value.trim() || `Recommendation: "${props.media.title}"`,
    mediaItem: props.media,
  });

  recommendSent.value = true;
  setTimeout(() => {
    recommendSent.value = false;
    showFriendPicker.value = false;
    recommendMessage.value = '';
  }, 1200);
}

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: 'PLAN_TO_CONSUME', label: 'Plan to watch / play' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'DROPPED', label: 'Dropped' },
];
</script>

<template>
  <div
    v-if="isOpen && media"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-xl bg-[#121316] border border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
    >
      <!-- Backdrop banner image -->
      <div class="relative h-44 sm:h-52 w-full bg-[#0C0D10] shrink-0">
        <img
          v-if="media.backdropUrl || media.posterUrl"
          :src="media.backdropUrl || media.posterUrl"
          :alt="media.title"
          class="w-full h-full object-cover object-center filter brightness-50"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#121316] via-[#121316]/60 to-transparent"></div>

        <!-- Close button -->
        <button
          class="absolute top-3.5 right-3.5 p-2 bg-black/60 hover:bg-black text-zinc-300 hover:text-white rounded-full border border-white/[0.08] transition-colors z-10"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Media Header Info inside banner -->
        <div class="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
          <img
            v-if="media.posterUrl"
            :src="media.posterUrl"
            :alt="media.title"
            class="w-16 sm:w-20 aspect-[3/4] object-cover rounded-xl border border-white/[0.12] shrink-0 shadow-lg"
          />
          <div class="min-w-0 pb-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
              {{ media.mediaType }}
            </span>
            <h2 class="text-base sm:text-lg font-bold text-white truncate">
              {{ media.title }}
            </h2>
            <p v-if="media.originalTitle && media.originalTitle !== media.title" class="text-xs text-zinc-400 truncate">
              {{ media.originalTitle }}
            </p>
          </div>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="p-5 overflow-y-auto space-y-4">
        <!-- 1-Click Watch & Recommend Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/40 rounded-2xl border border-white/[0.05]">
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-400">Stream:</span>
            <QuickWatchButton
              v-if="media.watchProviders?.link || media.watchProviders?.providers?.length"
              :watch-providers="media.watchProviders"
            />
            <span v-else class="text-xs text-zinc-500 italic">No direct stream listed</span>
          </div>

          <!-- Recommend to friend trigger -->
          <div class="relative">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              @click="showFriendPicker = !showFriendPicker"
            >
              <Send class="w-3.5 h-3.5 text-zinc-300" />
              <span>Share card</span>
            </button>

            <!-- Friend Picker Dropdown -->
            <div
              v-if="showFriendPicker"
              class="absolute right-0 bottom-full mb-2 w-72 bg-[#16171B] border border-white/[0.1] rounded-2xl shadow-2xl p-3 z-30 space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-white">Send recommendation</span>
                <button class="text-zinc-400 hover:text-white" @click="showFriendPicker = false">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="socialStore.friends.length === 0" class="text-xs text-zinc-400 py-1">
                No friends added yet
              </div>

              <div v-else class="space-y-2">
                <select
                  v-model="selectedFriendId"
                  class="w-full text-xs bg-black/60 border border-white/[0.1] rounded-xl p-2 text-white focus:outline-none focus:border-white/40"
                >
                  <option value="" disabled>Select contact</option>
                  <option
                    v-for="friend in socialStore.friends.filter(f => f.status === 'ACCEPTED')"
                    :key="friend.user.id"
                    :value="friend.user.id"
                  >
                    {{ friend.user.username }}
                  </option>
                </select>

                <input
                  v-model="recommendMessage"
                  type="text"
                  placeholder="Optional note"
                  class="w-full text-xs bg-black/60 border border-white/[0.1] rounded-xl p-2 text-white placeholder-zinc-500 focus:outline-none"
                />

                <button
                  :disabled="!selectedFriendId"
                  class="w-full py-1.5 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full transition-colors flex items-center justify-center gap-1"
                  @click="handleSendRecommendation"
                >
                  <Check v-if="recommendSent" class="w-3.5 h-3.5" />
                  <span>{{ recommendSent ? 'Sent' : 'Send' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Overview & Genres -->
        <div>
          <h4 class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">Overview</h4>
          <p class="text-xs text-zinc-300 leading-relaxed">
            {{ media.metadata?.overview || media.metadata?.description || 'No description available.' }}
          </p>

          <div v-if="media.genres?.length" class="flex flex-wrap gap-1.5 mt-2.5">
            <span
              v-for="genre in media.genres"
              :key="genre"
              class="px-2.5 py-0.5 text-[10px] bg-white/[0.05] text-zinc-300 border border-white/[0.06] rounded-full"
            >
              {{ genre }}
            </span>
          </div>
        </div>

        <!-- Personal Tracking Form -->
        <div class="p-4 bg-black/40 border border-white/[0.06] rounded-2xl space-y-3">
          <h4 class="text-xs font-semibold text-white flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5 text-zinc-400" />
            Tracking Status
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Status -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-400 mb-1">Status</label>
              <select
                v-model="status"
                class="w-full bg-[#16171B] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Score / Rating -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-400 mb-1">Score (1 to 10)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="e.g. 8.5"
                  class="w-full bg-[#16171B] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono tabular-nums"
                />
                <Star class="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              </div>
            </div>

            <!-- Progress (Episodes, chapters, hours) -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-400 mb-1">
                Progress
                <span v-if="media.totalUnits" class="text-zinc-500 font-mono">
                  (Total: {{ media.totalUnits }})
                </span>
              </label>
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="progressUnits"
                  type="number"
                  min="0"
                  :max="media.totalUnits || undefined"
                  class="w-full bg-[#16171B] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono tabular-nums"
                />
                <button
                  type="button"
                  class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-medium shrink-0 transition-colors"
                  @click="progressUnits++"
                >
                  +1
                </button>
              </div>
            </div>

            <!-- Custom Platform -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-400 mb-1">Platform</label>
              <input
                v-model="customPlatform"
                type="text"
                placeholder="e.g. Netflix, Steam, Crunchyroll"
                class="w-full bg-[#16171B] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-[11px] font-medium text-zinc-400 mb-1">Notes</label>
            <textarea
              v-model="notes"
              rows="2"
              placeholder="Personal thoughts, notes or progress"
              class="w-full bg-[#16171B] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-black/60 border-t border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
        <button
          v-if="libraryItem"
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
          @click="handleDelete"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
        <div v-else></div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-5 py-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full transition-colors shadow-sm"
            @click="handleSave"
          >
            {{ libraryItem ? 'Save' : 'Add to library' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

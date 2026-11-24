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
    content: recommendMessage.value.trim() || `I recommend checking out "${props.media.title}"!`,
    mediaItem: props.media,
  });

  recommendSent.value = true;
  setTimeout(() => {
    recommendSent.value = false;
    showFriendPicker.value = false;
    recommendMessage.value = '';
  }, 1500);
}

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: 'PLAN_TO_CONSUME', label: 'Plan to Watch / Play' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DROPPED', label: 'Dropped' },
];
</script>

<template>
  <div
    v-if="isOpen && media"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm transition-opacity"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-3xl bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
    >
      <!-- Backdrop image if available -->
      <div class="relative h-48 sm:h-64 w-full bg-gray-900 shrink-0">
        <img
          v-if="media.backdropUrl || media.posterUrl"
          :src="media.backdropUrl || media.posterUrl"
          :alt="media.title"
          class="w-full h-full object-cover object-center filter brightness-50"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/60 to-transparent"></div>

        <!-- Close button -->
        <button
          class="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Media Header Info inside banner -->
        <div class="absolute bottom-4 left-6 right-6 flex items-end gap-4">
          <img
            v-if="media.posterUrl"
            :src="media.posterUrl"
            :alt="media.title"
            class="w-20 sm:w-28 aspect-[2/3] object-cover rounded-xl shadow-lg border border-dark-border/80 shrink-0"
          />
          <div class="min-w-0">
            <span class="text-xs font-semibold uppercase tracking-wider text-brand-400">
              {{ media.mediaType }}
            </span>
            <h2 class="text-xl sm:text-2xl font-bold text-white truncate">
              {{ media.title }}
            </h2>
            <p v-if="media.originalTitle && media.originalTitle !== media.title" class="text-xs text-gray-400 truncate">
              {{ media.originalTitle }}
            </p>
          </div>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        <!-- 1-Click Watch & Recommend Actions Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-dark-bg/60 rounded-xl border border-dark-border/40">
          <div>
            <span class="text-xs font-medium text-gray-400 block mb-1">Direct Access</span>
            <QuickWatchButton
              v-if="media.watchProviders?.link || media.watchProviders?.providers?.length"
              :watch-providers="media.watchProviders"
            />
            <span v-else class="text-xs text-gray-500 italic">No direct stream links found</span>
          </div>

          <!-- Recommend to friend trigger -->
          <div class="relative">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-dark-card hover:bg-dark-border text-gray-200 border border-dark-border rounded-lg transition-colors"
              @click="showFriendPicker = !showFriendPicker"
            >
              <Send class="w-4 h-4 text-brand-400" />
              Recommend to Friend
            </button>

            <!-- Friend Picker Dropdown -->
            <div
              v-if="showFriendPicker"
              class="absolute right-0 bottom-full mb-2 w-72 bg-dark-surface border border-dark-border rounded-xl shadow-xl p-3 z-30 space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-300">Share recommendation</span>
                <button class="text-gray-400 hover:text-white" @click="showFriendPicker = false">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="socialStore.friends.length === 0" class="text-xs text-gray-400 py-2">
                No friends added yet. Add friends from the Social tab!
              </div>

              <div v-else class="space-y-2">
                <select
                  v-model="selectedFriendId"
                  class="w-full text-xs bg-dark-bg border border-dark-border rounded-lg p-2 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="" disabled>Select a friend</option>
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
                  placeholder="Optional comment..."
                  class="w-full text-xs bg-dark-bg border border-dark-border rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />

                <button
                  :disabled="!selectedFriendId"
                  class="w-full py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                  @click="handleSendRecommendation"
                >
                  <Check v-if="recommendSent" class="w-3.5 h-3.5 text-emerald-300" />
                  <span>{{ recommendSent ? 'Recommendation Sent!' : 'Send Card' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Synopsis & Tags -->
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overview</h4>
          <p class="text-sm text-gray-300 leading-relaxed">
            {{ media.metadata?.overview || media.metadata?.description || 'No detailed overview available for this title.' }}
          </p>

          <div v-if="media.genres?.length" class="flex flex-wrap gap-1.5 mt-3">
            <span
              v-for="genre in media.genres"
              :key="genre"
              class="px-2.5 py-0.5 text-xs bg-dark-card border border-dark-border/50 text-gray-300 rounded-full"
            >
              {{ genre }}
            </span>
          </div>
        </div>

        <!-- Personal Tracking Form -->
        <div class="p-5 bg-dark-card/60 border border-dark-border rounded-xl space-y-4">
          <h4 class="text-sm font-semibold text-white flex items-center gap-2">
            <Layers class="w-4 h-4 text-brand-400" />
            Your Library Tracking
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Status -->
            <div>
              <label class="block text-xs font-medium text-gray-300 mb-1.5">Status</label>
              <select
                v-model="status"
                class="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Score / Rating -->
            <div>
              <label class="block text-xs font-medium text-gray-300 mb-1.5">Personal Rating (1 - 10)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="e.g. 8.5"
                  class="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
                <Star class="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
              </div>
            </div>

            <!-- Progress (Episodes, chapters, hours) -->
            <div>
              <label class="block text-xs font-medium text-gray-300 mb-1.5">
                Progress
                <span v-if="media.totalUnits" class="text-gray-500">
                  (Total: {{ media.totalUnits }})
                </span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="progressUnits"
                  type="number"
                  min="0"
                  :max="media.totalUnits || undefined"
                  class="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shrink-0"
                  @click="progressUnits++"
                >
                  +1
                </button>
              </div>
            </div>

            <!-- Custom Platform -->
            <div>
              <label class="block text-xs font-medium text-gray-300 mb-1.5">Platform / Service</label>
              <input
                v-model="customPlatform"
                type="text"
                placeholder="e.g. Steam, Netflix, PS5, Crunchyroll"
                class="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Personal Notes & Thoughts</label>
            <textarea
              v-model="notes"
              rows="2"
              placeholder="Add your review, thoughts, or reminders..."
              class="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 sm:p-6 bg-dark-bg border-t border-dark-border flex items-center justify-between gap-3 shrink-0">
        <button
          v-if="libraryItem"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
          @click="handleDelete"
        >
          <Trash2 class="w-4 h-4" />
          Remove from Library
        </button>
        <div v-else></div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-lg transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-md transition-colors"
            @click="handleSave"
          >
            {{ libraryItem ? 'Save Changes' : 'Add to Library' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

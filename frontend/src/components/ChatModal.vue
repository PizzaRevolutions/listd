<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Send, Plus } from 'lucide-vue-next';
import { useMessagesStore } from '../stores/messages.js';
import { useAuthStore } from '../stores/auth.js';
import { useLibraryStore } from '../stores/library.js';
import { MediaItem } from '../types/media.js';
import QuickWatchButton from './QuickWatchButton.vue';

const props = defineProps<{
  isOpen: boolean;
  friend: { id: string; username: string; avatarUrl?: string | null } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-media', media: MediaItem): void;
}>();

const messagesStore = useMessagesStore();
const authStore = useAuthStore();
const libraryStore = useLibraryStore();

const messageInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const currentMessages = computed(() => {
  if (!props.friend) return [];
  return messagesStore.messages[props.friend.id] || [];
});

watch(
  () => [props.isOpen, props.friend?.id],
  async ([isOpen, friendId]) => {
    if (isOpen && friendId) {
      await messagesStore.fetchMessages(friendId as string);
      scrollToBottom();
    }
  }
);

watch(
  () => currentMessages.value.length,
  () => {
    scrollToBottom();
  }
);

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function handleSendMessage() {
  if (!messageInput.value.trim() || !props.friend) return;

  const content = messageInput.value.trim();
  messageInput.value = '';

  await messagesStore.sendMessage({
    receiverId: props.friend.id,
    content,
  });

  scrollToBottom();
}

async function handleQuickAdd(media: MediaItem) {
  await libraryStore.addToLibrary({
    mediaItem: media,
    status: 'PLAN_TO_CONSUME',
  });
}
</script>

<template>
  <div
    v-if="isOpen && friend"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-lg h-[80vh] bg-carbon-900 border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Chat Header -->
      <div class="p-3.5 bg-carbon-950 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-carbon-800 border border-white/[0.08] flex items-center justify-center text-xs font-medium text-carbon-200 uppercase">
            {{ friend.username.charAt(0) }}
          </div>
          <div>
            <h3 class="font-medium text-xs text-white">{{ friend.username }}</h3>
            <span class="text-[10px] text-carbon-400 block font-mono">
              Direct connection
            </span>
          </div>
        </div>

        <button
          class="p-1.5 text-carbon-400 hover:text-white rounded-lg hover:bg-carbon-800 transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-3">
        <div v-if="currentMessages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-6 text-carbon-500">
          <p class="text-xs text-carbon-400">Direct message channel with {{ friend.username }}</p>
          <p class="text-[11px] text-carbon-500 mt-1 max-w-xs">
            Send titles, compare what you're watching, or exchange recommendations.
          </p>
        </div>

        <div
          v-for="msg in currentMessages"
          :key="msg.id"
          class="flex flex-col"
          :class="[msg.senderId === authStore.user?.id ? 'items-end' : 'items-start']"
        >
          <!-- Chat Bubble -->
          <div
            class="max-w-[85%] rounded-xl p-3 text-xs leading-relaxed"
            :class="[
              msg.senderId === authStore.user?.id
                ? 'bg-carbon-800 text-carbon-100 border border-white/[0.1] rounded-tr-none'
                : 'bg-carbon-950 border border-white/[0.06] text-carbon-200 rounded-tl-none'
            ]"
          >
            <!-- Message Content -->
            <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>

            <!-- Embedded Interactive Media Card -->
            <div
              v-if="msg.mediaItem"
              class="mt-2.5 p-2 bg-carbon-900 border border-white/[0.08] rounded-lg overflow-hidden flex gap-2.5 items-center cursor-pointer hover:border-white/[0.2] transition-colors"
              @click="emit('select-media', msg.mediaItem)"
            >
              <img
                v-if="msg.mediaItem.posterUrl"
                :src="msg.mediaItem.posterUrl"
                :alt="msg.mediaItem.title"
                class="w-10 h-14 object-cover rounded shrink-0 shadow-sm"
              />
              <div class="flex-1 min-w-0">
                <span class="text-[9px] font-mono text-carbon-400 uppercase tracking-wider block">
                  {{ msg.mediaItem.mediaType }}
                </span>
                <h4 class="text-xs font-medium text-white truncate">
                  {{ msg.mediaItem.title }}
                </h4>
                <div class="flex items-center gap-1.5 mt-1.5">
                  <QuickWatchButton
                    v-if="msg.mediaItem.watchProviders"
                    :watch-providers="msg.mediaItem.watchProviders"
                    compact
                  />
                  <button
                    class="px-2 py-0.5 text-[10px] font-medium bg-carbon-800 hover:bg-carbon-700 text-carbon-200 border border-white/[0.08] rounded transition-colors flex items-center gap-0.5"
                    title="Add to library"
                    @click.stop="handleQuickAdd(msg.mediaItem)"
                  >
                    <Plus class="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Timestamp -->
          <span class="text-[10px] font-mono text-carbon-500 mt-1 px-1">
            {{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
      </div>

      <!-- Message Input Form -->
      <form
        class="p-2.5 bg-carbon-950 border-t border-white/[0.08] flex items-center gap-2 shrink-0"
        @submit.prevent="handleSendMessage"
      >
        <input
          v-model="messageInput"
          type="text"
          placeholder="Message..."
          class="flex-1 bg-carbon-900 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-carbon-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="p-2 bg-carbon-100 hover:bg-white disabled:opacity-40 text-carbon-950 rounded-lg transition-colors"
        >
          <Send class="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  </div>
</template>

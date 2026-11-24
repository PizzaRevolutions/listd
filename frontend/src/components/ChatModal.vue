<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Send, Sparkles, Plus } from 'lucide-vue-next';
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
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-xl h-[85vh] bg-dark-surface border border-dark-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Chat Header -->
      <div class="p-4 bg-dark-bg border-b border-dark-border flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold uppercase">
            {{ friend.username.charAt(0) }}
          </div>
          <div>
            <h3 class="font-bold text-sm text-white">{{ friend.username }}</h3>
            <span class="text-[11px] text-emerald-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Direct Messages
            </span>
          </div>
        </div>

        <button
          class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-card transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-3">
        <div v-if="currentMessages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
          <Sparkles class="w-8 h-8 text-brand-400 mb-2 opacity-60" />
          <p class="text-sm font-medium text-gray-300">Start the conversation with {{ friend.username }}!</p>
          <p class="text-xs text-gray-500 mt-1">
            You can share media titles, discuss what you're watching, or exchange recommendations.
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
            class="max-w-[85%] rounded-2xl p-3 text-sm shadow-sm"
            :class="[
              msg.senderId === authStore.user?.id
                ? 'bg-brand-600 text-white rounded-tr-none'
                : 'bg-dark-card border border-dark-border/60 text-gray-200 rounded-tl-none'
            ]"
          >
            <!-- Message Content -->
            <p class="whitespace-pre-wrap break-words leading-relaxed">{{ msg.content }}</p>

            <!-- Embedded Interactive Media Card -->
            <div
              v-if="msg.mediaItem"
              class="mt-2.5 p-2 bg-black/40 border border-white/10 rounded-xl overflow-hidden flex gap-2.5 items-center cursor-pointer hover:border-brand-400/50 transition-colors"
              @click="emit('select-media', msg.mediaItem)"
            >
              <img
                v-if="msg.mediaItem.posterUrl"
                :src="msg.mediaItem.posterUrl"
                :alt="msg.mediaItem.title"
                class="w-12 h-16 object-cover rounded-lg shrink-0 shadow"
              />
              <div class="flex-1 min-w-0">
                <span class="text-[10px] font-semibold text-brand-300 uppercase tracking-wider block">
                  {{ msg.mediaItem.mediaType }}
                </span>
                <h4 class="text-xs font-bold text-white truncate">
                  {{ msg.mediaItem.title }}
                </h4>
                <div class="flex items-center gap-1.5 mt-1.5">
                  <QuickWatchButton
                    v-if="msg.mediaItem.watchProviders"
                    :watch-providers="msg.mediaItem.watchProviders"
                    compact
                  />
                  <button
                    class="px-2 py-0.5 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded transition-colors flex items-center gap-1"
                    title="Quick add to your library"
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
          <span class="text-[10px] text-gray-500 mt-1 px-1">
            {{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
      </div>

      <!-- Message Input Form -->
      <form
        class="p-3 bg-dark-bg border-t border-dark-border flex items-center gap-2 shrink-0"
        @submit.prevent="handleSendMessage"
      >
        <input
          v-model="messageInput"
          type="text"
          placeholder="Type a message..."
          class="flex-1 bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  GitCompare, 
  Check, 
  X, 
  Star, 
  Plus 
} from 'lucide-vue-next';
import { useSocialStore } from '../stores/social.js';
import { useLibraryStore } from '../stores/library.js';
import { MediaItem } from '../types/media.js';
import ChatModal from '../components/ChatModal.vue';
import MediaDetailModal from '../components/MediaDetailModal.vue';
import QuickWatchButton from '../components/QuickWatchButton.vue';

const socialStore = useSocialStore();
const libraryStore = useLibraryStore();

const newFriendUsername = ref('');
const addFriendLoading = ref(false);
const addFriendError = ref<string | null>(null);
const addFriendSuccess = ref(false);

// Chat modal state
const isChatOpen = ref(false);
const chatFriend = ref<{ id: string; username: string; avatarUrl?: string | null } | null>(null);

// Media detail modal
const selectedMedia = ref<Partial<MediaItem> | null>(null);
const isMediaModalOpen = ref(false);

// Comparison active friend
const activeCompareFriendId = ref<string | null>(null);

onMounted(async () => {
  await socialStore.fetchFriends();
});

async function handleSendRequest() {
  if (!newFriendUsername.value.trim()) return;

  addFriendLoading.value = true;
  addFriendError.value = null;
  addFriendSuccess.value = false;

  try {
    await socialStore.sendFriendRequest(newFriendUsername.value.trim());
    addFriendSuccess.value = true;
    newFriendUsername.value = '';
    setTimeout(() => {
      addFriendSuccess.value = false;
    }, 2000);
  } catch (err: any) {
    addFriendError.value = err.message || 'Failed to send request';
  } finally {
    addFriendLoading.value = false;
  }
}

async function handleCompare(friendId: string) {
  activeCompareFriendId.value = friendId;
  await socialStore.compareWithFriend(friendId);
}

function openChat(friend: { id: string; username: string; avatarUrl?: string | null }) {
  chatFriend.value = friend;
  isChatOpen.value = true;
}

function openMedia(media: MediaItem) {
  selectedMedia.value = media;
  isMediaModalOpen.value = true;
}

async function handleQuickAdd(media: MediaItem) {
  await libraryStore.addToLibrary({
    mediaItem: media,
    status: 'PLAN_TO_CONSUME',
  });
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <!-- Header -->
    <div class="px-1">
      <h1 class="text-2xl font-bold text-white tracking-tight">Community & Friends</h1>
      <p class="text-xs text-zinc-400 mt-0.5">
        Compare library differences and exchange media recommendations
      </p>
    </div>

    <!-- Add Friend Form -->
    <div class="p-5 bg-[#121316] border border-white/[0.08] rounded-[22px] max-w-xl shadow-lg">
      <h3 class="text-xs font-semibold text-white flex items-center gap-1.5 mb-3">
        <UserPlus class="w-4 h-4 text-zinc-400" />
        Connect with friends
      </h3>
      <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="handleSendRequest">
        <input
          v-model="newFriendUsername"
          type="text"
          placeholder="Enter username..."
          class="flex-1 bg-black/60 border border-white/[0.08] rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          :disabled="!newFriendUsername.trim() || addFriendLoading"
          class="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-semibold rounded-full transition-all active:scale-95 shrink-0"
        >
          {{ addFriendLoading ? 'Sending...' : 'Send request' }}
        </button>
      </form>

      <p v-if="addFriendSuccess" class="text-xs text-emerald-400 mt-2 flex items-center gap-1">
        <Check class="w-3.5 h-3.5" />
        Friend request delivered
      </p>
      <p v-if="addFriendError" class="text-xs text-rose-400 mt-2">
        {{ addFriendError }}
      </p>
    </div>

    <!-- Friends List -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 border-b border-white/[0.06] pb-2 px-1">
        <Users class="w-4 h-4 text-zinc-400" />
        <h2 class="text-sm font-semibold text-white">Contacts ({{ socialStore.friends.length }})</h2>
      </div>

      <div v-if="socialStore.friends.length === 0" class="text-center py-12 p-4 bg-[#121316]/50 border border-white/[0.06] rounded-[22px] text-zinc-400 text-xs">
        No contacts added yet. Search a username above to start comparing libraries!
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div
          v-for="friend in socialStore.friends"
          :key="friend.friendshipId"
          class="p-4 bg-[#121316] border border-white/[0.08] hover:border-white/[0.16] rounded-[22px] flex flex-col justify-between gap-3.5 transition-all shadow-md"
        >
          <!-- User info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-black border border-white/[0.1] flex items-center justify-center font-bold text-xs text-zinc-200 uppercase ring-1 ring-white/10">
                {{ friend.user.username.charAt(0) }}
              </div>
              <div>
                <h4 class="font-semibold text-xs text-white">{{ friend.user.username }}</h4>
                <span
                  class="text-[10px] block font-mono"
                  :class="[
                    friend.status === 'ACCEPTED'
                      ? 'text-zinc-400'
                      : (friend.isIncomingRequest ? 'text-amber-400' : 'text-zinc-500')
                  ]"
                >
                  {{ friend.status === 'ACCEPTED' ? 'Connected' : (friend.isIncomingRequest ? 'Incoming request' : 'Pending request') }}
                </span>
              </div>
            </div>

            <!-- Incoming request actions -->
            <div v-if="friend.isIncomingRequest" class="flex items-center gap-1.5">
              <button
                class="p-2 bg-white text-black hover:bg-zinc-200 rounded-full transition-colors"
                title="Accept"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'ACCEPT')"
              >
                <Check class="w-3.5 h-3.5" />
              </button>
              <button
                class="p-2 bg-[#16171B] hover:bg-[#202227] text-zinc-400 hover:text-white rounded-full transition-colors"
                title="Decline"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'DECLINE')"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Accepted actions -->
          <div v-if="friend.status === 'ACCEPTED'" class="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
            <button
              class="flex-1 py-1.5 px-3 text-xs font-semibold bg-[#16171B] hover:bg-[#22242A] text-white border border-white/[0.08] rounded-full transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              @click="handleCompare(friend.user.id)"
            >
              <GitCompare class="w-3 h-3 text-zinc-400" />
              <span>Compare</span>
            </button>
            <button
              class="py-1.5 px-3 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-1.5 active:scale-95"
              @click="openChat(friend.user)"
            >
              <MessageSquare class="w-3 h-3" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Library Comparison Results ("Friend Diff Engine") -->
    <div v-if="socialStore.comparisonData" class="space-y-4 p-5 bg-[#121316] border border-white/[0.08] rounded-[24px] shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Diff Analysis</span>
          <h2 class="text-sm font-semibold text-white">
            Completed by {{ socialStore.comparisonData.friend.username }} not yet in your list
          </h2>
        </div>

        <div class="flex items-center gap-2.5 text-xs font-mono tabular-nums">
          <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full">
            <span class="text-zinc-400">Their entries: </span>
            <span class="text-white">{{ socialStore.comparisonData.totalFriendItems }}</span>
          </div>
          <div class="px-3 py-1 bg-black/60 border border-white/[0.06] rounded-full">
            <span class="text-zinc-400">Shared: </span>
            <span class="text-amber-400">{{ socialStore.comparisonData.sharedCompletedCount }}</span>
          </div>
        </div>
      </div>

      <!-- Diff Items List -->
      <div v-if="socialStore.comparisonData.comparisonList.length === 0" class="text-center py-8 text-zinc-400 text-xs">
        No differences found. You have recorded all titles in their completed list.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div
          v-for="item in socialStore.comparisonData.comparisonList"
          :key="item.mediaItem.id"
          class="p-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.14] rounded-[20px] flex items-center justify-between gap-3 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 cursor-pointer" @click="openMedia(item.mediaItem)">
            <img
              v-if="item.mediaItem.posterUrl"
              :src="item.mediaItem.posterUrl"
              :alt="item.mediaItem.title"
              class="w-11 h-16 object-cover rounded-xl shrink-0 shadow-sm"
            />
            <div class="min-w-0">
              <span class="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">
                {{ item.mediaItem.mediaType }}
              </span>
              <h4 class="text-xs font-semibold text-white truncate">
                {{ item.mediaItem.title }}
              </h4>
              <div class="flex items-center gap-1.5 mt-0.5 text-xs">
                <span v-if="item.friendRating" class="flex items-center gap-0.5 text-amber-400 font-mono tabular-nums text-[11px]">
                  <Star class="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {{ item.friendRating.toFixed(1) }}
                </span>
                <span class="text-zinc-600">•</span>
                <span class="text-zinc-400 text-[10px] capitalize">
                  {{ item.friendStatus.toLowerCase().replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Action -->
          <div class="flex items-center gap-1.5 shrink-0">
            <QuickWatchButton
              v-if="item.mediaItem.watchProviders"
              :watch-providers="item.mediaItem.watchProviders"
              compact
            />
            <button
              v-if="item.myStatus === 'NOT_IN_LIBRARY'"
              class="px-3 py-1 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full transition-colors flex items-center gap-1 active:scale-95"
              @click="handleQuickAdd(item.mediaItem)"
            >
              <Plus class="w-3 h-3" />
              <span>Add</span>
            </button>
            <span v-else class="text-[10px] font-mono text-zinc-500 px-2">
              Queued
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Direct Messaging Modal -->
    <ChatModal
      :is-open="isChatOpen"
      :friend="chatFriend"
      @close="isChatOpen = false"
      @select-media="openMedia"
    />

    <!-- Media Detail Modal -->
    <MediaDetailModal
      :media="selectedMedia"
      :is-open="isMediaModalOpen"
      @close="isMediaModalOpen = false"
    />
  </div>
</template>

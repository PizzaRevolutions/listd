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
  <div class="space-y-7 pb-16">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-semibold text-white tracking-tight">Social & Comparison</h1>
      <p class="text-xs text-carbon-400 mt-0.5">
        Compare library differences and exchange media recommendations
      </p>
    </div>

    <!-- Add Friend Form -->
    <div class="p-4 bg-carbon-900 border border-white/[0.08] rounded-xl max-w-xl">
      <h3 class="text-xs font-medium text-white flex items-center gap-1.5 mb-2.5">
        <UserPlus class="w-3.5 h-3.5 text-amber-500" />
        Connect by username
      </h3>
      <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="handleSendRequest">
        <input
          v-model="newFriendUsername"
          type="text"
          placeholder="Enter username..."
          class="flex-1 bg-carbon-950 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-carbon-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          :disabled="!newFriendUsername.trim() || addFriendLoading"
          class="px-3.5 py-1.5 bg-carbon-100 hover:bg-white disabled:opacity-40 text-carbon-950 text-xs font-medium rounded-lg transition-colors shrink-0"
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
    <div class="space-y-3">
      <div class="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <Users class="w-4 h-4 text-carbon-400" />
        <h2 class="text-sm font-semibold text-white">Contacts</h2>
      </div>

      <div v-if="socialStore.friends.length === 0" class="text-center py-10 p-4 bg-carbon-900/50 border border-white/[0.06] rounded-xl text-carbon-400 text-xs">
        No contacts added yet
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="friend in socialStore.friends"
          :key="friend.friendshipId"
          class="p-3.5 bg-carbon-900 border border-white/[0.08] rounded-xl flex flex-col justify-between gap-3"
        >
          <!-- User info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-carbon-800 border border-white/[0.08] flex items-center justify-center font-medium text-xs text-carbon-200 uppercase">
                {{ friend.user.username.charAt(0) }}
              </div>
              <div>
                <h4 class="font-medium text-xs text-white">{{ friend.user.username }}</h4>
                <span
                  class="text-[10px] block"
                  :class="[
                    friend.status === 'ACCEPTED'
                      ? 'text-carbon-400'
                      : (friend.isIncomingRequest ? 'text-amber-400' : 'text-carbon-500')
                  ]"
                >
                  {{ friend.status === 'ACCEPTED' ? 'Connected' : (friend.isIncomingRequest ? 'Incoming request' : 'Pending request') }}
                </span>
              </div>
            </div>

            <!-- Incoming request actions -->
            <div v-if="friend.isIncomingRequest" class="flex items-center gap-1">
              <button
                class="p-1.5 bg-carbon-100 hover:bg-white text-carbon-950 rounded-md transition-colors"
                title="Accept"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'ACCEPT')"
              >
                <Check class="w-3.5 h-3.5" />
              </button>
              <button
                class="p-1.5 bg-carbon-800 hover:bg-carbon-700 text-carbon-400 hover:text-white rounded-md transition-colors"
                title="Decline"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'DECLINE')"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Accepted actions -->
          <div v-if="friend.status === 'ACCEPTED'" class="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              class="flex-1 py-1 px-2.5 text-xs font-medium bg-carbon-800 hover:bg-carbon-700 text-carbon-200 border border-white/[0.08] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              @click="handleCompare(friend.user.id)"
            >
              <GitCompare class="w-3 h-3 text-carbon-400" />
              <span>Compare</span>
            </button>
            <button
              class="py-1 px-2.5 text-xs font-medium bg-carbon-800 hover:bg-carbon-700 text-carbon-200 border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5"
              @click="openChat(friend.user)"
            >
              <MessageSquare class="w-3 h-3 text-carbon-400" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Library Comparison Results ("Friend Diff Engine") -->
    <div v-if="socialStore.comparisonData" class="space-y-3.5 p-5 bg-carbon-900 border border-white/[0.1] rounded-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-wider text-carbon-400 block">Diff Analysis</span>
          <h2 class="text-sm font-semibold text-white">
            Completed by {{ socialStore.comparisonData.friend.username }} not yet in your list
          </h2>
        </div>

        <div class="flex items-center gap-3 text-xs font-mono tabular-nums">
          <div class="px-2.5 py-1 bg-carbon-950 border border-white/[0.06] rounded-md">
            <span class="text-carbon-400">Their entries: </span>
            <span class="text-white">{{ socialStore.comparisonData.totalFriendItems }}</span>
          </div>
          <div class="px-2.5 py-1 bg-carbon-950 border border-white/[0.06] rounded-md">
            <span class="text-carbon-400">Shared: </span>
            <span class="text-amber-400">{{ socialStore.comparisonData.sharedCompletedCount }}</span>
          </div>
        </div>
      </div>

      <!-- Diff Items List -->
      <div v-if="socialStore.comparisonData.comparisonList.length === 0" class="text-center py-8 text-carbon-400 text-xs">
        No differences found. You have recorded all titles in their completed list.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        <div
          v-for="item in socialStore.comparisonData.comparisonList"
          :key="item.mediaItem.id"
          class="p-2.5 bg-carbon-950 border border-white/[0.06] hover:border-white/[0.12] rounded-xl flex items-center justify-between gap-3 transition-colors"
        >
          <div class="flex items-center gap-2.5 min-w-0 cursor-pointer" @click="openMedia(item.mediaItem)">
            <img
              v-if="item.mediaItem.posterUrl"
              :src="item.mediaItem.posterUrl"
              :alt="item.mediaItem.title"
              class="w-10 h-14 object-cover rounded shrink-0 shadow-sm"
            />
            <div class="min-w-0">
              <span class="text-[9px] font-mono text-carbon-400 uppercase tracking-wider block">
                {{ item.mediaItem.mediaType }}
              </span>
              <h4 class="text-xs font-medium text-white truncate">
                {{ item.mediaItem.title }}
              </h4>
              <div class="flex items-center gap-1.5 mt-0.5 text-xs">
                <span v-if="item.friendRating" class="flex items-center gap-0.5 text-amber-400 font-mono tabular-nums text-[11px]">
                  <Star class="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {{ item.friendRating.toFixed(1) }}
                </span>
                <span class="text-carbon-600">•</span>
                <span class="text-carbon-400 text-[10px] capitalize">
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
              class="px-2 py-0.5 text-[11px] font-medium bg-carbon-800 hover:bg-carbon-700 text-carbon-200 border border-white/[0.08] rounded transition-colors flex items-center gap-1"
              @click="handleQuickAdd(item.mediaItem)"
            >
              <Plus class="w-3 h-3" />
              <span>Add</span>
            </button>
            <span v-else class="text-[10px] font-mono text-carbon-500 px-1.5">
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

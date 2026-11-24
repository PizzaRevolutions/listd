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
    }, 2500);
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
  <div class="space-y-8 pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Social & Library Comparison</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1">
          Connect with friends, compare watchlists, and share interactive media recommendations.
        </p>
      </div>
    </div>

    <!-- Add Friend Form -->
    <div class="p-5 bg-dark-surface border border-dark-border/80 rounded-2xl">
      <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
        <UserPlus class="w-4 h-4 text-brand-400" />
        Add Friend by Username
      </h3>
      <form class="flex flex-col sm:flex-row gap-2.5 max-w-lg" @submit.prevent="handleSendRequest">
        <input
          v-model="newFriendUsername"
          type="text"
          placeholder="Enter username (e.g. alex_hunter)..."
          class="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          :disabled="!newFriendUsername.trim() || addFriendLoading"
          class="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-colors shrink-0"
        >
          {{ addFriendLoading ? 'Sending...' : 'Send Request' }}
        </button>
      </form>

      <p v-if="addFriendSuccess" class="text-xs text-emerald-400 mt-2 flex items-center gap-1">
        <Check class="w-3.5 h-3.5" />
        Friend request sent successfully!
      </p>
      <p v-if="addFriendError" class="text-xs text-rose-400 mt-2">
        {{ addFriendError }}
      </p>
    </div>

    <!-- Friends List -->
    <div class="space-y-4">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <Users class="w-5 h-5 text-brand-400" />
        Your Friends & Connections
      </h2>

      <div v-if="socialStore.friends.length === 0" class="text-center py-12 p-4 bg-dark-surface/40 border border-dark-border/40 rounded-2xl text-gray-400 text-sm">
        No friends added yet. Send a friend request above to start comparing libraries!
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="friend in socialStore.friends"
          :key="friend.friendshipId"
          class="p-4 bg-dark-surface border border-dark-border/60 rounded-2xl flex flex-col justify-between gap-4"
        >
          <!-- User info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-brand-600/25 border border-brand-500/40 flex items-center justify-center font-bold text-brand-300 uppercase">
                {{ friend.user.username.charAt(0) }}
              </div>
              <div>
                <h4 class="font-bold text-sm text-white">{{ friend.user.username }}</h4>
                <span
                  class="text-[11px] font-medium"
                  :class="[
                    friend.status === 'ACCEPTED'
                      ? 'text-emerald-400'
                      : (friend.isIncomingRequest ? 'text-amber-400' : 'text-gray-400')
                  ]"
                >
                  {{ friend.status === 'ACCEPTED' ? 'Friend' : (friend.isIncomingRequest ? 'Incoming Request' : 'Pending Request') }}
                </span>
              </div>
            </div>

            <!-- Incoming request actions -->
            <div v-if="friend.isIncomingRequest" class="flex items-center gap-1.5">
              <button
                class="p-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                title="Accept Request"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'ACCEPT')"
              >
                <Check class="w-4 h-4" />
              </button>
              <button
                class="p-1.5 bg-dark-card hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Decline"
                @click="socialStore.respondFriendRequest(friend.friendshipId, 'DECLINE')"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Accepted actions -->
          <div v-if="friend.status === 'ACCEPTED'" class="flex items-center gap-2 pt-2 border-t border-dark-border/40">
            <button
              class="flex-1 py-1.5 px-3 text-xs font-semibold bg-brand-600/15 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 rounded-xl transition-all flex items-center justify-center gap-1.5"
              @click="handleCompare(friend.user.id)"
            >
              <GitCompare class="w-3.5 h-3.5" />
              Compare Library
            </button>
            <button
              class="py-1.5 px-3 text-xs font-semibold bg-dark-card hover:bg-dark-border text-gray-200 border border-dark-border rounded-xl transition-colors flex items-center gap-1.5"
              @click="openChat(friend.user)"
            >
              <MessageSquare class="w-3.5 h-3.5 text-brand-400" />
              Chat
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Library Comparison Results ("Friend Diff Engine") -->
    <div v-if="socialStore.comparisonData" class="space-y-4 p-6 bg-dark-surface border border-brand-500/30 rounded-3xl shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-border">
        <div>
          <span class="text-xs font-semibold text-brand-400 uppercase tracking-wider block">Comparison Engine</span>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            Titles {{ socialStore.comparisonData.friend.username }} Completed & Loved
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">
            That are not in your library or are still in your plan-to-watch queue.
          </p>
        </div>

        <div class="flex items-center gap-4 text-xs font-medium">
          <div class="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-xl">
            <span class="text-gray-400">Total in their library: </span>
            <span class="text-white font-bold">{{ socialStore.comparisonData.totalFriendItems }}</span>
          </div>
          <div class="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-xl">
            <span class="text-gray-400">Shared completed: </span>
            <span class="text-emerald-400 font-bold">{{ socialStore.comparisonData.sharedCompletedCount }}</span>
          </div>
        </div>
      </div>

      <!-- Diff Items List -->
      <div v-if="socialStore.comparisonData.comparisonList.length === 0" class="text-center py-8 text-gray-400 text-sm">
        🎉 You are all caught up! You've already consumed everything {{ socialStore.comparisonData.friend.username }} has watched/played.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div
          v-for="item in socialStore.comparisonData.comparisonList"
          :key="item.mediaItem.id"
          class="p-3 bg-dark-bg border border-dark-border/60 hover:border-brand-500/40 rounded-2xl flex items-center justify-between gap-3 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 cursor-pointer" @click="openMedia(item.mediaItem)">
            <img
              v-if="item.mediaItem.posterUrl"
              :src="item.mediaItem.posterUrl"
              :alt="item.mediaItem.title"
              class="w-12 h-16 object-cover rounded-xl shrink-0 shadow"
            />
            <div class="min-w-0">
              <span class="text-[10px] font-semibold text-brand-400 uppercase tracking-wider block">
                {{ item.mediaItem.mediaType }}
              </span>
              <h4 class="text-sm font-bold text-white truncate hover:text-brand-300 transition-colors">
                {{ item.mediaItem.title }}
              </h4>
              <div class="flex items-center gap-2 mt-1 text-xs">
                <span v-if="item.friendRating" class="flex items-center gap-0.5 text-amber-400 font-medium">
                  <Star class="w-3 h-3 fill-amber-400" />
                  {{ item.friendRating.toFixed(1) }}
                </span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-400 text-[11px] capitalize">
                  {{ item.friendStatus.toLowerCase().replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Action -->
          <div class="flex items-center gap-2 shrink-0">
            <QuickWatchButton
              v-if="item.mediaItem.watchProviders"
              :watch-providers="item.mediaItem.watchProviders"
              compact
            />
            <button
              v-if="item.myStatus === 'NOT_IN_LIBRARY'"
              class="px-2.5 py-1 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow"
              @click="handleQuickAdd(item.mediaItem)"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <span v-else class="text-[11px] font-medium text-gray-400 px-2">
              In Plan
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

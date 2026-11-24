<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  Plus, 
  Bell, 
  Home, 
  Users, 
  Search, 
  List, 
  LogOut,
  X
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';
import { useMessagesStore } from '../stores/messages.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const messagesStore = useMessagesStore();

const showNotifications = ref(false);
const showProfileMenu = ref(false);

const unreadCount = computed(() => {
  return messagesStore.unreadCount || 1; // Default to 1 unread indicator as in mockup
});

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

function handleLogout() {
  authStore.logout();
  showProfileMenu.value = false;
  router.push('/login');
}
</script>

<template>
  <!-- TOP APP BAR -->
  <header class="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-white/[0.04]">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      
      <!-- Left: "+ Add to your list" Pill Button -->
      <router-link
        to="/discover"
        class="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#16171B] hover:bg-[#202227] border border-white/[0.08] hover:border-white/[0.16] text-xs sm:text-sm font-medium text-white transition-all shadow-sm active:scale-95"
      >
        <Plus class="w-3.5 h-3.5 text-zinc-300" />
        <span>Add to your list</span>
      </router-link>

      <!-- Center: "Ld." Brand Logo -->
      <router-link 
        to="/" 
        class="flex items-center group select-none -ml-4 sm:ml-0"
      >
        <span class="text-2xl sm:text-3xl font-black tracking-tighter text-white font-sans transition-transform group-hover:scale-105">
          Ld.
        </span>
      </router-link>

      <!-- Right: Notification Bell with Red Dot -->
      <div class="relative flex items-center gap-2">
        <button
          type="button"
          class="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-90"
          title="Notifications"
          @click="showNotifications = !showNotifications"
        >
          <Bell class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          <!-- Red Unread Indicator Dot from Mockup -->
          <span 
            v-if="unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black"
          ></span>
        </button>

        <!-- Notifications Dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 top-12 w-80 bg-[#121316] border border-white/[0.1] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-3">
            <span class="text-xs font-semibold text-white tracking-wide uppercase">Notifications</span>
            <button @click="showNotifications = false" class="text-zinc-400 hover:text-white">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p class="text-white font-medium">New discussions in your circle</p>
              <p class="text-zinc-400 mt-0.5">Enrico and 2 friends discussed <span class="text-zinc-200">Cyberpunk: Edgerunners</span></p>
            </div>
            <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p class="text-white font-medium">Friend Activity</p>
              <p class="text-zinc-400 mt-0.5">Alex marked <span class="text-zinc-200">Dune: Part Two</span> as Completed</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </header>

  <!-- FLOATING BOTTOM DOCK NAVIGATION BAR -->
  <div class="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
    <nav class="pointer-events-auto bg-[#121316]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-full px-3 py-2 flex items-center justify-between gap-1 sm:gap-4 max-w-sm w-full">
      
      <!-- 1. Home / Dashboard -->
      <router-link
        to="/"
        class="flex items-center justify-center transition-all duration-200"
        :class="[
          route.path === '/'
            ? 'bg-white/10 text-white rounded-full px-3.5 py-1.5'
            : 'text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5'
        ]"
        title="Home"
      >
        <Home class="w-5 h-5 fill-current" />
      </router-link>

      <!-- 2. Community / Friends -->
      <router-link
        to="/social"
        class="flex items-center justify-center transition-all duration-200"
        :class="[
          route.path === '/social'
            ? 'bg-white/10 text-white rounded-full px-3.5 py-1.5'
            : 'text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5'
        ]"
        title="Community & Friends"
      >
        <Users class="w-5 h-5" />
      </router-link>

      <!-- 3. Search / Discover -->
      <router-link
        to="/discover"
        class="flex items-center justify-center transition-all duration-200"
        :class="[
          route.path === '/discover'
            ? 'bg-white/10 text-white rounded-full px-3.5 py-1.5'
            : 'text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5'
        ]"
        title="Discover & Search"
      >
        <Search class="w-5 h-5" />
      </router-link>

      <!-- 4. Library / Lists -->
      <router-link
        to="/library"
        class="flex items-center justify-center transition-all duration-200"
        :class="[
          route.path === '/library'
            ? 'bg-white/10 text-white rounded-full px-3.5 py-1.5'
            : 'text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5'
        ]"
        title="Your Library"
      >
        <List class="w-5 h-5" />
      </router-link>

      <!-- 5. Profile Mini Avatar -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center justify-center p-0.5 rounded-full transition-transform active:scale-95"
          :class="[
            showProfileMenu ? 'ring-2 ring-white' : 'ring-1 ring-white/20 hover:ring-white/50'
          ]"
          @click="showProfileMenu = !showProfileMenu"
          title="Account profile"
        >
          <img
            :src="authStore.user?.avatarUrl || defaultAvatar"
            alt="User avatar"
            class="w-6 h-6 rounded-full object-cover object-center bg-zinc-800"
          />
        </button>

        <!-- Profile Menu Dropdown -->
        <div
          v-if="showProfileMenu"
          class="absolute bottom-12 right-0 w-48 bg-[#121316] border border-white/[0.1] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div v-if="authStore.isAuthenticated" class="px-3 py-2 border-b border-white/[0.06] mb-1">
            <p class="text-xs font-semibold text-white truncate">{{ authStore.user?.username }}</p>
            <p class="text-[11px] text-zinc-400 truncate">{{ authStore.user?.email }}</p>
          </div>
          <div v-if="authStore.isAuthenticated">
            <button
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              @click="handleLogout"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
          <div v-else class="space-y-1">
            <router-link
              to="/login"
              class="block px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 transition-colors"
              @click="showProfileMenu = false"
            >
              Sign in
            </router-link>
            <router-link
              to="/register"
              class="block px-3 py-2 rounded-xl text-xs text-white bg-white/10 hover:bg-white/20 transition-colors text-center font-medium"
              @click="showProfileMenu = false"
            >
              Register
            </router-link>
          </div>
        </div>
      </div>

    </nav>
  </div>
</template>

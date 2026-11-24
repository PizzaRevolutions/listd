<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { 
  Bookmark, 
  Compass, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Search,
  Film
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Library', path: '/library', icon: Bookmark },
  { name: 'Discover', path: '/discover', icon: Compass },
  { name: 'Social', path: '/social', icon: Users },
];

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-carbon-950/95 backdrop-blur-md border-b border-white/[0.08]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-carbon-800 border border-white/[0.1] flex items-center justify-center text-amber-500">
          <Film class="w-4 h-4" />
        </div>
        <span class="text-base font-semibold tracking-tight text-white">
          Listd
        </span>
      </router-link>

      <!-- Desktop Nav links -->
      <nav class="hidden md:flex items-center gap-1">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="[
            route.path === link.path
              ? 'bg-carbon-800 text-white border border-white/[0.08]'
              : 'text-carbon-300 hover:text-white hover:bg-carbon-850'
          ]"
        >
          <component :is="link.icon" class="w-3.5 h-3.5 text-carbon-400" />
          {{ link.name }}
        </router-link>
      </nav>

      <!-- Right actions -->
      <div class="flex items-center gap-2.5">
        <!-- Search bar trigger -->
        <router-link
          to="/discover"
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-carbon-900 border border-white/[0.08] hover:border-white/[0.16] rounded-lg text-xs text-carbon-400 hover:text-carbon-200 transition-colors"
        >
          <Search class="w-3.5 h-3.5" />
          <span>Search catalog...</span>
        </router-link>

        <!-- User profile & Logout -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-carbon-800 border border-white/[0.08] flex items-center justify-center text-xs font-medium text-carbon-200 uppercase">
              {{ authStore.user?.username?.charAt(0) }}
            </div>
            <span class="hidden lg:inline text-xs text-carbon-300">
              {{ authStore.user?.username }}
            </span>
          </div>

          <button
            class="p-1.5 text-carbon-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Sign out"
            @click="handleLogout"
          >
            <LogOut class="w-3.5 h-3.5" />
          </button>
        </div>

        <div v-else class="flex items-center gap-2">
          <router-link
            to="/login"
            class="px-3 py-1.5 text-xs text-carbon-300 hover:text-white transition-colors"
          >
            Sign in
          </router-link>
          <router-link
            to="/register"
            class="px-3.5 py-1.5 text-xs font-medium bg-carbon-100 hover:bg-white text-carbon-950 rounded-lg transition-colors shadow-sm"
          >
            Register
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-carbon-950/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-around py-1.5 px-2">
      <router-link
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors"
        :class="[
          route.path === link.path
            ? 'text-white font-medium'
            : 'text-carbon-400 hover:text-carbon-200'
        ]"
      >
        <component :is="link.icon" class="w-4 h-4" />
        {{ link.name }}
      </router-link>
    </div>
  </header>
</template>

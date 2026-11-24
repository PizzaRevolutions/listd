<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { 
  Bookmark, 
  Compass, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Search,
  Sparkles
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Library', path: '/library', icon: Bookmark },
  { name: 'Discover', path: '/discover', icon: Compass },
  { name: 'Social & Compare', path: '/social', icon: Users },
];

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-dark-bg/90 backdrop-blur-md border-b border-dark-border/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
          <Sparkles class="w-5 h-5" />
        </div>
        <span class="text-xl font-black tracking-tight text-white group-hover:text-brand-300 transition-colors">
          Listd
        </span>
      </router-link>

      <!-- Desktop Nav links -->
      <nav class="hidden md:flex items-center gap-1">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          :class="[
            route.path === link.path
              ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
              : 'text-gray-300 hover:text-white hover:bg-dark-card'
          ]"
        >
          <component :is="link.icon" class="w-4 h-4" />
          {{ link.name }}
        </router-link>
      </nav>

      <!-- Right actions -->
      <div class="flex items-center gap-3">
        <!-- Quick search pill for discover -->
        <router-link
          to="/discover"
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-surface border border-dark-border rounded-xl text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
        >
          <Search class="w-3.5 h-3.5" />
          <span>Search media...</span>
        </router-link>

        <!-- User profile & Logout -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-2 pl-2 border-l border-dark-border">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-xs font-bold text-brand-300 uppercase">
              {{ authStore.user?.username?.charAt(0) }}
            </div>
            <span class="hidden lg:inline text-xs font-medium text-gray-200">
              {{ authStore.user?.username }}
            </span>
          </div>

          <button
            class="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Log Out"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <div v-else class="flex items-center gap-2">
          <router-link
            to="/login"
            class="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Sign In
          </router-link>
          <router-link
            to="/register"
            class="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow transition-colors"
          >
            Get Started
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-surface/95 backdrop-blur-md border-t border-dark-border flex items-center justify-around py-2 px-2">
      <router-link
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors"
        :class="[
          route.path === link.path
            ? 'text-brand-400 font-bold'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        <component :is="link.icon" class="w-5 h-5" />
        {{ link.name }}
      </router-link>
    </div>
  </header>
</template>

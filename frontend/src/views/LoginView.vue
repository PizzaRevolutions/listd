<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';
import { useMessagesStore } from '../stores/messages.js';

const router = useRouter();
const authStore = useAuthStore();
const messagesStore = useMessagesStore();

const emailOrUsername = ref('');
const password = ref('');
const localError = ref<string | null>(null);

async function handleLogin() {
  if (!emailOrUsername.value.trim() || !password.value) return;

  localError.value = null;
  try {
    const res = await authStore.login(emailOrUsername.value.trim(), password.value);
    if (res.token) {
      messagesStore.initSocket(res.token);
    }
    router.push('/');
  } catch (err: any) {
    localError.value = authStore.error || 'Authentication failed. Verify credentials.';
  }
}
</script>

<template>
  <div class="min-h-[75vh] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-[#121316] border border-white/[0.08] rounded-[26px] p-7 shadow-2xl space-y-6">
      <!-- Header -->
      <div class="space-y-1 text-center">
        <span class="text-3xl font-black tracking-tighter text-white font-sans block mb-1">
          Ld.
        </span>
        <h1 class="text-lg font-bold text-white tracking-tight">Sign in</h1>
        <p class="text-xs text-zinc-400">Access your unified media catalog</p>
      </div>

      <!-- Error alert -->
      <div v-if="localError" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300">
        {{ localError }}
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-[11px] font-medium text-zinc-400 mb-1">Username or email</label>
          <input
            v-model="emailOrUsername"
            type="text"
            required
            autocomplete="username"
            placeholder="Username or email"
            class="w-full bg-black/60 border border-white/[0.08] focus:border-white/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label class="block text-[11px] font-medium text-zinc-400 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-black/60 border border-white/[0.08] focus:border-white/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 mt-2"
        >
          <Loader2 v-if="authStore.loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ authStore.loading ? 'Signing in...' : 'Sign in' }}</span>
        </button>
      </form>

      <!-- Bottom link -->
      <div class="text-center text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
        No account yet?
        <router-link to="/register" class="text-white font-semibold hover:underline ml-1">
          Register
        </router-link>
      </div>
    </div>
  </div>
</template>

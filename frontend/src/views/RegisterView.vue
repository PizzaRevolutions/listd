<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Sparkles, Loader2, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.js';
import { useMessagesStore } from '../stores/messages.js';

const router = useRouter();
const authStore = useAuthStore();
const messagesStore = useMessagesStore();

const username = ref('');
const email = ref('');
const password = ref('');
const localError = ref<string | null>(null);

async function handleRegister() {
  if (!username.value.trim() || !email.value.trim() || !password.value) return;

  localError.value = null;
  try {
    const res = await authStore.register(username.value.trim(), email.value.trim(), password.value);
    if (res.token) {
      messagesStore.initSocket(res.token);
    }
    router.push('/');
  } catch (err: any) {
    localError.value = authStore.error || 'Registration failed. Username or email may already be in use.';
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-dark-surface border border-dark-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <!-- Logo & Title -->
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/20">
          <Sparkles class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Create an Account</h1>
        <p class="text-xs text-gray-400">Join Listd and start tracking all your media</p>
      </div>

      <!-- Error alert -->
      <div v-if="localError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
        {{ localError }}
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Username</label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="e.g. shadow_runner"
            class="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            class="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">Password (Min. 6 characters)</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            placeholder="••••••••"
            class="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Loader2 v-if="authStore.loading" class="w-4 h-4 animate-spin" />
          <span>{{ authStore.loading ? 'Creating Account...' : 'Get Started' }}</span>
          <ArrowRight v-if="!authStore.loading" class="w-4 h-4" />
        </button>
      </form>

      <!-- Bottom link -->
      <div class="text-center text-xs text-gray-400 pt-2 border-t border-dark-border/40">
        Already have an account?
        <router-link to="/login" class="text-brand-400 font-semibold hover:underline ml-1">
          Sign in
        </router-link>
      </div>
    </div>
  </div>
</template>

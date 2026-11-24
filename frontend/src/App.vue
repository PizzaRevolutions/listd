<script setup lang="ts">
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import { useAuthStore } from './stores/auth.js';
import { useMessagesStore } from './stores/messages.js';

const authStore = useAuthStore();
const messagesStore = useMessagesStore();

onMounted(async () => {
  if (authStore.token) {
    messagesStore.initSocket(authStore.token);
    await authStore.fetchCurrentUser();
  }
});
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800">
    <Navbar />
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-2 pb-28">
      <router-view />
    </main>
  </div>
</template>

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../api/client.js';
import { DirectMessage } from '../types/social.js';
import { MediaItem } from '../types/media.js';

export const useMessagesStore = defineStore('messages', () => {
  const socket = ref<Socket | null>(null);
  const messages = ref<Record<string, DirectMessage[]>>({}); // keyed by friendId
  const activeChatFriendId = ref<string | null>(null);
  const isTyping = ref<Record<string, boolean>>({});

  function initSocket(token: string) {
    if (socket.value) {
      socket.value.disconnect();
    }

    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    socket.value = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.value.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to realtime messaging');
    });

    socket.value.on('new_message', (message: DirectMessage) => {
      const friendId = message.senderId;
      if (!messages.value[friendId]) {
        messages.value[friendId] = [];
      }
      messages.value[friendId].push(message);
    });

    socket.value.on('user_typing', ({ senderId, isTyping: typing }: { senderId: string; isTyping: boolean }) => {
      isTyping.value[senderId] = typing;
    });
  }

  async function fetchMessages(friendId: string) {
    activeChatFriendId.value = friendId;
    try {
      const res = await apiClient.get<{ messages: DirectMessage[] }>(`/messages/${friendId}`);
      messages.value[friendId] = res.data.messages;
    } catch (err) {
      console.warn('Failed to fetch messages', err);
    }
  }

  async function sendMessage(payload: {
    receiverId: string;
    content: string;
    mediaItemId?: string;
    mediaItem?: Partial<MediaItem>;
  }) {
    try {
      const res = await apiClient.post<{ message: DirectMessage }>('/messages', payload);
      const friendId = payload.receiverId;
      if (!messages.value[friendId]) {
        messages.value[friendId] = [];
      }
      messages.value[friendId].push(res.data.message);
      return res.data.message;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send message');
    }
  }

  function disconnectSocket() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  }

  return {
    socket,
    messages,
    activeChatFriendId,
    isTyping,
    initSocket,
    fetchMessages,
    sendMessage,
    disconnectSocket,
  };
});

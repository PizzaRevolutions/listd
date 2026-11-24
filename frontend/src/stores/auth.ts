import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client.js';
import { User, AuthResponse } from '../types/auth.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(
    localStorage.getItem('listd_user')
      ? JSON.parse(localStorage.getItem('listd_user')!)
      : null
  );
  const token = ref<string | null>(localStorage.getItem('listd_token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  function setAuth(data: AuthResponse) {
    user.value = data.user;
    token.value = data.token;
    localStorage.setItem('listd_token', data.token);
    localStorage.setItem('listd_user', JSON.stringify(data.user));
    error.value = null;
  }

  async function login(emailOrUsername: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.post<AuthResponse>('/auth/login', {
        emailOrUsername,
        password,
      });
      setAuth(res.data);
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.post<AuthResponse>('/auth/register', {
        username,
        email,
        password,
      });
      setAuth(res.data);
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('listd_token');
    localStorage.removeItem('listd_user');
  }

  async function fetchCurrentUser() {
    if (!token.value) return;
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      user.value = res.data.user;
      localStorage.setItem('listd_user', JSON.stringify(res.data.user));
    } catch {
      logout();
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
});

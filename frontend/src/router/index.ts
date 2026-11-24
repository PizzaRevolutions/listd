import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LibraryView from '../views/LibraryView.vue';
import DiscoverView from '../views/DiscoverView.vue';
import SocialView from '../views/SocialView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverView,
    },
    {
      path: '/social',
      name: 'social',
      component: SocialView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('listd_token');
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register') && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;

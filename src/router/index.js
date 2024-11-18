import { createRouter, createWebHistory } from 'vue-router'
import Main from '../views/Main.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import Login from '../views/Login.vue'
import AuthService from '../services/auth'
import VideoRecorder from '@/views/video/VideoRecorder.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: Main,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/oauth/callback/kakao',
      name: 'kakao-callback',
      component: OAuthCallback
    },
    {
      path: '/upload',
      name: 'upload',
      component: VideoRecorder,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = AuthService.getAccessToken();
    if (!token) {
      next('/login');
      return;
    }
    try {
      await AuthService.getUserInfo();
      next();
    } catch (error) {
      next('/login');
    }
  } else {
    next();
  }
});

export default router
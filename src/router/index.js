import { createRouter, createWebHistory } from 'vue-router'
import Main from '../views/Main.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import Login from '../views/Login.vue'
import AuthService from '../services/auth'

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
      path: '/login/oauth2/code/kakao',
      name: 'oauth-callback',
      component: OAuthCallback
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
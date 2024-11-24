import { createRouter, createWebHistory } from 'vue-router';
import Main from '../views/Main.vue';
import OAuthCallback from '../views/OAuthCallback.vue';
import Login from '../views/Login.vue';
import AuthService from '../services/auth';
import VideoRecorder from '@/views/video/VideoRecorder.vue';
import VideoFeed from '@/views/video/VideoFeed.vue';
import VideoPreview from '@/views/video/VideoPreview.vue';
import VideoDetail from '@/views/video/VideoDetail.vue';
import TourInfo from '@/views/video/TourInfo.vue';
import Profile from '@/views/my/Profile.vue';
import MyPage from '@/views/my/MyPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: Main,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false },
    },
    {
      path: '/oauth/callback/kakao',
      name: 'kakao-callback',
      component: OAuthCallback,
    },
    {
      path: '/upload',
      name: 'upload',
      component: VideoRecorder,
      meta: { requiresAuth: true },
    },
    {
      path: '/videos',
      name: 'videos',
      component: VideoFeed,
    },
    {
      path: '/preview',
      name: 'video-preview',
      component: VideoPreview,
    },
    {
      path: '/registtour',
      name: 'regist-tour',
      component: TourInfo,
    },
    {
      path: '/video/detail',
      name: 'VideoDetail',
      component: VideoDetail,
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
    },
    {
      path: '/my-videos',
      name: 'MyVideos',
      component: MyPage,
    },
  ],
});

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

export default router;

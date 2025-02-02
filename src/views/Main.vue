<template>
  <div class="main-container">
    <v-container fluid class="pa-0">
      <!-- 상단 프로필 영역 -->
      <v-row justify="center" class="px-4 py-2">
        <v-col cols="12" md="3">
          <v-card class="profile-card mb-4" flat>
            <v-card-text class="text-center">
              <!-- TripShorts 로고 추가 -->
              <Logo />
              <div class="user-greeting">
                <span class="user-name">{{ userInfo.nickname }}</span>
                <span class="user-greeting-text">님, 환영합니다</span>
              </div>
            </v-card-text>
          </v-card>

          <!-- PC에서만 보이는 메뉴 -->
          <v-card class="menu-card d-none d-md-block">
            <v-list>
              <v-list-item
                v-for="(menu, index) in menuItems"
                :key="index"
                :to="menu.route"
                class="menu-item"
                v-show="!menu.mobileOnly"
              >
                <template v-slot:prepend>
                  <div class="menu-icon" v-html="menu.icon"></div>
                </template>
                <v-list-item-title class="menu-text">{{
                  menu.title
                }}</v-list-item-title>
              </v-list-item>

              <v-list-item @click="handleLogout" class="menu-item">
                <template v-slot:prepend>
                  <div class="menu-icon" v-html="icons.logout"></div>
                </template>
                <v-list-item-title class="menu-text"
                  >로그아웃</v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- 콘텐츠 영역 -->
        <v-col cols="12" md="9">
          <!-- 정렬 옵션 -->
          <v-row class="mb-4">
            <v-col cols="12" class="d-flex justify-center">
              <v-chip-group
                v-model="selectedSort"
                selected-class="selected-sort"
                mandatory
              >
                <v-chip
                  v-for="sort in sortOptions"
                  :key="sort.value"
                  :value="sort.value"
                  variant="outlined"
                  color="#8B4513"
                  class="sort-chip"
                  @click="handleSort(sort.value)"
                >
                  {{ sort.label }}
                </v-chip>
              </v-chip-group>
            </v-col>
          </v-row>

          <!-- 비디오 그리드 -->
          <v-row>
            <v-col
              v-for="(video, index) in videos"
              :key="index"
              cols="12"
              sm="6"
              lg="3"
            >
              <v-card class="video-card" @click="goToVideoFeed(video.videoId)">
                <v-img
                  :src="video.thumbnailUrl || '/api/placeholder/400/250'"
                  height="200"
                  cover
                ></v-img>
                <v-card-text
                  class="d-flex align-center justify-space-between py-2"
                >
                  <span class="nickname">{{ video.nickname }}</span>

                  <!-- 좋아요 수와 조회수를 감싸는 div -->
                  <div class="d-flex align-center">
                    <!-- 좋아요 수 -->
                    <div class="d-flex align-center me-3">
                      <div class="stat-icon" v-html="icons.like"></div>
                      <span class="count-text">{{ video.likeCount }}</span>
                    </div>
                    <!-- 조회수 -->
                    <div class="d-flex align-center">
                      <div class="stat-icon" v-html="icons.view"></div>
                      <span class="count-text">{{ video.viewCount }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <!-- 모바일 하단 네비게이션 -->
    <v-bottom-navigation
      v-model="activeTab"
      color="#FF9933"
      class="d-md-none mobile-nav"
    >
      <v-btn
        v-for="menu in mobileMenuItems"
        :key="menu.title"
        :to="menu.route"
        @click="menu.action && menu.action()"
      >
        <div class="mobile-menu-icon" v-html="menu.icon"></div>
        {{ menu.title }}
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../services/auth';
import VideoService from '../services/video';
import { icons } from '@/assets/icons';
import Logo from '@/components/Logo.vue';

const router = useRouter();
const activeTab = ref('home');
const videos = ref([]);
const goToVideoFeed = videoId => {
  console.log('라우터 videoID : ' + videoId);
  router.push({
    name: 'videos',
    query: { initialVideoId: videoId, sortBy: selectedSort.value },
  });
};

// 정렬 옵션 정의
const sortOptions = ref([
  { label: '최신순', value: 'recent' },
  { label: '좋아요순', value: 'likes' },
  { label: '조회순', value: 'views' },
]);

const selectedSort = ref('recent'); // 기본값은 최신순

// 비디오 데이터 가져오기
const fetchVideos = async sortby => {
  try {
    const data = await VideoService.getVideos(sortby);
    videos.value = data;
  } catch (error) {
    console.error('Failed to fetch videos:', error);
  }
};

// 정렬 처리 함수
const handleSort = async sortValue => {
  selectedSort.value = sortValue;
  await fetchVideos(sortValue);
};

const userInfo = ref({
  email: '',
  nickname: '',
});

// menuItems 업데이트
const menuItems = ref([
  {
    title: '홈',
    icon: icons.home,
    route: '/',
    mobileOnly: false,
  },
  {
    title: '동영상 업로드',
    icon: icons.upload,
    route: '/upload',
  },
  {
    title: '내 동영상',
    icon: icons.video,
    route: '/my-videos',
    mobileOnly: false,
  },
]);

// mobileMenuItems 업데이트
const mobileMenuItems = computed(() => [
  {
    title: '동영상 업로드',
    icon: icons.upload,
    route: '/upload',
    action: null,
  },
  {
    title: '내 동영상',
    icon: icons.video,
    route: '/my-videos',
    action: null,
  },
  {
    title: '로그아웃',
    icon: icons.logout,
    route: null,
    action: handleLogout,
  },
]);

onMounted(async () => {
  try {
    // 토큰이 있는 경우에만 유저 정보 조회
    const token = AuthService.getAccessToken();
    if (token) {
      const data = await AuthService.getUserInfo();
      userInfo.value = data;
    }

    await fetchVideos(selectedSort.value); // 비디오 데이터 가져오기
  } catch (error) {
    console.error('Failed to get user info:', error);
    router.push('/login');
  }
});

const handleLogout = async () => {
  try {
    await AuthService.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script>

<style scoped>
.main-container {
  background-color: #fff8f0;
  min-height: 100vh;
  padding-bottom: 56px; /* 모바일 하단 네비게이션 높이만큼 패딩 */
}

.profile-card {
  background: transparent;
}

.user-name {
  color: #8b4513;
  font-size: 1.3rem;
  font-weight: 500;
}

.menu-card {
  border-radius: 15px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.menu-item {
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
}

.menu-text {
  color: #8b4513;
}

.menu-item:hover {
  background-color: rgba(255, 153, 51, 0.1);
}

.video-card {
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  height: 100%;
  background: #fff8f0;
  overflow: hidden;
  border: none !important;
  box-shadow: none !important;
}

.video-card:hover {
  transform: scale(1.02);
}

.count-text {
  color: #8b4513;
  font-size: 0.9rem;
  margin-left: 4px;
}

.nickname {
  color: #8b4513;
  font-size: 0.9rem;
  font-weight: 500;
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
}

.sort-chip {
  font-size: 0.9rem;
  min-width: 80px;
  justify-content: center;
}

.selected-sort {
  background-color: #8b4513 !important;
  color: white !important;
}

/* 호버 효과 */
.sort-chip:hover {
  background-color: rgba(139, 69, 19, 0.1);
}

.menu-icon,
.mobile-menu-icon,
.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.menu-icon :deep(svg),
.mobile-menu-icon :deep(svg) {
  color: #8b4513;
  transition: all 0.2s ease;
}

.menu-item:hover .menu-icon :deep(svg) {
  color: #ff9933;
}

.stat-icon {
  width: 20px;
  height: 20px;
  margin-right: 4px;
}

.user-greeting {
  font-size: 0.95rem;
  color: #8b4513;
  opacity: 0.9;
  padding: 8px 0;
  border-radius: 20px;
  transition: opacity 0.2s ease;
}

.user-greeting:hover {
  opacity: 1;
}

.user-name {
  font-weight: 600;
  color: #ff9933;
}

.user-greeting-text {
  color: #8b4513;
}

@media (max-width: 960px) {
  .user-name {
    font-size: 1.1rem;
  }

  .main-container {
    padding-bottom: 80px;
  }

  .user-greeting {
    font-size: 0.9rem;
  }
}
</style>

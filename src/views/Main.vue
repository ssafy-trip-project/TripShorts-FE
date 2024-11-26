<template>
  <div class="main-container">
    <v-container fluid class="pa-0">
      <!-- 상단 프로필 영역 -->
      <v-row justify="center" class="px-4 py-2">
        <v-col cols="12" md="3">
          <v-card class="profile-card mb-4" flat>
            <v-card-text class="text-center">
              <!-- TripShorts 로고 추가 -->
              <div class="logo-container mb-4">
                <svg
                  width="280"
                  height="50"
                  viewBox="0 0 280 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- 카메라 그룹 - 약간 작게 조정 -->
                  <g transform="translate(10, 5) scale(0.9)">
                    <!-- 카메라 상단 플래시 부분 -->
                    <rect
                      x="8"
                      y="14"
                      width="14"
                      height="4"
                      rx="2"
                      fill="#8B4513"
                    />

                    <!-- 카메라 본체 -->
                    <rect
                      x="4"
                      y="18"
                      width="36"
                      height="28"
                      rx="4"
                      fill="#8B4513"
                    />

                    <!-- 카메라 그립 -->
                    <rect
                      x="2"
                      y="24"
                      width="6"
                      height="16"
                      rx="2"
                      fill="#8B4513"
                    />

                    <!-- 렌즈 외부 링 -->
                    <circle cx="22" cy="32" r="12" fill="#FF9933" />

                    <!-- 렌즈 내부 -->
                    <circle cx="22" cy="32" r="8" fill="#8B4513" />
                    <circle cx="22" cy="32" r="6" fill="#FF9933" />

                    <!-- 카메라 상단 다이얼 -->
                    <circle cx="34" cy="24" r="3" fill="#FF9933" />

                    <!-- 위치 핀 -->
                    <path
                      d="M44 16 C44 16, 50 12, 56 16 L50 40 Z"
                      fill="#FF9933"
                      stroke="#8B4513"
                      stroke-width="1.5"
                    />
                  </g>

                  <!-- 영문 텍스트 - 중앙 정렬 -->
                  <text
                    x="90"
                    y="35"
                    font-family="Arial"
                    font-size="32"
                    font-weight="bold"
                    fill="#8B4513"
                  >
                    TripShorts
                  </text>
                </svg>
              </div>
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
                  <div class="menu-icon" v-html="logoutIcon"></div>
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
                      <div class="stat-icon" v-html="likeIcon"></div>
                      <span class="count-text">{{ video.likeCount }}</span>
                    </div>
                    <!-- 조회수 -->
                    <div class="d-flex align-center">
                      <div class="stat-icon" v-html="viewIcon"></div>
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
    console.info(videos.value);
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
// SVG 아이콘 정의
const homeIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const uploadIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const videoIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 8L22 6V18L18 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const logoutIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const likeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const viewIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="3" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// menuItems 업데이트
const menuItems = ref([
  {
    title: '홈',
    icon: homeIcon,
    route: '/',
    mobileOnly: false,
  },
  {
    title: '동영상 업로드',
    icon: uploadIcon,
    route: '/upload',
  },
  {
    title: '내 동영상',
    icon: videoIcon,
    route: '/my-videos',
    mobileOnly: false,
  },
]);

// mobileMenuItems 업데이트
const mobileMenuItems = computed(() => [
  {
    title: '동영상 업로드',
    icon: uploadIcon,
    route: '/upload',
    action: null,
  },
  {
    title: '내 동영상',
    icon: videoIcon,
    route: '/my-videos',
    action: null,
  },
  {
    title: '로그아웃',
    icon: logoutIcon,
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

.category-chip {
  font-size: 0.9rem;
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

.likes-count {
  color: #8b4513;
  font-size: 0.9rem;
  margin-left: 4px;
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

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
}

.logo-container svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.logo-container:hover svg {
  transform: scale(1.03);
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

  .logo-container svg {
    width: 250px;
    height: 80px;
  }

  .user-greeting {
    font-size: 0.9rem;
  }
}
</style>

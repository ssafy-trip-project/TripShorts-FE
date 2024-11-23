<template>
  <div class="main-container">
    <v-container fluid class="pa-0">
      <!-- 상단 프로필 영역 -->
      <v-row justify="center" class="px-4 py-2">
        <v-col cols="12" md="3">
          <v-card class="profile-card mb-4" flat>
            <v-card-text class="text-center">
              <h2 class="user-name">{{ userInfo.nickname }}님</h2>
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
                  <v-icon color="#8B4513">{{ menu.icon }}</v-icon>
                </template>
                <v-list-item-title class="menu-text">{{ menu.title }}</v-list-item-title>
              </v-list-item>

              <v-list-item @click="handleLogout" class="menu-item">
                <template v-slot:prepend>
                  <v-icon color="#8B4513">mdi-logout</v-icon>
                </template>
                <v-list-item-title class="menu-text">로그아웃</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- 콘텐츠 영역 -->
        <v-col cols="12" md="9">
          <!-- 카테고리 칩 -->
          <v-row class="mb-4">
            <v-col cols="12" class="d-flex justify-center">
              <v-chip-group show-arrows>
                <v-chip
                  v-for="category in categories"
                  :key="category"
                  variant="outlined"
                  color="#8B4513"
                  class="category-chip"
                >
                  {{ category }}
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
              lg="4"
            >
              <v-card class="video-card">
                <v-img
                  :src="video.thumbnailUrl || '/api/placeholder/400/250'"
                  height="200"
                  cover
                ></v-img>
                <v-card-text class="d-flex align-center justify-space-between py-2">
                  <span class="nickname">{{ video.nickname }}</span>
                  <div class="d-flex align-center">
                    <v-icon color="#FF9933" size="small" start>mdi-heart</v-icon>
                    <span class="likes-count">{{ video.likeCount }}</span>
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
      <v-btn v-for="menu in mobileMenuItems" :key="menu.title" :value="menu.route">
        <v-icon>{{ menu.icon }}</v-icon>
        {{ menu.title }}
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/auth'
import VideoService from '../services/video'

const router = useRouter()
const activeTab = ref('home')
const videos = ref([])

// 비디오 데이터 가져오기
const fetchVideos = async () => {
  try {
    const data = await VideoService.getVideos()
    videos.value = data
  } catch (error) {
    console.error('Failed to fetch videos:', error)
  }
}



const userInfo = ref({
  email: '',
  nickname: ''
})

const menuItems = ref([
  { 
    title: '홈', 
    icon: 'mdi-home',
    route: '/',
    mobileOnly: false
  },
  { 
    title: '프로필', 
    icon: 'mdi-account',
    route: '/profile',
    mobileOnly: false
  },
  {
    title: "동영상 업로드",
    icon: "mdi-upload",
    route: "/upload",
  },
  { 
    title: '내 동영상', 
    icon: 'mdi-video',
    route: '/my-videos',
    mobileOnly: false
  }
])

const mobileMenuItems = computed(() => [
  { 
    title: '홈', 
    icon: 'mdi-home',
    route: '/'
  },
  { 
    title: '탐색', 
    icon: 'mdi-compass',
    route: '/explore'
  },
  { 
    title: '업로드', 
    icon: 'mdi-plus-circle',
    route: '/upload'
  },
  { 
    title: '내 동영상', 
    icon: 'mdi-video',
    route: '/my-videos'
  },
  { 
    title: '프로필', 
    icon: 'mdi-account',
    route: '/profile'
  }
])

const categories = ref([
  "모두", "노을이 멋진 곳", "여행지", "힐링스팟", "일상생활", 
  "문화", "음식", "경치", "동물", "쇼핑", "기타"
])

onMounted(async () => {
  try {
    // 토큰이 있는 경우에만 유저 정보 조회
    const token = AuthService.getAccessToken()
    if (token) {
      const data = await AuthService.getUserInfo()
      userInfo.value = data
    }
    
    await fetchVideos() // 비디오 데이터 가져오기
  } catch (error) {
    console.error('Failed to get user info:', error)
    router.push('/login')
  }
})

const handleLogout = async () => {
  try {
    await AuthService.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.main-container {
  background-color: #FFF8F0;
  min-height: 100vh;
  padding-bottom: 56px;  /* 모바일 하단 네비게이션 높이만큼 패딩 */
}

.profile-card {
  background: transparent;
}

.user-name {
  color: #8B4513;
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
  color: #8B4513;
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
  background: white;
  overflow: hidden;
}

.video-card:hover {
  transform: scale(1.02);
}

.likes-count {
  color: #8B4513;
  font-size: 0.9rem;
  margin-left: 4px;
}

.nickname{
  color: #8B4513;
  font-size: 0.9rem;
  font-weight: 500;
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
}

@media (max-width: 960px) {
  .user-name {
    font-size: 1.1rem;
  }
  
  .main-container {
    padding-bottom: 80px;
  }
}
</style>
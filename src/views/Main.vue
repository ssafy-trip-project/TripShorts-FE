<template>
  <v-container fluid>
    <v-row justify="center">
      <!-- 왼쪽 메뉴 섹션 -->
      <v-col cols="12" md="3">
        <v-card class="welcome-card mb-4">
          <v-card-title class="text-center headline"> 환영합니다! </v-card-title>
          <v-card-text class="text-center">
            <h2 class="user-name">{{ userInfo.nickname }}님</h2>
          </v-card-text>
        </v-card>

        <v-card class="menu-card">
          <v-list>
            <v-list-item
              v-for="(menu, index) in menus"
              :key="index"
              :to="menu.route"
              class="menu-item"
            >
              <v-list-item-icon>
                <v-icon>{{ menu.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ menu.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="handleLogout" class="menu-item">
              <v-list-item-icon>
                <v-icon>mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>로그아웃</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 오른쪽 콘텐츠 섹션 -->
      <v-col cols="12" md="9">
        <!-- 탐색 메뉴 -->
        <v-row class="mb-4">
          <v-col cols="12" class="d-flex justify-center">
            <v-chip-group show-arrows>
              <v-chip v-for="category in categories" :key="category" outlined>
                {{ category }}
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>

        <!-- 숏츠 카드 그리드 -->
        <v-row>
          <v-col v-for="(video, index) in videos" :key="index" cols="12" sm="6" lg="4">
            <v-card class="video-card">
              <v-img :src="video.thumbnail || '/api/placeholder/400/250'" height="250px"></v-img>
              <v-card-title class="d-flex align-center justify-center text-center">
                <span>{{ video.title }}</span>
              </v-card-title>
              <v-card-subtitle class="d-flex align-center justify-center">
                <v-icon left color="pink">mdi-heart</v-icon>
                <span>{{ video.likes }}K</span>
              </v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AuthService from "../services/auth";

export default {
  name: "Main",
  data() {
    return {
      userInfo: {
        email: "",
        nickname: "",
      },
      menus: [
        {
          title: "홈",
          icon: "mdi-home",
          route: "/",
        },
        {
          title: "프로필",
          icon: "mdi-account",
          route: "/profile",
        },
        {
          title: "내 동영상",
          icon: "mdi-video",
          route: "/my-videos",
        },
        {
          title: "새 동영상 업로드",
          icon: "mdi-upload",
          route: "/upload",
        },
        {
          title: "쇼츠 테스트",
          icon: "mdi-video",
          route: "/videos",
        },
      ],
      categories: [
        "모두",
        "노을이 멋진 곳",
        "여행지",
        "힐링스팟",
        "일상생활",
        "문화",
        "음식",
        "경치",
        "동물",
        "쇼핑",
        "기타",
      ],
      videos: [
        {
          title: "멋진 여행지에서의 노을",
          thumbnail: "",
          likes: 10,
        },
        {
          title: "바다를 바라보며 힐링하기",
          thumbnail: "",
          likes: 30.4,
        },
        {
          title: "도시의 밤",
          thumbnail: "",
          likes: 78,
        },
        {
          title: "산책로의 아침",
          thumbnail: "",
          likes: 45,
        },
        {
          title: "카페에서의 여유",
          thumbnail: "",
          likes: 92,
        },
        {
          title: "공원의 봄",
          thumbnail: "",
          likes: 23,
        },
      ],
    };
  },
  async created() {
    try {
      const data = await AuthService.getUserInfo();
      this.userInfo = data;
    } catch (error) {
      console.error("Failed to get user info:", error);
      this.$router.push("/login");
    }
  },
  methods: {
    async handleLogout() {
      try {
        await AuthService.logout();
        this.$router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    },
  },
};
</script>

<style scoped>
.welcome-card {
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  transition: transform 0.2s ease;
}

.welcome-card:hover {
  transform: translateY(-5px);
}

.headline {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.3rem;
  color: #3498db;
  margin: 1rem 0;
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

.menu-item:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.video-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  height: 100%;
}

.video-card:hover {
  transform: scale(1.03);
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .headline {
    font-size: 1.3rem;
  }

  .user-name {
    font-size: 1.1rem;
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .welcome-card,
  .menu-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .headline,
  .v-list-item-title {
    color: #ffffff;
  }

  .user-name {
    color: #64b5f6;
  }

  .menu-item:hover {
    background-color: rgba(100, 181, 246, 0.1);
  }
}
</style>

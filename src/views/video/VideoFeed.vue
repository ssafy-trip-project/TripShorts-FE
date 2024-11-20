<template>
  <div class="video-feed" @scroll="handleScroll" ref="feedContainer">
    <!-- 디버깅용 -->
    <div v-if="videos.length === 0" class="no-videos">No videos available</div>

    <div v-for="video in videos" :key="video.id" class="video-container">
      <!-- 비디오 플레이어 -->
      <video
        :src="video.videoUrl"
        :poster="video.thumbnailUrl"
        class="video-player"
        loop
        muted
        playsinline
        autoplay
        @click="togglePlay"
      ></video>

      <!-- 우측 액션 버튼들 -->
      <div class="action-buttons">
        <div class="action-item">
          <button class="action-button" @click="toggleLike(video)">
            <i class="fas fa-heart" :class="{ liked: video.liked }"></i>
            <span class="action-count">{{ video.likeCount }}</span>
          </button>
        </div>
        <div class="action-item">
          <button class="action-button" @click="openComments(video)">
            <i class="fas fa-comment"></i>
            <span class="action-count">{{ video.commentCount }}</span>
          </button>
        </div>
        <div class="action-item">
          <button class="action-button" @click="openDetails(video)">
            <i class="fas fa-info-circle"></i>
          </button>
        </div>
      </div>

      <!-- 하단 크리에이터 정보 -->
      <div class="creator-info">
        <img :src="video.creator.imageUrl" class="creator-avatar" />
        <span class="creator-nickname">{{ video.creator.nickname }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-indicator">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import api from "@/api";

const videos = ref([]);
const videoRefs = ref([]); // 비디오 엘리먼트 참조를 위한 ref
const loading = ref(false);
const nextCursor = ref(null);
const hasNext = ref(true);
let observer = null;

// 비디오 로드 완료 핸들러
const handleVideoLoaded = (event, index) => {
  console.log(`Video ${index} loaded`);
  const video = event.target;
  // 비디오가 viewport에 있는지 확인하고 재생
  if (observer) {
    observer.observe(video);
  }
};

// Intersection Observer 설정
const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // 화면에 보이면 재생
          video.play().catch((error) => {
            console.log("Video play failed:", error);
          });
        } else {
          // 화면에서 벗어나면 정지
          video.pause();
        }
      });
    },
    {
      threshold: 0.6, // 60% 이상 보일 때 재생
    }
  );
};

const fetchVideos = async () => {
  if (loading.value || !hasNext.value) return;

  try {
    loading.value = true;
    console.log("Fetching videos...");
    const token = localStorage.getItem("accessToken");
    // presignedURL
    const response = await api.get("/api/v1/shorts/feed", {
      params: {
        cursorId: nextCursor.value,
        size: 5,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response:", response.data);

    if (response.data && Array.isArray(response.data.videos)) {
      videos.value = [...videos.value, ...response.data.videos];
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
    }
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    console.log("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  } finally {
    loading.value = false;
  }
};

// 스크롤 핸들러
const handleScroll = async (event) => {
  const container = event.target;
  const scrollPosition = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;

  if (scrollHeight - scrollPosition < 100) {
    await fetchVideos();
  }
};

// 비디오 재생/정지 토글
const togglePlay = (event) => {
  const video = event.target;
  if (video.paused) {
    video.play().catch((error) => {
      console.log("Video play failed:", error);
    });
  } else {
    video.pause();
  }
};

// 좋아요 토글
const toggleLike = async (video) => {
  try {
    video.liked = !video.liked;
    video.likeCount += video.liked ? 1 : -1;
    // TODO: API 연동
  } catch (error) {
    console.error("Failed to toggle like:", error);
  }
};

// 댓글 모달 열기
const openComments = (video) => {
  console.log("Opening comments for video:", video.id);
  // TODO: 댓글 모달 구현
};

// 상세 정보 모달 열기
const openDetails = (video) => {
  console.log("Opening details for video:", video.id);
  // TODO: 상세 정보 모달 구현
};

// 컴포넌트 마운트 시
onMounted(() => {
  setupIntersectionObserver();
  fetchVideos();
});

// 컴포넌트 언마운트 시 Observer 정리
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.video-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background-color: black;
}

.video-container {
  height: 100vh;
  position: relative;
  scroll-snap-align: start;
  overflow: hidden; /* 추가 */
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-buttons {
  position: absolute;
  right: 20px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.action-count {
  font-size: 14px;
}

.creator-info {
  position: absolute;
  left: 20px;
  bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
}

.creator-nickname {
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: white;
}

.liked {
  color: #ff4545;
}

/* 디버깅용 스타일 */
.no-videos {
  color: white;
  text-align: center;
  padding: 20px;
}
</style>

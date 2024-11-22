<template>
  <div class="video-feed" @scroll="handleScroll" ref="feedContainer">
    <!-- 비디오가 없을 때 -->
    <div v-if="videos.length === 0" class="empty-state">
      <div class="empty-message">Loading videos...</div>
    </div>

    <!-- 비디오 리스트 -->
    <VideoItem
      v-for="(video, index) in videos"
      :key="video.id"
      :video="video"
      @video-loaded="handleVideoLoaded($event, index)"
      @like-click="toggleLike"
      @comment-click="openComments"
      @details-click="openDetails"
    />

    <!-- 로딩 인디케이터 -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
    </div>

    <!-- 댓글 사이드패널 -->
    <CommentDrawer
      v-model="showComments"
      :comments="comments"
      @submit-comment="addComment"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import VideoItem from './VideoItem.vue';
import CommentDrawer from './CommentDrawer.vue';
import api from '@/api';

// ref 정의
const videos = ref([]);
const loading = ref(false);
const nextCursor = ref(null);
const hasNext = ref(true);
const feedContainer = ref(null);
const videoRefs = ref([]);
const showComments = ref(false);
const currentVideo = ref(null);
const comments = ref([]);
const router = useRouter();

// 컴포넌트 범위에서 observers 관리
const observers = ref(new Map());

const fetchVideos = async () => {
  if (loading.value || !hasNext.value) return;

  try {
    loading.value = true;
    console.log('Fetching videos...');
    const token = localStorage.getItem('accessToken');

    const response = await api.get('/api/v1/shorts/feed', {
      params: {
        cursorId: nextCursor.value,
        size: 5,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response:', response.data);

    if (response.data && Array.isArray(response.data.videos)) {
      videos.value = [...videos.value, ...response.data.videos];
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
    }
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    console.log('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  } finally {
    loading.value = false;
  }
};

const setupIntersectionObserver = () => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log('Video play failed:', error);
          });
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.6,
    },
  );

  observers.value.set('video-observer', observer);
  return observer;
};

const handleVideoLoaded = (event, index) => {
  console.log(`Video ${index} loaded`);
  const video = event.target;
  const observer =
    observers.value.get('video-observer') || setupIntersectionObserver();
  if (observer) {
    observer.observe(video);
  }
};

const handleScroll = async event => {
  const container = event.target;
  const scrollPosition = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;

  if (scrollHeight - scrollPosition < 100) {
    await fetchVideos();
  }
};

const toggleLike = async video => {
  try {
    video.liked = !video.liked;
    video.likeCount += video.liked ? 1 : -1;
  } catch (error) {
    console.error('Failed to toggle like:', error);
  }
};

const openComments = async video => {
  currentVideo.value = video;
  showComments.value = true;
  try {
    const response = await api.get(`/api/v1/shorts/${video.id}/comments`);
    comments.value = response.data;
    console.log('댓글 응답 데이터 : ', comments.value);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  }
};

const addComment = async content => {
  try {
    const token = localStorage.getItem('accessToken');
    // 댓글 작성
    await api.post(
      `/api/v1/shorts/${currentVideo.value.id}/comment`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // 댓글 목록 새로 가져오기
    const response = await api.get(
      `/api/v1/shorts/${currentVideo.value.id}/comments`,
    );
    comments.value = response.data;
  } catch (error) {
    console.error('Failed to add comment:', error);
  }
};

const openDetails = video => {
  console.log('Opening details for video:', video.id);
  // TODO: 상세 정보 모달 구현
  router.push({
    name: 'VideoDetail',
    query: { videoId: video.id },
  });
};

// showComments 상태가 변경될 때 처리
watch(showComments, newVal => {
  if (!newVal) {
    currentVideo.value = null;
    comments.value = [];
  }
});

onMounted(() => {
  fetchVideos();
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && showComments.value) {
      showComments.value = false;
    }
  });
});

onUnmounted(() => {
  observers.value.forEach(observer => observer.disconnect());
  observers.value.clear();
  window.removeEventListener('keydown', e => {
    if (e.key === 'Escape' && showComments.value) {
      showComments.value = false;
    }
  });
});
</script>

<style scoped>
.video-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background-color: black;
}

.empty-state {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: white;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 액션 버튼 관련 스타일 */
.action-buttons {
  z-index: 10;
}

/* info 버튼 관련 스타일 - 중복 제거 */
.info-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.info-button:hover {
  transform: scale(1.1);
  background-color: rgba(255, 153, 51, 0.7);
}

.info-button i {
  font-size: 20px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.info-tooltip {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.info-button:hover .info-tooltip {
  opacity: 1;
}
</style>

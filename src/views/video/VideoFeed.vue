<template>
  <div class="video-feed" ref="feedContainer">
    <div v-if="videos.length === 0" class="empty-state">
      <div class="empty-message">Loading videos...</div>
    </div>

    <VideoItem
      v-for="(video, index) in videos"
      :key="video.id"
      :video="video"
      @video-loaded="handleVideoLoaded($event, index)"
      @like-click="toggleLike"
      @comment-click="openComments"
      @details-click="openDetails"
    />

    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
    </div>

    <CommentDrawer
      v-model="showComments"
      :comments="comments"
      @submit-comment="addComment"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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
const route = useRoute();
const currentVideoIndex = ref(0);

// 컴포넌트 범위에서 observers 관리
const observers = ref(new Map());
const isMobile = ref(window.innerWidth <= 768);
const PRELOAD_THRESHOLD = 2;

// 초기 비디오 ID를 가져오는 함수
const getInitialVideoIndex = (videos, initialId) => {
  return videos.findIndex(video => video.id === initialId);
};

// VideoFeed.vue script 부분
const fetchVideos = async (sortBy = 'recent', cursorId = null) => {
  if (loading.value) return;

  try {
    loading.value = true;

    const params = {
      sortby: sortBy,
      cursorid: Number(cursorId) || nextCursor.value
    };

    const response = await api.get('/api/v1/shorts/feed', { params });
    const newVideos = response.data.videos;

    // 중복 제거 후 추가
    videos.value = [...videos.value, ...newVideos];
    hasNext.value = response.data.hasNext;
    nextCursor.value = response.data.nextCursor;
  } catch (error) {
    console.error('Failed to fetch videos:', error);
  } finally {
    loading.value = false;
  }
};

const setupVideoObserver = () => {
  const videoObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log('Video play failed:', error);
          });

          incrementViewCount(video.id);

          // 현재 재생 중인 비디오의 인덱스 업데이트
          const index = videoRefs.value.findIndex(v => v === video);
          if (index !== -1) {
            currentVideoIndex.value = index;
            checkAndLoadMoreVideos(index);
          }
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.6,
    },
  );
  return videoObserver;
};

const handleVideoLoaded = (event, index) => {
  console.log(`Video ${index} loaded`);
  const video = event.target;
  videoRefs.value[index] = video;

  // 비디오 observer가 없으면 새로 생성
  const observer =
    observers.value.get('video-observer') || setupVideoObserver();

  // observer를 Map에 저장
  if (!observers.value.has('video-observer')) {
    observers.value.set('video-observer', observer);
  }

  // 비디오 엘리먼트 observe 시작
  observer.observe(video);
};

// 현재 인덱스를 기준으로 추가 비디오 로드가 필요한지 확인
const checkAndLoadMoreVideos = async currentIndex => {
  const remainingVideos = videos.value.length - (currentIndex + 1);
  console.log(`현재 인덱스: ${currentIndex}, 남은 비디오: ${remainingVideos}`);

  if (remainingVideos <= PRELOAD_THRESHOLD && !loading.value && hasNext.value) {
    console.log('추가 비디오 로드 시작');
    await fetchVideos(route.query.sortBy || 'recent', nextCursor.value);
  }
};

const incrementViewCount = async videoId => {
  try {
    await api.post(`/api/v1/shorts/${videoId}/view`);
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
};

const toggleLike = async video => {
  try {
    if (!video.liked) {
      // 좋아요 추가
      await api.post(`/api/v1/goods/${video.id}/like`);
      video.liked = true;
      video.likeCount += 1;
    } else {
      // 좋아요 취소
      await api.delete(`/api/v1/goods/${video.id}/like`);
      video.liked = false;
      video.likeCount -= 1;
    }
  } catch (error) {
    // 에러 발생 시 상태 롤백
    if (!video.liked) {
      video.likeCount -= 1;
    } else {
      video.likeCount += 1;
    }
    video.liked = !video.liked;

    if (error.response?.status === 400) {
      console.error('이미 좋아요를 누른 영상입니다.');
    } else {
      console.error('Failed to toggle like:', error);
    }
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

onMounted(async () => {
  const initialVideoId = route.query.initialVideoId;
  const sortBy = route.query.sortBy || 'recent';

  if (initialVideoId) { 
    await fetchVideos(sortBy, initialVideoId);
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && showComments.value) {
      showComments.value = false;
    }
  });

  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
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
  window.removeEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});
</script>

<style scoped>
.video-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background-color: black;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.loading-indicator {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #fe2c55;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .video-feed {
    /* 모바일 Safari에서 전체 화면 스크롤 개선 */
    height: -webkit-fill-available;
  }

  .empty-state {
    font-size: 14px;
  }

  .spinner {
    width: 24px;
    height: 24px;
  }

  .loading-indicator {
    padding: 16px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

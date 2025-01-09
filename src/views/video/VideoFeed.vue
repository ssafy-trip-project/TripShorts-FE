<template>
  <div class="video-feed" ref="feedContainer">
    <div class="back-button" @click="router.back()">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </div>

    <div v-if="videos.length === 0" class="empty-state">
      <div class="empty-message">Loading videos...</div>
    </div>

    <div
      v-for="(video, index) in videos"
      :key="video.id"
      class="video-container"
    >
      <VideoItem
        :video="video"
        :data-video-id="video.id"
        @video-loaded="handleVideoLoaded($event, index)"
        @like-click="toggleLike"
        @comment-click="openComments"
        @details-click="openDetails"
      />

      <!-- 비디오별 오버레이 (하단 정보) -->
      <div class="video-overlay" v-if="video.tags">
        <!-- 태그 목록 -->
        <div class="tags-section">
          <div class="tags-container">
            <span v-for="tag in video.tags.tags" :key="tag.name" class="tag">
              #{{ tag.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
const initialLoad = ref(true);

// 컴포넌트 범위에서 observers 관리
const observers = ref(new Map());
const isMobile = ref(window.innerWidth <= 768);
const PRELOAD_THRESHOLD = 2;

const togglePlay = event => {
  if (event.target.tagName === 'VIDEO') {
    const video = event.target;
    if (video.paused) {
      video.manuallyPaused = false; // 수동 정지 상태 해제
      video.play().catch(error => {
        console.log('Video play failed:', error);
      });
    } else {
      video.manuallyPaused = true; // 수동 정지 상태 설정
      video.pause();
    }
  }
};

// 초기 비디오 ID를 가져오는 함수
const getInitialVideoIndex = (videos, initialId) => {
  return videos.findIndex(video => video.id === initialId);
};

const fetchVideos = async (sortBy = 'recent', cursorId = null) => {
  try {
    loading.value = true;
    console.log('Fetching with sort:', sortBy);

    const params = {
      sortby: sortBy,
      cursorid: Number(cursorId),
      size: 5,
    };

    console.log('Request params:', params);
    const response = await api.get('/api/v1/shorts/feed', { params });
    console.log('Response:', response.data);

    // VideoPageResponse 형식으로 받은 데이터를 배열로 변환
    const pageResponse = response.data;
    videos.value = [
      ...pageResponse.previousVideos,
      pageResponse.currentVideo,
      ...pageResponse.nextVideos,
    ];

    // 현재 비디오의 인덱스 찾기 - getInitialVideoIndex 함수 사용
    if (cursorId) {
      const selectedIndex = getInitialVideoIndex(videos.value, cursorId);
      if (selectedIndex !== -1) {
        currentVideoIndex.value = selectedIndex;
        initialLoad.value = true; // 초기 로드임을 표시
      }
    }
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
        const videoElement = video.closest('[data-video-id]');
        if (!videoElement) return;

        if (entry.isIntersecting && !video.manuallyPaused) {
          video.play().catch(error => {
            console.log('Video play failed:', error);
          });

          // 초기 로드가 끝난 후에만 추가 로드 로직 실행
          if (!initialLoad.value) {
            const index = videos.value.findIndex(
              v => v.id === Number(videoElement.dataset.videoId),
            );
            if (index !== -1) {
              currentVideoIndex.value = index;
              incrementViewCount(videos.value[index].id);
              checkAndLoadMoreVideos(index);
            }
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

  const observer =
    observers.value.get('video-observer') || setupVideoObserver();
  if (!observers.value.has('video-observer')) {
    observers.value.set('video-observer', observer);
  }

  // 초기 로드인 경우, 선택된 비디오의 인덱스를 찾아서 처리
  if (initialLoad.value && route.query.initialVideoId) {
    const selectedIndex = getInitialVideoIndex(
      videos.value,
      Number(route.query.initialVideoId),
    );
    if (selectedIndex !== -1 && index === selectedIndex) {
      nextTick(() => {
        const container = feedContainer.value;
        if (container) {
          container.scrollTop = container.clientHeight * selectedIndex;
          video.play().catch(console.error);
          // 모든 초기 설정이 끝난 후에 initialLoad를 false로 설정
          setTimeout(() => {
            initialLoad.value = false;
          }, 100);
        }
      });
    }
  }

  observer.observe(video);
};

const loadMoreVideos = async (
  sortBy = 'recent',
  cursorId = null,
  direction = 'next',
) => {
  try {
    loading.value = true;
    console.log(
      `Loading more videos with sort: ${sortBy}, direction: ${direction}`,
    );

    const params = {
      sortby: sortBy,
      cursorid: Number(cursorId),
      size: 2,
    };

    console.log('Request params for more videos:', params);
    const response = await api.get('/api/v1/shorts/feed/next', { params });
    console.log('Response for more videos:', response.data);

    // 응답이 바로 비디오 배열이므로 직접 배열을 사용
    if (direction === 'next') {
      videos.value = [...videos.value, ...response.data];
    } else {
      videos.value = [...response.data, ...videos.value];
    }
  } catch (error) {
    console.error('Failed to load more videos:', error);
  } finally {
    loading.value = false;
  }
};

const checkAndLoadMoreVideos = async currentIndex => {
  const remainingNext = videos.value.length - (currentIndex + 1);
  console.log(`현재 인덱스: ${currentIndex}, 남은 비디오: ${remainingNext}`);

  // 초기 로드가 끝난 후에만, 그리고 아래 방향으로만 추가 로드
  if (
    !loading.value &&
    !initialLoad.value &&
    remainingNext <= PRELOAD_THRESHOLD
  ) {
    console.log('다음 비디오 로드 시작');
    const currentSortBy = route.query.sortBy || 'recent';
    const lastVideoId = videos.value[videos.value.length - 1].id;
    await loadMoreVideos(currentSortBy, lastVideoId, 'next');
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
      await api.post(`/api/v1/goods/${video.id}/like`);
      video.liked = true;
      video.likeCount += 1;
    } else {
      await api.delete(`/api/v1/goods/${video.id}/like`);
      video.liked = false;
      video.likeCount -= 1;
    }
  } catch (error) {
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
    await api.post(
      `/api/v1/shorts/${currentVideo.value.id}/comment`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const response = await api.get(
      `/api/v1/shorts/${currentVideo.value.id}/comments`,
    );
    comments.value = response.data;

    const videoIndex = videos.value.findIndex(
      v => v.id === currentVideo.value.id,
    );
    if (videoIndex !== -1) {
      videos.value[videoIndex] = {
        ...videos.value[videoIndex],
        commentCount: videos.value[videoIndex].commentCount + 1,
      };
    }
  } catch (error) {
    console.error('Failed to add comment:', error);
  }
};

const openDetails = video => {
  console.log('Opening details for video:', video.id);
  router.push({
    name: 'VideoDetail',
    query: { videoId: video.id },
  });
};

watch(showComments, newVal => {
  if (!newVal) {
    currentVideo.value = null;
    comments.value = [];
  }
});

onMounted(async () => {
  const initialVideoId = route.query.initialVideoId;
  const sortBy = route.query.sortBy || 'recent';

  console.log('Initial mount with sortBy:', sortBy); // 로그 추가
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

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.video-container {
  height: 100vh;
  position: relative;
  scroll-snap-align: center;
}

.video-overlay {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  z-index: 2;
  pointer-events: none;
}

.tags-section {
  margin-left: 150px;
  pointer-events: auto;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 8px;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  cursor: pointer;
}

.tag:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
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

.back-button {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

@media (max-width: 768px) {
  .back-button {
    top: 12px;
    left: 12px;
    width: 36px;
    height: 36px;
  }
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

  .video-overlay {
    padding: 16px;
    bottom: 100px;
  }

  .tag {
    font-size: 12px;
    padding: 4px 10px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

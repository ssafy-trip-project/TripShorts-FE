<template>
  <div class="video-feed" @scroll="handleScroll" ref="feedContainer">
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

const isMobile = ref(window.innerWidth <= 768);

// 비디오 데이터를 가져올 때 좋아요 상태도 함께 받아오도록 fetchVideos 수정
const fetchVideos = async () => {
  if (loading.value || !hasNext.value) return;

  try {
    loading.value = true;

    const response = await api.get('/api/v1/shorts/feed', {
      params: {
        cursorId: nextCursor.value,
        size: 5,
      },
    });

    if (response.data && Array.isArray(response.data.videos)) {
      // 각 비디오의 좋아요 상태 조회
      const videosWithLikeStatus = await Promise.all(
        response.data.videos.map(async video => {
          try {
            const likeStatus = await api.get(
              `/api/v1/goods/${video.id}/status`,
            );
            return {
              ...video,
              liked: likeStatus.data.liked,
              likeCount: likeStatus.data.totalLikes,
            };
          } catch (error) {
            console.error(
              `Failed to fetch like status for video ${video.id}:`,
              error,
            );
            return {
              ...video,
              liked: false,
              likeCount: 0,
            };
          }
        }),
      );

      videos.value = [...videos.value, ...videosWithLikeStatus];
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
    }
  } catch (error) {
    console.error('Failed to fetch videos:', error);
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

onMounted(() => {
  fetchVideos();
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

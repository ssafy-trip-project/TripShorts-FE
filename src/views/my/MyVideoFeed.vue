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
import VideoItem from '../video/VideoItem.vue';
import CommentDrawer from '../video/CommentDrawer.vue';
import api from '@/api';

const router = useRouter();
const route = useRoute();
const videos = ref([]);
const loading = ref(false);
const nextCursor = ref(null);
const hasNext = ref(true);
const feedContainer = ref(null);
const videoRefs = ref([]);
const showComments = ref(false);
const currentVideo = ref(null);
const comments = ref([]);
const currentVideoIndex = ref(0);

const observers = ref(new Map());
const isMobile = ref(window.innerWidth <= 768);
const PRELOAD_THRESHOLD = 2;

const fetchVideos = async () => {
  if (loading.value || !hasNext.value) return;

  try {
    loading.value = true;
    const params = {
      cursorId: nextCursor.value,
      size: 5,
    };

    // initialVideoId 파라미터 추가
    if (route.query.initialVideoId && videos.value.length === 0) {
      params.initialVideoId = Number(route.query.initialVideoId);
    }

    const response = await api.get('/api/v1/shorts/my-videos/feed', { params });
    console.log(
      'Response videos: ',
      response.data.videos.map(v => ({
        id: v.id,
        videoId: v.videoId,
      })),
    );
    if (response.data && Array.isArray(response.data.videos)) {
      // 재정렬 로직 제거하고 단순히 데이터 추가만
      videos.value = [...videos.value, ...response.data.videos];
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
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
        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log('Video play failed:', error);
          });

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

const checkAndLoadMoreVideos = async currentIndex => {
  const remainingVideos = videos.value.length - (currentIndex + 1);
  if (remainingVideos <= PRELOAD_THRESHOLD && !loading.value && hasNext.value) {
    await fetchVideos();
  }
};

const handleVideoLoaded = (event, index) => {
  const video = event.target;
  videoRefs.value[index] = video;

  const observer =
    observers.value.get('video-observer') || setupVideoObserver();

  if (!observers.value.has('video-observer')) {
    observers.value.set('video-observer', observer);
  }

  observer.observe(video);
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
    console.error('Failed to toggle like:', error);
  }
};

const openComments = async video => {
  currentVideo.value = video;
  showComments.value = true;
  try {
    const response = await api.get(`/api/v1/shorts/${video.id}/comments`);
    comments.value = response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  }
};

const addComment = async content => {
  try {
    await api.post(`/api/v1/shorts/${currentVideo.value.id}/comment`, {
      content,
    });
    const response = await api.get(
      `/api/v1/shorts/${currentVideo.value.id}/comments`,
    );
    comments.value = response.data;
  } catch (error) {
    console.error('Failed to add comment:', error);
  }
};

const openDetails = video => {
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
  await fetchVideos();

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
    height: -webkit-fill-available;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

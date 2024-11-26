<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import VideoItem from '../video/VideoItem.vue';
import CommentDrawer from '../video/CommentDrawer.vue';
import api from '@/api';

const route = useRoute();
const router = useRouter();

// refs
const feedContainer = ref(null);
const videos = ref([]);
const loading = ref(false);
const videoRefs = ref([]);
const showComments = ref(false);
const currentVideo = ref(null);
const comments = ref([]);
const observers = ref(new Map());
const currentVideoIndex = ref(0);
const initialScrollDone = ref(false);

// computed
const isAtStart = computed(() => currentVideoIndex.value === 0);
const isAtEnd = computed(
  () => currentVideoIndex.value === videos.value.length - 1,
);

// 모든 비디오 로드
const loadVideos = async () => {
  try {
    loading.value = true;
    const response = await api.get('/api/v1/shorts/my-videos/feed');
    videos.value = response.data.videos || [];
    console.log('API response: ', response.data);
    // 초기 비디오 ID로 인덱스 설정
    const initialVideoId = Number(route.query.initialVideoId);
    console.log('Initial Video ID:', initialVideoId);

    if (initialVideoId && videos.value.length > 0) {
      const initialIndex = videos.value.findIndex(v => v.id === initialVideoId);
      console.log('Found Index:', initialIndex);

      if (initialIndex !== -1) {
        currentVideoIndex.value = initialIndex;
      }
    }
  } catch (error) {
    console.error('Failed to fetch videos:', error);
  } finally {
    loading.value = false;
  }
};

// 특정 비디오로 스크롤
const scrollToVideo = async index => {
  if (initialScrollDone.value) return;

  await nextTick();
  const videoElements = document.querySelectorAll('.video-item');
  if (videoElements[index]) {
    videoElements[index].scrollIntoView({ behavior: 'auto' });
    initialScrollDone.value = true;
  }
};

watch(loading, async newValue => {
  if (!newValue && !initialScrollDone.value) {
    // 로딩이 완료되면 현재 선택된 비디오로 스크롤
    await scrollToVideo(currentVideoIndex.value);
  }
});

const setupVideoObserver = () => {
  const videoObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;
        const videoElement = video.closest('[data-video-id]');
        if (!videoElement) return;

        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log('Video play failed:', error);
          });

          // 현재 보이는 비디오의 인덱스 업데이트
          const index = videos.value.findIndex(
            v => v.id === Number(videoElement.dataset.videoId),
          );
          if (index !== -1) {
            currentVideoIndex.value = index;
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

onMounted(() => {
  loadVideos();
});

onUnmounted(() => {
  observers.value.forEach(observer => observer.disconnect());
  observers.value.clear();
});
</script>

<template>
  <div class="video-feed" ref="feedContainer">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div v-if="isAtStart" class="edge-indicator start">
        첫 번째 동영상입니다
      </div>

      <div
        v-for="(video, index) in videos"
        :key="video.id"
        class="video-container"
      >
        <VideoItem
          :video="video"
          :data-video-id="video.id"
          :is-active="index === currentVideoIndex"
          :is-first="index === 0"
          :is-last="index === videos.length - 1"
          @video-loaded="handleVideoLoaded($event, index)"
          @like-click="toggleLike"
          @comment-click="openComments"
          @details-click="openDetails"
          class="video-item"
        />

        <!-- 비디오 오버레이 (하단 정보) -->
        <div class="video-overlay">
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

      <div v-if="isAtEnd" class="edge-indicator end">마지막 동영상입니다</div>

      <CommentDrawer
        v-model="showComments"
        :comments="comments"
        @submit-comment="addComment"
      />
    </template>
  </div>
</template>

<style scoped>
.video-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background: black;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.video-container {
  height: 100vh;
  position: relative;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.video-item {
  height: 100%;
  width: 100%;
}

.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  z-index: 2;
}

/* 태그 섹션 스타일 */
.tags-section {
  margin-bottom: 25px;
  margin-left: 150px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 12px;
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
}

.tag:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* 로딩 상태 스타일 */
.loading-state {
  height: 100vh;
  display: grid;
  place-items: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #fe2c55;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .video-overlay {
    padding: 16px;
  }

  .tag {
    font-size: 12px;
    padding: 4px 10px;
  }

  .spinner {
    width: 24px;
    height: 24px;
  }
}
</style>

<template>
  <div class="bg-black min-h-screen">
    <div class="p-4">
      <!-- Username -->
      <h1 class="text-white text-xl mb-8">{{ username || '-' }}</h1>

      <!-- Post Count -->
      <div class="text-center mb-8">
        <div class="text-white text-lg">{{ videos.length }}</div>
        <div class="text-gray-400 text-sm">게시물</div>
      </div>
    </div>

    <!-- Grid Content -->
    <div class="posts-grid">
      <div
        v-for="video in videos"
        :key="video.videoId"
        class="post-image-container"
        @click="goToVideo(video.videoId)"
      >
        <img
          :src="video.thumbnailUrl"
          :alt="video.tourName"
          class="post-image"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-4">
      <div
        class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"
      ></div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 text-center text-red-500">
      {{ error }}
    </div>

    <!-- Intersection Observer Target -->
    <div v-if="hasNext" ref="observerTarget" class="h-4 w-full"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';

const router = useRouter();
const videos = ref([]);
const username = ref('');
const isLoading = ref(false);
const error = ref(null);
const nextCursor = ref(null);
const hasNext = ref(false);
const observerTarget = ref(null);

const fetchVideos = async (cursor = null) => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    error.value = null;

    const params = new URLSearchParams();
    params.append('size', '12');
    if (cursor) params.append('cursorId', cursor);

    const response = await api.get(
      `/api/v1/shorts/my-videos?${params.toString()}`,
    );

    if (cursor === null) {
      // 첫 로딩
      videos.value = response.data.videos;
      username.value = response.data.nickname;
    } else {
      // 추가 로딩
      videos.value = [...videos.value, ...response.data.videos];
    }

    nextCursor.value = response.data.nextCursor;
    hasNext.value = response.data.hasNext;
  } catch (e) {
    console.error('Failed to fetch videos:', e);
    error.value = '동영상을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const goToVideo = videoId => {
  router.push(`/shorts/${videoId}`);
};

// Intersection Observer 설정
const observer = new IntersectionObserver(
  entries => {
    if (entries[0].isIntersecting && hasNext.value && !isLoading.value) {
      fetchVideos(nextCursor.value);
    }
  },
  { threshold: 0.5 },
);

onMounted(() => {
  fetchVideos();
});

onMounted(() => {
  if (observerTarget.value) {
    observer.observe(observerTarget.value);
  }
});

onUnmounted(() => {
  observer.disconnect();
});
</script>

<style scoped>
.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background-color: #262626;
  padding: 1px;
}

.post-image-container {
  aspect-ratio: 1;
  overflow: hidden;
  background-color: black;
  cursor: pointer;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

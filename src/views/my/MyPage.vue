<template>
  <div class="bg-black min-h-screen">
    <div class="p-4">
      <!-- Username -->
      <h1 class="text-white text-xl mt-10 ml-10 mb-8">{{ username || '-' }}</h1>

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
      >
        <div class="image-wrapper">
          <!-- Thumbnail -->
          <img
            :src="video.thumbnailUrl"
            :alt="video.tourName"
            class="post-image"
            loading="lazy"
            @click="goToVideoFeed(video.videoId)"
          />
        </div>

        <!-- 삭제 버튼 -->
        <div class="delete-button-wrapper">
          <v-btn
            color="error"
            variant="text"
            @click.stop="confirmDelete(video)"
            class="delete-button"
          >
            <v-icon size="20">mdi-delete</v-icon>
            <span class="ml-2 text-sm">삭제</span>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="showDeleteModal" max-width="400">
      <v-card>
        <v-card-text class="pa-4"> 이 동영상을 삭제하시겠습니까? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteModal = false"
          >
            취소
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteVideo">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-4">
      <v-progress-circular indeterminate color="white"></v-progress-circular>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 text-center text-error">
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
const selectedVideo = ref(null);
const showDeleteModal = ref(false);

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

const goToVideoFeed = videoId => {
  console.log('Navigating to video feed with ID:', videoId);
  try {
    router
      .push({
        name: 'my-videos-feed',
        query: {
          initialVideoId: videoId,
        },
      })
      .catch(err => {
        console.error('Navigation failed:', err);
      });
  } catch (error) {
    console.error('Error during navigation:', error);
  }
};

// 삭제 확인 모달 열기
const confirmDelete = video => {
  selectedVideo.value = video;
  showDeleteModal.value = true;
};

// 비디오 삭제
const deleteVideo = async () => {
  try {
    console.log('Deleting video with ID:', selectedVideo.value.videoId); // 디버깅 로그 추가
    await api.delete(`/api/v1/shorts/my-videos/${selectedVideo.value.videoId}`);
    videos.value = videos.value.filter(
      v => v.videoId !== selectedVideo.value.videoId,
    );
    showDeleteModal.value = false;
    selectedVideo.value = null;
  } catch (error) {
    console.error('Failed to delete video:', error.response || error.message);
    error.value = '삭제에 실패했습니다. 다시 시도해주세요.';
  }
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
  position: relative;
  background-color: black;
}

.image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-button-wrapper {
  text-align: center;
  margin-top: 4px;
}

.delete-button {
  font-size: 0.9rem;
  color: white !important;
}

/* 반응형 스타일 */
@media (max-width: 640px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .posts-grid {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>

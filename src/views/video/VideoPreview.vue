<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVideoStore } from '@/stores/videoStore';

const router = useRouter();
const videoStore = useVideoStore();
const videoUrl = ref(null);
const thumbnailUrl = ref(null);
const thumbnailBlob = ref(null);

onMounted(async () => {
  const videoData = videoStore.recordedVideo;
  if (!videoData) {
    router.push('/upload');
    return;
  }

  videoUrl.value = URL.createObjectURL(videoData.blob);
  await generateThumbnail(videoUrl.value);
});

async function generateThumbnail(videoUrl) {
  try {
    const video = document.createElement('video');
    video.src = videoUrl;

    await new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.currentTime = 1;
        video.onseeked = resolve;
      };
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        thumbnailBlob.value = blob;
        thumbnailUrl.value = URL.createObjectURL(blob);
        // 썸네일 생성 후 바로 store에 저장
        videoStore.setThumbnail(blob);
      },
      'image/jpeg',
      0.85,
    );
  } catch (error) {
    console.error('Thumbnail generation error:', error);
  }
}

function registTourInfo() {
  router.push('/registtour');
}

function reRecord() {
  router.push('/upload');
}

function cancel() {
  router.push('/');
}

onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
  if (thumbnailUrl.value) {
    URL.revokeObjectURL(thumbnailUrl.value);
  }
});
</script>

<template>
  <div class="preview-container">
    <div v-if="!videoUrl" class="loading">비디오 로딩 중...</div>

    <video
      v-if="videoUrl"
      :src="videoUrl"
      controls
      playsinline
      class="preview-video"
      @error="e => console.error('Video element error:', e)"
    ></video>

    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      class="preview-thumbnail"
      alt="영상 썸네일"
    />

    <div class="preview-controls">
      <div class="button-group">
        <v-btn @click="registTourInfo" color="primary" class="mx-2">
          여행지 정보 등록
        </v-btn>
        <v-btn @click="reRecord" text class="mx-2"> 다시 녹화 </v-btn>
        <v-btn @click="cancel" text class="mx-2"> 취소 </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #121212;
}

.preview-video {
  max-width: 90%;
  max-height: 70vh;
  margin-bottom: 20px;
}

.preview-thumbnail {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid #333;
  border-radius: 4px;
  margin: 20px 0;
}

.preview-controls {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>

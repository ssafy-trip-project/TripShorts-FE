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
    <div class="top-nav">
      <v-btn class="back-btn" @click="cancel" variant="text">
        <v-icon size="28">mdi-arrow-left</v-icon>
      </v-btn>
      <span class="nav-title">새로운 게시물</span>
      <v-btn class="next-btn" @click="registTourInfo" variant="text">
        다음
      </v-btn>
    </div>

    <div class="content-section">
      <div class="loading-overlay" v-if="!videoUrl">
        <v-progress-circular
          indeterminate
          color="#FF9933"
        ></v-progress-circular>
      </div>

      <div
        class="preview-content"
        v-if="videoUrl"
        style="display: flex; flex-direction: column; height: 100%"
      >
        <div class="video-container" style="flex-grow: 1">
          <video
            :src="videoUrl"
            controls
            playsinline
            class="preview-video"
            @error="e => console.error('Video element error:', e)"
          ></video>
        </div>

        <div class="thumbnail-section" style="margin-bottom: 100px">
          <span class="thumbnail-title">썸네일 이미지</span>
          <div class="thumbnail-preview">
            <img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              class="preview-thumbnail"
              alt="영상 썸네일"
            />
          </div>
          <v-btn class="re-record-btn" @click="reRecord" variant="tonal">
            다시 촬영
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100vh;
  background: #fff8f0;
  display: flex;
  flex-direction: column;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff3e6;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.back-btn {
  color: #333333 !important;
  min-width: 0;
  padding: 0 16px;
}

.nav-title {
  color: #333333;
  font-size: 16px;
  font-weight: 600;
}

.next-btn {
  color: #ffffff !important;
  font-weight: 500;
  background: #b15c1b !important;
  border-radius: 24px;
  padding: 4px 20px !important;
  letter-spacing: 0.3px;
  height: 36px !important;
}

.content-section {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff8f0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
}

.preview-video {
  width: 100%;
  height: 65vh;
  object-fit: contain;
  background: #fff8f0;
}

.thumbnail-section {
  padding: 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff8f0;
}

.thumbnail-title {
  color: #333333;
  font-size: 15px;
  font-weight: 600;
  width: 100px;
}

.thumbnail-preview {
  flex: 1;
  display: flex;
  justify-content: center;
}

.preview-thumbnail {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.re-record-btn {
  height: 36px !important;
  min-width: 100px !important;
  background: #b15c1b !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  font-size: 14px;
  border-radius: 24px !important;
  text-align: center;
  transition: all 0.2s ease !important;
}

.re-record-btn:active {
  transform: scale(0.98);
  background: #ebebeb !important;
}

@media (max-width: 768px) {
  .preview-video {
    height: 50vh;
  }

  .thumbnail-section {
    padding: 20px 16px;
  }

  .preview-thumbnail {
    width: 90px;
    height: 120px;
  }

  .top-nav {
    padding: 12px 16px;
  }
}
</style>

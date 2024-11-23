<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue';
import RecordRTC from 'recordrtc';
import { useRouter } from 'vue-router';
import { useVideoStore } from '@/stores/videoStore';

const router = useRouter();
const video = ref(null);
let recorder = null;
let stream = null;
const recording = ref(false);
const error = ref(null);
const showPreviewButton = ref(false);
const recordedData = ref(null);
const videoStore = useVideoStore();
const progress = ref(0);
let progressInterval;
const MAX_DURATION = 60; // 최대 녹화 시간 (초)

function getSupportedMimeType() {
  const types = [
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
    'video/mp4;codecs=h264,aac',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: true,
    });

    if (video.value) {
      video.value.srcObject = stream;
      await video.value.play();
    }
  } catch (err) {
    error.value = '카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.';
    console.error(err);
  }
});

async function startRecording() {
  progress.value = 0;
  try {
    showPreviewButton.value = false;
    recordedData.value = null;

    const mimeType = getSupportedMimeType();
    recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: mimeType,
      disableLogs: true,
      recorderType: RecordRTC.MediaStreamRecorder,
      numberOfAudioChannels: 2,
      checkForInactiveTracks: true,
      bufferSize: 16384,
    });

    recorder.startRecording();
    recording.value = true;

    // progress 업데이트 간격을 더 짧게 하여 더 부드럽게 만듦
    const updateInterval = 50; // 50ms마다 업데이트
    const incrementPerInterval = (100 / MAX_DURATION) * (updateInterval / 1000);

    progressInterval = setInterval(() => {
      progress.value += incrementPerInterval;
      if (progress.value >= 100) {
        stopRecording();
      }
    }, updateInterval);
  } catch (error) {
    console.error('카메라 접근 실패:', error);
    alert('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
  }
}

async function stopRecording() {
  clearInterval(progressInterval);
  if (recorder) {
    recording.value = false;
    return new Promise(resolve => {
      recorder.stopRecording(async () => {
        const blob = recorder.getBlob();
        console.log('Recorded blob:', blob);
        const videoData = {
          blob,
          type: blob.type,
          url: URL.createObjectURL(blob),
        };
        console.log('Video data being stored:', videoData);
        recordedData.value = videoData;
        videoStore.setRecordedVideo(videoData);
        showPreviewButton.value = true;
        resolve();
      });
    });
  }
}

function resetRecording() {
  showPreviewButton.value = false;
  recordedData.value = null;
  progress.value = 0;
  recording.value = false;
}

// progress circle의 style 계산
const progressStyle = computed(() => {
  const circumference = 2 * Math.PI * 46; // r=46
  const offset = circumference - (progress.value / 100) * circumference;
  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset,
  };
});

function goToPreview() {
  if (recordedData.value) {
    router.push({ name: 'video-preview' });
  }
}

function cancelRecording() {
  router.push('/');
}

onUnmounted(() => {
  clearInterval(progressInterval);
  if (recorder) {
    recorder.destroy();
    recorder = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  if (recordedData.value?.url) {
    URL.revokeObjectURL(recordedData.value.url);
  }
});
</script>

<template>
  <div class="recorder-fullscreen">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="video-container">
      <video
        ref="video"
        autoplay
        playsinline
        muted
        class="fullscreen-video"
      ></video>

      <!-- 상단 네비게이션 -->
      <div class="top-controls">
        <v-btn @click="cancelRecording" icon class="nav-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- 녹화 버튼 및 진행 상태 -->
      <div class="bottom-controls" v-if="!showPreviewButton">
        <div class="record-button-container">
          <svg class="progress-ring" width="100" height="100">
            <circle
              class="progress-ring__circle"
              :class="{ active: recording }"
              stroke="#fe2c55"
              stroke-width="3"
              fill="transparent"
              r="46"
              cx="50"
              cy="50"
              :style="progressStyle"
            />
          </svg>
          <button
            class="record-button"
            @click="recording ? stopRecording() : startRecording()"
          >
            <div class="record-button-inner"></div>
          </button>
        </div>
      </div>

      <!-- 녹화 완료 후 컨트롤 -->
      <div v-if="showPreviewButton" class="preview-controls">
        <v-btn
          color="primary"
          rounded="pill"
          class="preview-btn"
          @click="goToPreview"
          elevation="2"
        >
          다음
          <v-icon right>mdi-arrow-right</v-icon>
        </v-btn>
        <v-btn
          variant="tonal"
          rounded="pill"
          class="re-record-btn"
          @click="resetRecording"
          color="white"
        >
          다시 촬영
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recorder-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 1000;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
}

.nav-btn {
  color: white !important;
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(8px);
}

.bottom-controls {
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.record-button-container {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-ring {
  position: absolute;
  transform: rotate(-90deg);
  z-index: 1;
}

.progress-ring__circle {
  transition: stroke-dashoffset 0.35s linear;
  transform-origin: 50% 50%;
}

.record-button {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

.record-button-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.preview-controls {
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.preview-btn {
  min-width: 200px !important;
  height: 44px !important;
  background: white !important;
  color: black !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

.re-record-btn {
  height: 44px !important;
  min-width: 200px !important;
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
}

.error-message {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(244, 67, 54, 0.95);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 1001;
  backdrop-filter: blur(8px);
}

@media (max-width: 768px) {
  .bottom-controls {
    bottom: 0px;
  }

  .preview-controls {
    bottom: 0px;
  }

  .preview-btn,
  .re-record-btn {
    min-width: 160px !important;
  }
}
</style>

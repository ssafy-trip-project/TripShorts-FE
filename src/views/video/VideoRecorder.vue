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

      <div class="top-controls">
        <v-btn @click="cancelRecording" icon class="nav-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="bottom-controls" v-if="!showPreviewButton">
        <div class="record-button-container">
          <svg class="progress-ring" width="100" height="100">
            <circle
              class="progress-ring__circle"
              :class="{ active: recording }"
              stroke="#FF9933"
              stroke-width="2"
              fill="transparent"
              r="46"
              cx="50"
              cy="50"
              :style="progressStyle"
            />
          </svg>
          <button
            class="record-button"
            :class="{ 'is-recording': recording }"
            @click="recording ? stopRecording() : startRecording()"
          >
            <div class="record-button-inner">
              <div class="record-icon"></div>
            </div>
          </button>
        </div>
      </div>

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
  background: #fff8f0;
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
  color: #8b4513 !important;
  background: rgba(255, 248, 240, 0.3) !important;
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
  opacity: 0.9;
}

.record-button {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.record-button:active {
  transform: scale(0.95);
}

.record-button-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.record-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ff9933;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 153, 51, 0.3);
}

/* 녹화 중일 때의 스타일 */
.record-button.is-recording .record-button-inner {
  background: rgba(255, 153, 51, 0.15);
  border-color: rgba(255, 153, 51, 0.8);
}

.record-button.is-recording .record-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #ff9933;
}

.preview-controls {
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.preview-btn {
  min-width: 200px !important;
  height: 44px !important;
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
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
  background: rgba(255, 153, 51, 0.95);
  color: #fff8f0;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 1001;
  backdrop-filter: blur(8px);
}

@media (max-width: 768px) {
  .record-button {
    width: 64px;
    height: 64px;
  }

  .record-icon {
    width: 24px;
    height: 24px;
  }

  .record-button.is-recording .record-icon {
    width: 18px;
    height: 18px;
  }
  .bottom-controls {
    bottom: 0px;
  }

  .preview-controls {
    bottom: 0px;
  }

  .preview-btn,
  .re-record-btn {
    min-width: 160px !important;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}
</style>

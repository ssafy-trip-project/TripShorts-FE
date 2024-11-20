<script setup>
import { ref, onUnmounted, onMounted } from 'vue';
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
  } catch (error) {
    console.error('카메라 접근 실패:', error);
    alert('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
  }
}

async function stopRecording() {
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

function goToPreview() {
  if (recordedData.value) {
    router.push({ name: 'video-preview' });
  }
}

function cancelRecording() {
  router.push('/');
}

onUnmounted(() => {
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

      <div class="overlay-controls">
        <v-btn @click="cancelRecording" icon class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <div class="control-buttons">
          <v-btn
            v-if="!showPreviewButton"
            @click="recording ? stopRecording() : startRecording()"
            :color="recording ? 'error' : 'primary'"
            rounded
            class="record-btn"
          >
            <v-icon left>{{ recording ? 'mdi-stop' : 'mdi-record' }}</v-icon>
            {{ recording ? '녹화 중지' : '녹화 시작' }}
          </v-btn>

          <template v-if="showPreviewButton">
            <v-btn
              color="primary"
              rounded
              class="preview-btn"
              @click="goToPreview"
            >
              <v-icon left>mdi-eye</v-icon>
              미리보기
            </v-btn>
            <v-btn text class="re-record-btn" @click="startRecording">
              <v-icon left>mdi-refresh</v-icon>
              다시 녹화
            </v-btn>
          </template>
        </div>
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

.overlay-controls {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5) !important;
  color: white !important;
}

.control-buttons {
  display: flex;
  gap: 16px;
  flex-direction: column;
  align-items: center;
}

.record-btn,
.preview-btn,
.re-record-btn {
  padding: 0 30px !important;
  height: 50px !important;
}

.error-message {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(244, 67, 54, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1001;
}
</style>

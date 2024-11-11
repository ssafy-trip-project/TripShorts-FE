<script setup>
import { ref, onUnmounted } from 'vue';
import RecordRTC from 'recordrtc';

const video = ref(null);
let recorder = null;
const recordedChunks = ref([]);
const recordedVideo = ref(null);
const recordedVideoUrl = ref(null);
const recording = ref(false);

async function toggleRecording() {
  if (!recording.value) {
    await startRecording();
  } else {
    stopRecording();
  }
  recording.value = !recording.value;
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.value.srcObject = stream;

    // RecordRTC 인스턴스 생성
    recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm',
      disableLogs: true,
    });
    
    recorder.startRecording();
  } catch (error) {
    console.error("카메라 접근 실패:", error);
  }
}

function stopRecording() {
  recorder.stopRecording(() => {
    // Blob으로 변환 후 비디오 URL 생성
    recordedVideo.value = recorder.getBlob();
    recordedVideoUrl.value = URL.createObjectURL(recordedVideo.value);
    recordedChunks.value = [];
  });
}

async function uploadVideo() {
  const formData = new FormData();
  formData.append("video", recordedVideo.value, "video.webm");

  try {
    await fetch("/shorts/upload", {
      method: "POST",
      body: formData,
    });
    alert("업로드 성공!");
  } catch (error) {
    console.error("업로드 실패:", error);
  }
}

onUnmounted(() => {
  if (recorder) {
    recorder.destroy();
  }
});
</script>

<template>
  <div>
    <video ref="video" autoplay></video>
    <button @click="toggleRecording">{{ recording ? '녹화 종료' : '녹화 시작' }}</button>
    <button v-if="recordedVideo" @click="uploadVideo">업로드</button>
    <video v-if="recordedVideo" :src="recordedVideoUrl" controls></video>
  </div>
</template>

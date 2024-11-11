<script setup>
import { ref, onUnmounted } from 'vue';

const video = ref(null);
let mediaRecorder = null;
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

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };
    mediaRecorder.start();
  } catch (error) {
    console.error("카메라 접근 실패:", error);
  }
}

function stopRecording() {
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks.value, { type: "video/webm" });
    recordedVideo.value = blob;
    recordedVideoUrl.value = URL.createObjectURL(blob);
    recordedChunks.value = [];
  };
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
  if (mediaRecorder) {
    mediaRecorder.stop();
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
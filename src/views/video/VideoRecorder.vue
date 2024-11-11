<script setup>
import { ref, onUnmounted } from 'vue';
import RecordRTC from 'recordrtc';

const video = ref(null);
let recorder = null;
let stream = null;
const recordedVideo = ref(null);
const recordedVideoUrl = ref(null);
const recording = ref(false);

// MIME 타입 체크 함수
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
  return 'video/webm'; // 기본값
}

async function toggleRecording() {
  if (!recording.value) {
    await startRecording();
  } else {
    await stopRecording();
  }
  recording.value = !recording.value;
}

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }, 
      audio: true 
    });

    // Safari에서 srcObject 설정
    if (video.value) {
      try {
        video.value.srcObject = stream;
      } catch (e) {
        video.value.src = URL.createObjectURL(stream);
      }
    }

    const mimeType = getSupportedMimeType();
    
    // RecordRTC 설정
    recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: mimeType,
      disableLogs: true,
      // Safari를 위한 추가 설정
      recorderType: RecordRTC.MediaStreamRecorder,
      numberOfAudioChannels: 2,
      checkForInactiveTracks: true,
      bufferSize: 16384
    });
    
    recorder.startRecording();
  } catch (error) {
    console.error("카메라 접근 실패:", error);
    alert("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
  }
}

async function stopRecording() {
  return new Promise((resolve) => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        
        // Safari에서 MP4로 변환이 필요한 경우
        if (blob.type.includes('webm') && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          // webm을 mp4로 변환하는 로직을 추가할 수 있습니다
          // 여기서는 직접 변환하지 않고 원본 사용
        }

        recordedVideo.value = blob;
        
        // 이전 URL 해제
        if (recordedVideoUrl.value) {
          URL.revokeObjectURL(recordedVideoUrl.value);
        }
        
        recordedVideoUrl.value = URL.createObjectURL(blob);

        // 스트림 정리
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function uploadVideo() {
  if (!recordedVideo.value) {
    alert("녹화된 영상이 없습니다.");
    return;
  }

  const formData = new FormData();
  const fileExtension = recordedVideo.value.type.includes('mp4') ? 'mp4' : 'webm';
  formData.append("video", recordedVideo.value, `video.${fileExtension}`);

  try {
    const response = await fetch("/shorts/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    alert("업로드 성공!");
  } catch (error) {
    console.error("업로드 실패:", error);
    alert("업로드 중 오류가 발생했습니다.");
  }
}

onUnmounted(() => {
  // 정리 작업
  if (recorder) {
    recorder.destroy();
    recorder = null;
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value);
  }
});
</script>

<template>
  <div>
    <video 
      ref="video" 
      autoplay 
      playsinline
      muted
      :style="{ maxWidth: '100%', width: '500px' }"
    ></video>
    
    <div class="controls">
      <button 
        @click="toggleRecording"
        :disabled="!video"
      >
        {{ recording ? '녹화 종료' : '녹화 시작' }}
      </button>
      
      <button 
        v-if="recordedVideo" 
        @click="uploadVideo"
        :disabled="recording"
      >
        업로드
      </button>
    </div>

    <video 
      v-if="recordedVideoUrl" 
      :src="recordedVideoUrl" 
      controls 
      playsinline
      :style="{ maxWidth: '100%', width: '500px' }"
    ></video>
  </div>
</template>

<style scoped>
.controls {
  margin: 15px 0;
}

button {
  margin: 0 5px;
  padding: 8px 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
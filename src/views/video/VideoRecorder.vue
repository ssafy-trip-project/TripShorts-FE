<script setup>
import { ref, onUnmounted, onMounted } from 'vue';
import RecordRTC from 'recordrtc';
import api from '@/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const video = ref(null);
const description = ref('');
const isLoading = ref(false);
let recorder = null;
let stream = null;
const recordedVideo = ref(null);
const recordedVideoUrl = ref(null);
const recording = ref(false);
const error = ref(null);
const showPreview = ref(false);

//
const thumbnailUrl = ref(null);
const thumbnailBlob = ref(null);
//

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
  return 'video/webm';
}

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      }, 
      audio: true 
    });

    if (video.value) {
      video.value.srcObject = stream;
      await video.value.play();
    }
  } catch (err) {
    error.value = "카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.";
    console.error(err);
  }
});

async function toggleRecording() {
  try {
    error.value = null;
    if (!recording.value) {
      await startRecording();
    } else {
      await stopRecording();
      showPreview.value = true;
    }
    recording.value = !recording.value;
  } catch (err) {
    error.value = '녹화 중 오류가 발생했습니다.';
    console.error(err);
  }
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
      recorder.stopRecording(async () => {
        const blob = recorder.getBlob();
        recordedVideo.value = blob;
        
        if (recordedVideoUrl.value) {
          URL.revokeObjectURL(recordedVideoUrl.value);
        }
        
        recordedVideoUrl.value = URL.createObjectURL(blob);

        // 썸네일 생성을 위한 임시 비디오 엘리먼트
        const tempVideo = document.createElement('video');
        tempVideo.src = recordedVideoUrl.value;
        
        // 비디오 메타데이터가 로드될 때까지 기다림
        await new Promise(resolve => {
          tempVideo.onloadedmetadata = () => {
            // 비디오를 특정 시간으로 이동
            tempVideo.currentTime = 1; // 1초 지점의 프레임을 사용
            tempVideo.onseeked = resolve;
          };
        });

        // 비디오 프레임이 준비되면 썸네일 생성
        await generateThumbnail(tempVideo);
        tempVideo.remove();
        
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

// 썸네일 생성 함수 수정
async function generateThumbnail(videoElement) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // 썸네일 크기를 비디오 크기에 맞춤
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // 비디오 프레임을 캔버스에 그림
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // 캔버스를 Blob으로 변환
    canvas.toBlob((blob) => {
      if (thumbnailUrl.value) {
        URL.revokeObjectURL(thumbnailUrl.value);
      }
      thumbnailBlob.value = blob;
      thumbnailUrl.value = URL.createObjectURL(blob);
      resolve();
    }, 'image/jpeg', 0.85); // JPEG 품질 85%
  });
}

async function uploadVideo() {
  if (!recordedVideo.value) {
    alert("녹화된 영상이 없습니다.");
    return;
  }
  console.log("여기까지는 들어와요")
  try {
    console.log("여기는 들어와요?")
    // 1. PreSigned URL 받기
    const { data: presignedData } = await api.get('/api/v1/shorts/presigned-url', {
      params: {
        filename: `video.${recordedVideo.value.type.includes('mp4') ? 'mp4' : 'webm'}`,
        contentType: recordedVideo.value.type
      }
    });
    console.log('PreSigned URL 요청:', presignedData);

    // 2. 썸네일용 PreSigned URL 받기
    const { data: thumbnailPresignedData } = await api.get('/api/v1/shorts/presigned-url', {
      params: {
        filename: 'thumbnail.jpg',
        contentType: 'image/jpeg'
      }
    });

    console.log(recordedVideo.value.type)
    // 2. S3에 업로드 
    await api.put(presignedData.presignedUrl, recordedVideo.value, {
      headers: {
        'Content-Type': recordedVideo.value.type
      }
    });

    // 썸네일 업로드
    await api.put(thumbnailPresignedData.presignedUrl, thumbnailBlob.value, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });

    // 3. Shorts 생성
    await api.post('/api/v1/shorts', {
      videoUrl: `https://d3sspkhgtlkiph.cloudfront.net/videos/shorts/${presignedData.filename}`,
      thumbnailUrl: `https://d3sspkhgtlkiph.cloudfront.net/images/shorts/${thumbnailPresignedData.filename}`,
      originalFileName: presignedData.filename,
      description: ''
    });

    

    alert('업로드 성공!');
  } catch (error) {
    console.error('업로드 실패:', error);
    alert('업로드 중 오류가 발생했습니다.');
  }
}


function cancelRecording() {
  router.push('/');  // 메인 페이지로 돌아가기
}

onUnmounted(() => {
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
  <div class="recorder-fullscreen">
    <!-- 에러 메시지 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 녹화 화면 -->
    <div class="video-container" v-if="!showPreview">
      <video 
        ref="video" 
        autoplay 
        playsinline
        muted
        class="fullscreen-video"
      ></video>

      <!-- 오버레이 컨트롤 -->
      <div class="overlay-controls">
        <v-btn
          @click="cancelRecording"
          icon
          class="close-btn"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-btn
          @click="toggleRecording"
          :color="recording ? 'error' : 'primary'"
          rounded
          class="record-btn"
        >
          <v-icon left>{{ recording ? 'mdi-stop' : 'mdi-record' }}</v-icon>
          {{ recording ? '녹화 중지' : '녹화 시작' }}
        </v-btn>
      </div>
    </div>

    <!-- 미리보기 화면 -->
    <div v-if="showPreview" class="preview-container">
      <video 
        v-if="recordedVideoUrl"
        :src="recordedVideoUrl" 
        controls 
        playsinline
        class="preview-video"
      ></video>

      <img 
          v-if="thumbnailUrl" 
          :src="thumbnailUrl" 
          class="preview-thumbnail" 
          alt="영상 썸네일"
        />

      <div class="preview-controls">
        <v-text-field
          v-model="description"
          label="영상 설명"
          outlined
          class="description-input"
        ></v-text-field>

        <div class="button-group">
          <v-btn
            @click="uploadVideo"
            :loading="isLoading"
            color="primary"
            class="mx-2"
          >
            업로드
          </v-btn>

          <v-btn
            @click="showPreview = false"
            text
            class="mx-2"
          >
            다시 녹화
          </v-btn>

          <v-btn
            @click="cancelRecording"
            text
            class="mx-2"
          >
            취소
          </v-btn>
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

.record-btn {
  padding: 0 30px !important;
  height: 50px !important;
}

.preview-container {
  width: 100%;
  height: 100%;
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
}

.preview-controls {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.description-input {
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
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
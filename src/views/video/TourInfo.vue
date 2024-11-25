<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVideoStore } from '@/stores/videoStore';
import api from '@/api';

const router = useRouter();
const videoStore = useVideoStore();
const isLoading = ref(false);

// 장소 선택을 위한 상태들
const areas = ref([]); // 지역 목록
const districts = ref([]); // 구역 목록
const tourLocations = ref([]); // 관광지 목록

const selectedArea = ref(''); // 선택된 지역
const selectedDistrict = ref(''); // 선택된 구역
const selectedLocation = ref(null); // 선택된 관광지

// 초기 데이터 로딩 상태
const isInitialLoading = ref(true);

// 지역 목록 로드
async function loadAreas() {
  try {
    const response = await api.get('/api/v1/tour/areas');
    areas.value = response.data;
    console.log(areas.value);
  } catch (error) {
    console.error('지역 목록 로드 실패:', error);
    alert('지역 목록을 불러오는데 실패했습니다.');
  } finally {
    isInitialLoading.value = false;
  }
}

// 구역 목록 로드
async function loadDistricts(areaName) {
  try {
    const response = await api.get('/api/v1/tour/districts', {
      params: { areaName },
    });
    districts.value = response.data;
    console.log(districts.value);
  } catch (error) {
    console.error('구역 목록 로드 실패:', error);
    alert('구역 목록을 불러오는데 실패했습니다.');
  }
}

// 관광지 목록 로드
async function loadTourLocations(areaName, districtName) {
  try {
    const response = await api.get('/api/v1/tour/attractions', {
      params: { areaName, districtName },
    });
    tourLocations.value = response.data;
  } catch (error) {
    console.error('관광지 목록 로드 실패:', error);
    alert('관광지 목록을 불러오는데 실패했습니다.');
  }
}

// 지역 선택 시
async function handleAreaChange() {
  if (selectedArea.value) {
    selectedDistrict.value = '';
    selectedLocation.value = null;
    districts.value = [];
    tourLocations.value = [];
    await loadDistricts(selectedArea.value);
  }
}

// 구역 선택 시
async function handleDistrictChange() {
  if (selectedArea.value && selectedDistrict.value) {
    selectedLocation.value = null;
    tourLocations.value = [];
    await loadTourLocations(selectedArea.value, selectedDistrict.value);
  }
}

onMounted(async () => {
  try {
    // 비디오 데이터 체크
    if (!videoStore.recordedVideo) {
      router.push('/upload');
      return;
    }

    // 지역 목록 로드
    await loadAreas();
  } catch (error) {
    console.error('초기 데이터 로드 실패:', error);
  }
});
// 업로드 처리
async function uploadVideo() {
  if (!selectedLocation.value) {
    alert('관광지를 선택해주세요.');
    return;
  }

  const videoData = videoStore.recordedVideo;
  const thumbnailBlob = videoStore.thumbnailBlob;

  if (!videoData || !thumbnailBlob) {
    alert('영상 데이터가 없습니다.');
    return;
  }

  try {
    isLoading.value = true;
    // PreSigned URLs 받기
    const [videoPresigned, thumbnailPresigned] = await Promise.all([
      api.get('/api/v1/shorts/presigned-url', {
        params: {
          filename: `video.${videoData.type.includes('mp4') ? 'mp4' : 'webm'}`,
          contentType: videoData.type,
        },
      }),
      api.get('/api/v1/shorts/presigned-url', {
        params: {
          filename: 'thumbnail.jpg',
          contentType: 'image/jpeg',
        },
      }),
    ]);

    // 파일 업로드
    await Promise.all([
      api.put(videoPresigned.data.presignedUrl, videoData.blob, {
        headers: { 'Content-Type': videoData.type },
      }),
      api.put(thumbnailPresigned.data.presignedUrl, thumbnailBlob, {
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    ]);

    const token = localStorage.getItem('accessToken');
    const getFilePathFromUrl = url => {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    };

    // Shorts 생성
    await api.post(
      '/api/v1/shorts',
      {
        videoUrl: `https://d3sspkhgtlkiph.cloudfront.net/videos/shorts/${getFilePathFromUrl(
          videoPresigned.data.presignedUrl,
        )}`,
        thumbnailUrl: `https://d3sspkhgtlkiph.cloudfront.net/videos/shorts/${getFilePathFromUrl(
          thumbnailPresigned.data.presignedUrl,
        )}`,
        tourId: selectedLocation.value.tourId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert('업로드 성공!');
    videoStore.clearAll();
    router.push('/');
  } catch (error) {
    console.error('업로드 실패:', error);
    alert('업로드 중 오류가 발생했습니다.');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="travel-info-container">
    <!-- 상단 네비게이션 -->
    <div class="top-nav">
      <v-btn icon class="nav-btn" @click="$router.back()">
        <v-icon size="28">mdi-arrow-left</v-icon>
      </v-btn>
      <span class="nav-title">공유하기</span>
      <v-btn
        class="post-btn"
        @click="uploadVideo"
        :loading="isLoading"
        :disabled="isInitialLoading || !selectedLocation"
        variant="text"
      >
        공유
      </v-btn>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="content-section">
      <div v-if="isInitialLoading" class="loading-overlay">
        <v-progress-circular indeterminate color="white"></v-progress-circular>
      </div>

      <div class="location-form">
        <div class="form-section">
          <div class="section-title">여행지 정보</div>

          <v-select
            v-model="selectedArea"
            :items="areas"
            label="지역 선택"
            required
            :loading="isInitialLoading"
            :disabled="isInitialLoading"
            @update:model-value="handleAreaChange"
            variant="outlined"
            density="comfortable"
            bg-color="transparent"
            class="select-field"
          ></v-select>

          <v-select
            v-model="selectedDistrict"
            :items="districts"
            label="구역 선택"
            required
            :disabled="!selectedArea || districts.length === 0"
            :loading="selectedArea && districts.length === 0"
            @update:model-value="handleDistrictChange"
            variant="outlined"
            density="comfortable"
            bg-color="transparent"
            class="select-field"
          ></v-select>

          <v-select
            v-model="selectedLocation"
            :items="tourLocations"
            label="관광지 선택"
            required
            :disabled="!selectedDistrict || tourLocations.length === 0"
            :loading="selectedDistrict && tourLocations.length === 0"
            item-title="title"
            item-value="tourId"
            return-object
            variant="outlined"
            density="comfortable"
            bg-color="transparent"
            class="select-field"
          ></v-select>
        </div>

        <div class="location-info" v-if="selectedLocation">
          <div class="info-header">선택된 장소</div>
          <div class="location-details">
            <v-icon color="primary" class="location-icon"
              >mdi-map-marker</v-icon
            >
            <div class="details-text">
              <div class="location-name">{{ selectedLocation.title }}</div>
              <div class="location-address">{{ selectedLocation.address }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.travel-info-container {
  width: 100%;
  min-height: 100vh;
  background: #fff3e6;
  display: flex;
  flex-direction: column;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffeedd;
  border-bottom: 1px solid rgba(255, 248, 240, 0.2);
}

.nav-btn {
  color: #8b4513 !important;
  min-width: 0;
  padding: 0 16px;
}

.nav-title {
  color: #8b4513;
  font-size: 16px;
  font-weight: 600;
}

.post-btn {
  color: #fff8f0 !important;
  font-weight: 600;
  background: #b15c1b !important;
  border-radius: 20px;
  padding: 0 16px !important;
}

.content-section {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 24px 16px;
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
  background: rgba(139, 69, 19, 0.8);
  z-index: 5;
}

.location-form {
  max-width: 600px;
  margin: 0 auto;
  color: #8b4513;
}

.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #8b4513;
}

.select-field {
  margin-bottom: 20px;
}

:deep(.v-field) {
  border-color: rgba(139, 69, 19, 0.2) !important;
  color: #8b4513 !important;
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(139, 69, 19, 0.15) !important;
}

:deep(.v-field__input) {
  color: #8b4513 !important;
  font-size: 15px !important;
  padding: 8px 16px;
  text-align: center;
}

:deep(.v-label) {
  color: rgba(139, 69, 19, 0.85) !important;
  font-size: 15px !important;
  padding-left: 16px;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.2 !important;
}

:deep(.v-field--variant-outlined .v-field__overlay) {
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 12px !important;
}

:deep(.v-menu .v-list) {
  background: rgba(255, 243, 230, 0.95) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(139, 69, 19, 0.15);
}

:deep(.v-list-item) {
  color: #8b4513 !important;
}

:deep(.v-list-item--active) {
  background: rgba(139, 69, 19, 0.1) !important;
}

:deep(.v-list-item:hover) {
  background: rgba(139, 69, 19, 0.15) !important;
}

:deep(.v-select__selection-text) {
  color: #8b4513 !important;
  text-align: center;
}

:deep(.v-field__placeholder) {
  width: 100%;
  text-align: center;
  color: rgba(139, 69, 19, 0.6) !important;
}

:deep(.v-label.v-field-label) {
  width: 100%;
  text-align: center;
  transform-origin: center;
}

.location-info {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
  border: 1px solid rgba(139, 69, 19, 0.2);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
}

.info-header {
  font-size: 15px;
  color: #8b4513;
  margin-bottom: 16px;
  font-weight: 600;
}

.location-details {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 12px;
}

.location-icon {
  margin-top: 4px;
  color: #b15c1b !important;
  opacity: 1;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #8b4513;
}

.location-address {
  font-size: 14px;
  color: rgba(139, 69, 19, 0.85);
  line-height: 1.4;
}

.details-text {
  flex: 1;
}

@media (max-width: 768px) {
  .content-section {
    padding: 20px 16px;
  }

  .location-info {
    padding: 16px;
    margin-top: 20px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  :deep(.v-field__input) {
    font-size: 14px !important;
  }

  :deep(.v-label) {
    font-size: 14px !important;
  }
}
</style>

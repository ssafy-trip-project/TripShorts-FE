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
    <v-card class="travel-info-card">
      <!-- 초기 로딩 상태 표시 -->
      <v-overlay v-if="isInitialLoading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
      <v-card-title>여행 정보 입력</v-card-title>

      <v-card-text>
        <v-form>
          <!-- 지역 선택 -->
          <v-select
            v-model="selectedArea"
            :items="areas"
            label="지역 선택*"
            required
            :loading="isInitialLoading"
            :disabled="isInitialLoading"
            @update:model-value="handleAreaChange"
          ></v-select>

          <!-- 구역 선택 -->
          <v-select
            v-model="selectedDistrict"
            :items="districts"
            label="구역 선택*"
            required
            :disabled="!selectedArea || districts.length === 0"
            :loading="selectedArea && districts.length === 0"
            @update:model-value="handleDistrictChange"
          ></v-select>

          <!-- 관광지 선택 -->
          <v-select
            v-model="selectedLocation"
            :items="tourLocations"
            label="관광지 선택*"
            required
            :disabled="!selectedDistrict || tourLocations.length === 0"
            :loading="selectedDistrict && tourLocations.length === 0"
            item-title="title"
            item-value="tourId"
            return-object
          ></v-select>

          <!-- 선택된 장소 정보 표시 -->
          <div v-if="selectedLocation" class="selected-location-info">
            <v-text-field
              v-model="selectedLocation.address"
              label="주소"
              readonly
              outlined
              dense
            ></v-text-field>
          </div>

          <!-- 추가 설명 입력 -->
          <!-- <v-textarea v-model="description" label="추가 설명" rows="3"></v-textarea> -->
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="$router.back()" text :disabled="isInitialLoading">
          이전
        </v-btn>
        <v-btn
          @click="uploadVideo"
          :loading="isLoading"
          :disabled="isInitialLoading"
          color="primary"
        >
          등록
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style scoped>
.travel-info-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #121212;
  padding: 20px;
}

.travel-info-card {
  width: 100%;
  max-width: 600px;
  margin: auto;
  padding: 20px;
}

.selected-location-info {
  margin-top: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>

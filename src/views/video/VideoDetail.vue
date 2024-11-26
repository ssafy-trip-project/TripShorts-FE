<template>
  <div class="video-detail">
    <div class="back-button" @click="goBack">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </div>
    <v-container class="py-6">
      <v-row>
        <v-col cols="12">
          <v-card class="mt-10 mb-4 rounded-lg" color="#FFF8F0" elevation="2">
            <v-card-title
              class="text-h5 font-weight-bold pt-4 pb-2"
              style="color: #8b4513"
            >
              {{ videoInfo.title }}
            </v-card-title>
            <v-divider class="mx-4" color="#FF9933"></v-divider>
            <v-card-text>
              <p class="text-body-1 mb-2" style="color: #8b4513">
                <v-icon color="#FF9933" class="mr-2">mdi-map-marker</v-icon>
                {{ videoInfo.address }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 카카오맵 -->
        <v-col cols="12">
          <v-card class="rounded-lg" color="#FFF8F0" elevation="2">
            <v-card-title class="text-h6 pt-4" style="color: #8b4513">
              <v-icon color="#FF9933" class="mr-2">mdi-map</v-icon>
              위치 정보
            </v-card-title>
            <v-divider class="mx-4 my-2" color="#FF9933"></v-divider>
            <v-card-text class="pa-4">
              <div
                id="map"
                style="
                  width: 100%;
                  height: 400px;
                  border-radius: 8px;
                  overflow: hidden;
                "
                class="map-container"
              ></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VideoService from '../../services/video';

const route = useRoute();
const router = useRouter();

const videoInfo = ref({
  videoId: null,
  tourId: null,
  title: '',
  address: '',
  lat: 0,
  lng: 0,
});

let map = null;

const goBack = () => {
  if (window.history.length > 2) {
    router.go(-1);
  } else {
    router.push('/');
  }
};
const initializeMap = () => {
  if (
    window.kakao &&
    window.kakao.maps &&
    videoInfo.value.lat &&
    videoInfo.value.lng
  ) {
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(
        videoInfo.value.lat,
        videoInfo.value.lng,
      ),
      level: 3,
    };

    map = new window.kakao.maps.Map(container, options);

    const markerPosition = new window.kakao.maps.LatLng(
      videoInfo.value.lat,
      videoInfo.value.lng,
    );
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map);

    const iwContent = `<div style="padding:8px;color:#8B4513;font-weight:500;">${videoInfo.value.title}</div>`;
    const infowindow = new window.kakao.maps.InfoWindow({
      content: iwContent,
    });
    infowindow.open(map, marker);
  }
};

const loadKakaoMap = () => {
  const script = document.createElement('script');
  script.src = VideoService.getKaKaoMapUrl();
  script.async = true;
  script.onload = () => {
    window.kakao.maps.load(() => {
      initializeMap();
    });
  };
  document.head.appendChild(script);
};

const fetchVideoInfo = async () => {
  try {
    const videoId = route.query.videoId;
    const data = await VideoService.getVideoInfo(videoId);
    videoInfo.value = data;
    loadKakaoMap();
  } catch (error) {
    console.error('Failed to fetch video info:', error);
  }
};

onMounted(() => {
  fetchVideoInfo();
});
</script>

<style scoped>
.back-button {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: fff8f0;
  color: brown;
  transition: background-color 0.2s;
}

.video-detail {
  background-color: #fff8f0;
  min-height: 100vh;
}

.map-container {
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
}

/* 카드 호버 효과 */
.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>

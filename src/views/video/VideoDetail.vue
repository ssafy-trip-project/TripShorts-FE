<template>
    <div class="video-detail">
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-card class="mb-4">
              <v-card-title class="text-h5 font-weight-bold">
                {{ videoInfo.title }}
              </v-card-title>
              <v-card-text>
                <p class="text-body-1 mb-2">주소: {{ videoInfo.address }}</p>
              </v-card-text>
            </v-card>
          </v-col>
  
          <!-- 카카오맵 -->
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h6">
                위치 정보
              </v-card-title>
              <v-card-text>
                <div id="map" style="width:100%;height:400px;"></div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import VideoService from '../services/VideoService'
  
  const route = useRoute()
  const videoInfo = ref({
    videoId: null,
    tourId: null,
    title: '',
    address: '',
    lat: 0,
    lng: 0
  })
  
  // 카카오맵 객체를 저장할 변수
  let map = null
  
  const initializeMap = () => {
    if (window.kakao && window.kakao.maps && videoInfo.value.lat && videoInfo.value.lng) {
      const container = document.getElementById('map')
      const options = {
        center: new window.kakao.maps.LatLng(videoInfo.value.lat, videoInfo.value.lng),
        level: 3
      }
  
      map = new window.kakao.maps.Map(container, options)
  
      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(videoInfo.value.lat, videoInfo.value.lng)
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      })
      marker.setMap(map)
  
      // 인포윈도우 생성
      const iwContent = `<div style="padding:5px;">${videoInfo.value.title}</div>`
      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent
      })
      infowindow.open(map, marker)
    }
  }
  
  const loadKakaoMap = () => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_API_KEY&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap()
      })
    }
    document.head.appendChild(script)
  }
  
  const fetchVideoInfo = async () => {
    try {
      const videoId = route.query.videoId
      const data = await VideoService.getVideoInfo(videoId)
      videoInfo.value = data
      loadKakaoMap()
    } catch (error) {
      console.error('Failed to fetch video info:', error)
    }
  }
  
  onMounted(() => {
    fetchVideoInfo()
  })
  </script>
  
  <style scoped>
  .video-detail {
    padding: 20px;
  }
  </style>
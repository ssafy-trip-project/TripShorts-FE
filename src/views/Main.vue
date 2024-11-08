<template>
    <v-container fluid class="explore-container">
      <!-- 탐색 메뉴 -->
      <v-row class="mb-4">
        <v-col cols="12" class="d-flex justify-center">
          <v-chip-group show-arrows>
            <v-chip v-for="category in categories" :key="category" outlined>{{ category }}</v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
  
      <!-- 숏츠 카드 그리드 -->
      <v-row>
        <v-col v-for="(video, index) in videos" :key="index" cols="12" sm="6" md="4" lg="3">
          <v-card class="video-card">
            <v-img :src="video.thumbnail" height="250px"></v-img>
            <v-card-title class="d-flex align-center justify-center text-center">
              <span>{{ video.title }}</span>
            </v-card-title>
            <v-card-subtitle class="d-flex align-center justify-center">
              <v-icon left color="pink">mdi-heart</v-icon>
              <span>{{ video.likes }}K</span>
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  export default {
    name: "Explore",
    data() {
      return {
        categories: [
          "모두", "노을이 멋진 곳", "여행지", "힐링스팟", "일상생활", 
          "문화", "음식", "경치", "동물", "쇼핑", "기타"
        ],
        videos: [
          {
            title: "멋진 여행지에서의 노을",
            thumbnail: "https://example.com/thumbnail1.jpg",
            likes: 10
          },
          {
            title: "바다를 바라보며 힐링하기",
            thumbnail: "https://example.com/thumbnail2.jpg",
            likes: 30.4
          },
          {
            title: "도시의 밤",
            thumbnail: "https://example.com/thumbnail3.jpg",
            likes: 78
          },
          // 더미 데이터 추가 가능
        ]
      };
    }
  };
  </script>
  
  <style scoped>
  .explore-container {
    padding-top: 20px;
  }
  
  .video-card {
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .video-card:hover {
    transform: scale(1.05);
  }
  </style>
  
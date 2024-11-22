<template>
  <div class="video-container">
    <!-- 비디오 플레이어 -->
    <video
      ref="videoRef"
      :src="video.videoUrl"
      :poster="video.thumbnailUrl"
      class="video-player"
      loop
      muted
      playsinline
      @click="togglePlay"
      @loadeddata="$emit('video-loaded', $event)"
    ></video>

    <!-- 우측 액션 버튼들 -->
    <div class="action-buttons">
      <div class="action-item">
        <button
          class="action-button"
          @click="$emit('like-click', video)"
          :class="{ liked: video.liked }"
        >
          <v-icon size="40">mdi-heart</v-icon>
          <span class="action-count">{{ formatNumber(video.likeCount) }}</span>
        </button>
      </div>

      <div class="action-item">
        <button class="action-button" @click="$emit('comment-click', video)">
          <v-icon size="40">mdi-comment</v-icon>
          <span class="action-count">{{
            formatNumber(video.commentCount)
          }}</span>
        </button>
      </div>

      <div class="action-item">
        <button class="action-button" @click="$emit('details-click', video)">
          <v-icon size="40">mdi-information</v-icon>
        </button>
      </div>
    </div>

    <!-- 하단 크리에이터 정보 -->
    <div class="creator-info">
      <div class="creator-profile">
        <img :src="video.creator.imageUrl" class="creator-avatar" />
        <span class="creator-nickname">{{ video.creator.nickname }}</span>
      </div>
      <div class="video-description" v-if="video.description">
        {{ video.description }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
});

defineEmits(['video-loaded', 'like-click', 'comment-click', 'details-click']);

const togglePlay = event => {
  const video = event.target;
  if (video.paused) {
    video.play().catch(error => {
      console.log('Video play failed:', error);
    });
  } else {
    video.pause();
  }
};

const formatNumber = num => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
</script>

<style scoped>
.video-container {
  height: 100vh;
  position: relative;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-buttons {
  position: absolute;
  right: 12px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.action-count {
  font-size: 12px;
  font-weight: 600;
}

.creator-info {
  position: absolute;
  left: 12px;
  bottom: 24px;
  color: white;
  z-index: 10;
  max-width: calc(100% - 80px);
}

.creator-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
}

.creator-nickname {
  font-weight: 600;
  font-size: 16px;
}

.video-description {
  font-size: 14px;
  margin-top: 4px;
  opacity: 0.9;
}

.liked {
  color: #fe2c55;
}
</style>

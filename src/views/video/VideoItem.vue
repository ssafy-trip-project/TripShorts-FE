<template>
  <div class="video-container">
    <video
      ref="videoRef"
      :src="video.videoUrl"
      :poster="video.thumbnailUrl"
      :id="video.id"
      class="video-player"
      loop
      muted
      playsinline
      @click="togglePlay"
      @loadeddata="$emit('video-loaded', $event)"
    ></video>

    <div class="gradient-overlay-top"></div>
    <div class="gradient-overlay-bottom"></div>

    <div class="action-buttons">
      <div class="action-button-wrapper">
        <button
          class="action-button"
          @click="$emit('like-click', video)"
          :class="{ 'is-liked': video.liked }"
        >
          <div class="action-icon-bg" :class="{ 'liked-bg': video.liked }">
            <v-icon :size="isMobile ? 24 : 28">{{
              video.liked ? 'mdi-heart' : 'mdi-heart-outline'
            }}</v-icon>
          </div>
          <span class="action-count">{{ formatNumber(video.likeCount) }}</span>
        </button>

        <button class="action-button" @click="$emit('comment-click', video)">
          <div class="action-icon-bg">
            <v-icon :size="isMobile ? 24 : 28">mdi-message-outline</v-icon>
          </div>
          <span class="action-count">{{
            formatNumber(video.commentCount)
          }}</span>
        </button>

        <button
          class="action-button info"
          @click="$emit('details-click', video)"
        >
          <div class="action-icon-bg">
            <v-icon :size="isMobile ? 24 : 28">mdi-information-outline</v-icon>
          </div>
        </button>
      </div>
    </div>

    <div class="creator-section">
      <div class="creator-header">
        <div class="creator-info">
          <img :src="video.creator.imageUrl" class="creator-avatar" />
          <div class="creator-details">
            <span class="creator-name">{{ video.creator.nickname }}</span>
          </div>
        </div>
      </div>
      <p class="video-description">{{ video.description }}</p>
      <!-- <div class="music-info">
        <v-icon :size="isMobile ? 14 : 16" class="music-icon"
          >mdi-music-note</v-icon
        >
        <span class="music-text">{{ video.musicInfo }}</span>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue';

const isMobile = ref(window.innerWidth <= 768);

onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});
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
  background: #121212;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gradient-overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent);
  pointer-events: none;
}

.gradient-overlay-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  pointer-events: none;
}

.action-buttons {
  position: absolute;
  right: 16px;
  bottom: 160px;
  z-index: 2;
}

.action-button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.action-icon-bg {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  color: white;
  transition: all 0.3s ease;
  min-width: 44px;
  min-height: 44px;
}

.action-count {
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.creator-section {
  position: absolute;
  left: 16px;
  bottom: 28px;
  right: 88px;
  z-index: 2;
  color: white;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.creator-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
}

.creator-name {
  font-weight: 600;
  font-size: 17px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.video-description {
  font-size: 15px;
  line-height: 1.4;
  margin: 0 0 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.music-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.music-text {
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .action-buttons {
    right: 8px;
    bottom: 120px;
    padding: 8px;
  }

  .action-button-wrapper {
    gap: 16px;
  }

  .action-icon-bg {
    width: 40px;
    height: 40px;
  }

  .action-count {
    font-size: 12px;
  }

  .creator-section {
    left: 12px;
    bottom: 24px;
    right: 64px;
  }

  .creator-avatar {
    width: 40px;
    height: 40px;
  }

  .creator-name {
    font-size: 15px;
  }

  .video-description {
    font-size: 13px;
    -webkit-line-clamp: 2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }

  .music-text {
    font-size: 12px;
  }
}
</style>

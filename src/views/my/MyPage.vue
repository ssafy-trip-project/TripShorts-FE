<template>
  <div class="page-container bg-orange-50">
    <!-- Profile Section -->
    <div class="profile-section">
        <div class="back-btn-wrapper">
          <Logo @click="router.back()"/>
        </div>
      </div>
      <div class="profile-content">
        <!-- Profile Image -->
        <div class="profile-image-container">
          <v-avatar size="120" class="profile-avatar">
            <v-img
              :src="profileData.imageUrl || '/default-avatar.png'"
              alt="프로필 이미지"
            >
              <template v-slot:placeholder>
                <v-icon size="60" color="#8B4513">mdi-account</v-icon>
              </template>
              <!-- my가 true일 때만 이미지 수정 오버레이 표시 -->
              <div
                v-if="profileData.my"
                class="image-overlay"
                @click="triggerImageUpload"
              >
                <span class="edit-text">사진 변경</span>
              </div>
            </v-img>
          </v-avatar>
          <input
            v-if="profileData.my"
            type="file"
            ref="fileInput"
            accept="image/*"
            style="display: none"
            @change="handleImageChange"
          />
        </div>

        <!-- Nickname & Email -->
        <div class="nickname-section">
          <div class="d-flex align-center justify-center">
            <span class="text-h6 text-brown" v-if="!isEditingNickname">
              {{ profileData.nickname }}
            </span>
            <v-text-field
              v-else
              v-model="editedNickname"
              variant="outlined"
              density="compact"
              class="mt-0"
              height="32"
              style="max-width: 200px"
              :rules="[v => !!v || '닉네임을 입력해주세요']"
              @keyup.enter="saveNickname"
              hide-details
            ></v-text-field>
            <v-btn
              v-if="profileData.my"
              icon
              size="x-small"
              class="ml-2"
              :color="isEditingNickname ? '#FF9933' : '#8B4513'"
              @click="
                isEditingNickname ? saveNickname() : startEditingNickname()
              "
              :loading="updatingNickname"
            >
              <v-icon size="14">{{
                isEditingNickname ? 'mdi-check' : 'mdi-pencil'
              }}</v-icon>
            </v-btn>
          </div>
          <div class="text-subtitle-2 text-brown mt-1">
            {{ profileData.email }}
          </div>
        </div>

        <!-- Post Count -->
        <div class="post-count-section">
          <div class="text-brown text-lg">{{ videos.length }}</div>
          <div class="text-brown-lighter text-sm">게시물</div>
        </div>
      </div>

    <div class="divider"></div>

    <!-- Videos Grid Section -->
    <div class="videos-section">
      <div class="posts-grid">
        <div
          v-for="video in videos"
          :key="video.videoId"
          class="post-image-container"
          @mouseenter="hoveredVideo = video.videoId"
          @mouseleave="hoveredVideo = null"
        >
          <div class="image-wrapper" @click="goToVideoFeed(video.videoId)">
            <img
              :src="video.thumbnailUrl"
              :alt="video.tourName"
              class="post-image"
              loading="lazy"
            />
            <!-- 재생 아이콘 오버레이 -->
            <div class="play-overlay">
              <v-icon color="white" size="32" class="play-icon">
                mdi-play-circle
              </v-icon>
            </div>
          </div>

          <!-- 삭제 버튼 (오른쪽 상단에 고정) -->
          <v-btn
            v-if="profileData.my && hoveredVideo === video.videoId"
            icon
            size="small"
            variant="text"
            class="delete-button"
            @click.stop="confirmDelete(video)"
          >
            <v-icon size="20" color="white">mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-4">
        <v-progress-circular
          indeterminate
          color="#8B4513"
        ></v-progress-circular>
      </div>

      <!-- Error State -->
      <div v-if="error" class="p-4 text-center text-error">
        {{ error }}
      </div>
    </div>

    <!-- Delete Account Button -->
    <div v-if="profileData.my" class="delete-account-section">
      <v-btn
        color="#8B4513"
        variant="outlined"
        class="delete-account-btn"
        @click="showDeleteDialog = true"
        :loading="deleting"
        prepend-icon="mdi-account-remove"
      >
        회원탈퇴
      </v-btn>
    </div>

    <!-- Dialogs -->
    <v-dialog v-model="showDeleteModal" max-width="400">
      <v-card>
        <v-card-text class="pa-4">이 동영상을 삭제하시겠습니까?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteModal = false"
          >
            취소
          </v-btn>
          <v-btn color="#FF9933" variant="text" @click="deleteVideo">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 pa-4 text-brown">
          정말 탈퇴하시겠습니까?
        </v-card-title>
        <v-card-text class="text-brown">
          탈퇴 시 모든 데이터가 삭제되며 <br />
          복구할 수 없습니다.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="#8B4513"
            variant="text"
            @click="showDeleteDialog = false"
          >
            취소
          </v-btn>
          <v-btn color="#FF9933" @click="deleteAccount" :loading="deleting">
            탈퇴하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { memberService } from '@/services/member';
import Logo from '@/components/Logo.vue';
import api from '@/api';

const router = useRouter();
const route = useRoute();

// Profile related refs
const profileData = ref({
  email: '',
  nickname: '',
  imageUrl: '',
});
const isEditingNickname = ref(false);
const editedNickname = ref('');
const fileInput = ref(null);
const showDeleteDialog = ref(false);
const deleting = ref(false);
const updatingNickname = ref(false);
const hoveredVideo = ref(null);

// Videos related refs
const videos = ref([]);
const isLoading = ref(false);
const error = ref(null);
const selectedVideo = ref(null);
const showDeleteModal = ref(false);

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

// Profile methods
const loadProfile = async id => {
  try {
    const data = await memberService.getMyProfile(id);
    profileData.value = data;
  } catch (error) {
    showError('프로필 정보를 불러오는데 실패했습니다.');
  }
};

const triggerImageUpload = () => {
  fileInput.value.click();
};

const handleImageChange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const newImageUrl = await memberService.updateProfileImage(file);
    profileData.value.imageUrl = newImageUrl;
    showSuccess('프로필 이미지가 업데이트되었습니다.');
  } catch (error) {
    showError(error.message);
  }
};

const startEditingNickname = () => {
  editedNickname.value = profileData.value.nickname;
  isEditingNickname.value = true;
};

const saveNickname = async () => {
  if (!editedNickname.value.trim()) return;

  updatingNickname.value = true;
  try {
    await memberService.updateNickname(editedNickname.value);
    profileData.value.nickname = editedNickname.value;
    isEditingNickname.value = false;
    showSuccess('닉네임이 변경되었습니다.');
  } catch (error) {
    showError('닉네임 변경에 실패했습니다.');
  } finally {
    updatingNickname.value = false;
  }
};

const deleteAccount = async () => {
  deleting.value = true;
  try {
    await memberService.leave();
    showSuccess('회원 탈퇴가 완료되었습니다.');
    router.push('/login');
  } catch (error) {
    showError('회원 탈퇴에 실패했습니다.');
  } finally {
    deleting.value = false;
    showDeleteDialog.value = false;
  }
};

// Videos methods
const fetchVideos = async id => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    error.value = null;

    const url = id
      ? `/api/v1/shorts/my-videos?id=${id}`
      : '/api/v1/shorts/my-videos';
    const response = await api.get(url);
    console.log('response mypage videos: ', response.data);
    videos.value = [...videos.value, ...response.data];

    console.log('mypage videos:', videos.value);
  } catch (e) {
    console.error('Failed to fetch videos:', e);
    error.value = '동영상을 불러오는데 실패했습니다. 다시 시도해주세요.';
  } finally {
    isLoading.value = false;
  }
};

const targetId = route.query.id;
const goToVideoFeed = videoId => {
  console.log('videoit = ', videoId);
  router.push({
    name: 'my-videos-feed',
    query: {
      initialVideoId: videoId,
      targetId: targetId,
    },
  });
};

const confirmDelete = video => {
  selectedVideo.value = video;
  showDeleteModal.value = true;
};

const deleteVideo = async () => {
  try {
    await api.delete(`/api/v1/shorts/my-videos/${selectedVideo.value.videoId}`);
    videos.value = videos.value.filter(
      v => v.videoId !== selectedVideo.value.videoId,
    );
    showDeleteModal.value = false;
    selectedVideo.value = null;
  } catch (error) {
    console.error('Failed to delete video:', error);
    showError('삭제에 실패했습니다. 다시 시도해주세요.');
  }
};

// Utility methods
const showSuccess = text => {
  snackbar.value = {
    show: true,
    text,
    color: 'success',
  };
};

const showError = text => {
  snackbar.value = {
    show: true,
    text,
    color: 'error',
  };
};

onMounted(() => {
  loadProfile(route.query.id);
  fetchVideos(route.query.id);
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  width: 100%;
}

.profile-section {
  padding: 2rem;
  position: relative;
}

.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.back-btn-wrapper {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.profile-logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-logo-container svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.profile-logo-container:hover svg {
  transform: scale(1.03);
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.profile-image-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 3px solid #ff9933;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(139, 69, 19, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  border-radius: 50%;
}

.profile-avatar:hover .image-overlay {
  opacity: 1;
}

.edit-text {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.nickname-section {
  text-align: center;
}

.text-brown {
  color: #8b4513;
}

.text-brown-lighter {
  color: #a67b5b;
}

.post-count-section {
  text-align: center;
  margin: 1rem 0;
}

.videos-section {
  padding: 2rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0;
  margin: 0 auto;
  max-width: 900px;
}

.post-image-container {
  position: relative;
  background-color: #fff8f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.1);
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.image-wrapper:hover {
  opacity: 0.8;
}

/* 호버 효과 */
.image-wrapper:hover .overlay {
  opacity: 1;
}

.image-wrapper:hover .play-icon {
  transform: scale(1.2);
}

.image-wrapper:hover .post-image {
  transform: scale(1.05);
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

/* 오버레이 스타일 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 재생 아이콘 오버레이 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-icon {
  transform: scale(1);
  transition: transform 0.3s ease;
}

.delete-button-wrapper {
  text-align: center;
  margin-top: 0.5rem;
  padding: 0.25rem;
}

.delete-button {
  position: absolute !important;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5) !important;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  backdrop-filter: blur(4px);
  z-index: 2;
  transition: all 0.3s ease !important;

  &:hover {
    background: rgba(255, 59, 59, 0.8) !important;
    transform: scale(1.1);
  }
}

.delete-button:hover {
  color: #ff9933 !important;
}

.delete-account-section {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
}

.delete-account-btn {
  text-transform: none;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.delete-account-btn:hover {
  background-color: rgba(139, 69, 19, 0.1);
}

/* Loading and Error States */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.error-state {
  text-align: center;
  color: #ff5252;
  padding: 1rem;
  margin: 1rem;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 500px;
    gap: 12px;
  }

  .videos-section {
    padding: 1rem;
  }

  .profile-section {
    padding: 1rem;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .back-btn-wrapper {
    top: 0.5rem;
    right: 0.5rem;
  }
}

/* 다이얼로그 스타일 */
:deep(.v-dialog) {
  background-color: #fff8f0;
  border-radius: 8px;
}

:deep(.v-card) {
  background-color: #fff8f0;
}

:deep(.v-card-title) {
  color: #8b4513;
}

:deep(.v-card-text) {
  color: #8b4513;
}

/* 스낵바 스타일 */
:deep(.v-snackbar__content) {
  font-size: 0.875rem;
}

/* 입력 필드 스타일 */
:deep(.v-text-field) {
  .v-input__control {
    .v-field {
      border-color: #8b4513;

      &:hover,
      &:focus {
        border-color: #ff9933;
      }
    }
  }
}

/* 버튼 공통 스타일 */
:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.5px;

  &.primary {
    background-color: #8b4513;
    color: white;

    &:hover {
      background-color: #ff9933;
    }
  }
}

.divider {
  width: 100%;
  max-width: 900px;
  height: 1px;
  background-color: #e5d3b3;
  margin: 0.5rem auto;
}
</style>

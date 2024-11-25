<template>
  <div class="page-container"> <!-- 최상위 컨테이너 추가 -->
    <v-container class="profile-container pa-0">
      <v-card class="mx-auto profile-card" max-width="600" color="#FFF8F0" elevation="0" width="100%">
        <!-- 뒤로가기 버튼 -->
       <div class="back-btn-wrapper">
         <v-btn
           icon="mdi-arrow-left"
           size="small"
           color="#8B4513"
           variant="text"
           @click="router.back()"
         ></v-btn>
       </div>
        <v-card-text class="text-center pt-6">
          <!-- 프로필 이미지 섹션 수정 -->
          <div class="profile-image-container mb-4">
            <v-avatar size="120" class="profile-avatar">
              <v-img :src="profileData.imageUrl || '/default-avatar.png'" alt="프로필 이미지">
                <template v-slot:placeholder>
                  <v-icon size="60" color="#8B4513">mdi-account</v-icon>
                </template>
                <!-- 오버레이와 편집 버튼 -->
                <div class="image-overlay" @click="triggerImageUpload">
                  <span class="edit-text">사진 변경</span>
                </div>
              </v-img>
            </v-avatar>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              style="display: none"
              @change="handleImageChange"
            />
          </div>
  
          <!-- 닉네임 섹션 -->
          <div class="nickname-section mb-6">
            <div class="d-flex align-center justify-center">
              <span class="text-h6" style="color: #8B4513" v-if="!isEditingNickname">
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
                icon
                size="x-small"
                class="ml-2"
                :color="isEditingNickname ? '#FF9933' : '#8B4513'"
                @click="isEditingNickname ? saveNickname() : startEditingNickname()"
                :loading="updatingNickname"
              >
                <v-icon size="16">{{ isEditingNickname ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
              </v-btn>
            </div>
            <div class="text-subtitle-2 mt-1" style="color: #8B4513">{{ profileData.email }}</div>
          </div>
  
          <!-- 회원탈퇴 버튼 -->
          <div class="delete-account-section">
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
        </v-card-text>
      </v-card>
  
      <!-- 회원탈퇴 확인 다이얼로그 -->
      <v-dialog v-model="showDeleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6 pa-4" style="color: #8B4513">
            정말 탈퇴하시겠습니까?
          </v-card-title>
          <v-card-text style="color: #8B4513">
            탈퇴 시 모든 데이터가 삭제되며 <br> 복구할 수 없습니다.
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
            <v-btn
              color="#FF9933"
              @click="deleteAccount"
              :loading="deleting"
            >
              탈퇴하기
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- 스낵바 -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3000"
      >
        {{ snackbar.text }}
      </v-snackbar>
    </v-container>
  </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { memberService } from '@/services/member'
  
  const router = useRouter()
  const profileData = ref({
    email: '',
    nickname: '',
    imageUrl: ''
  })
  
  const loading = ref(false)
  const uploadingImage = ref(false)
  const updatingNickname = ref(false)
  const deleting = ref(false)
  const isEditingNickname = ref(false)
  const editedNickname = ref('')
  const showDeleteDialog = ref(false)
  const fileInput = ref(null)
  
  const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
  })
  
  // 프로필 정보 로드
  const loadProfile = async () => {
    loading.value = true
    try {
      const data = await memberService.getMyProfile()
      profileData.value = data
    } catch (error) {
      showError('프로필 정보를 불러오는데 실패했습니다.')
    } finally {
      loading.value = false
    }
  }
  
  // 이미지 업로드 트리거
  const triggerImageUpload = () => {
    fileInput.value.click()
  }
  
  // 이미지 변경 처리
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    uploadingImage.value = true;
    try {
      const newImageUrl = await memberService.updateProfileImage(file);
      profileData.value.imageUrl = newImageUrl;
      showSuccess('프로필 이미지가 업데이트되었습니다.');
    } catch (error) {
      showError(error.message);
    } finally {
      uploadingImage.value = false;
    }
  }
  
  // 닉네임 수정 시작
  const startEditingNickname = () => {
    editedNickname.value = profileData.value.nickname
    isEditingNickname.value = true
  }
  
  // 닉네임 저장
  const saveNickname = async () => {
    if (!editedNickname.value.trim()) return
  
    updatingNickname.value = true
    try {
      await memberService.updateNickname(editedNickname.value)
      profileData.value.nickname = editedNickname.value
      isEditingNickname.value = false
      showSuccess('닉네임이 변경되었습니다.')
    } catch (error) {
      showError('닉네임 변경에 실패했습니다.')
    } finally {
      updatingNickname.value = false
    }
  }
  
  // 회원 탈퇴
  const deleteAccount = async () => {
    deleting.value = true
    try {
      await memberService.leave()
      showSuccess('회원 탈퇴가 완료되었습니다.')
      router.push('/login') // 로그인 페이지로 이동
    } catch (error) {
      showError('회원 탈퇴에 실패했습니다.')
    } finally {
      deleting.value = false
      showDeleteDialog.value = false
    }
  }
  
  // 스낵바 표시 함수들
  const showSuccess = (text) => {
    snackbar.value = {
      show: true,
      text,
      color: 'success'
    }
  }
  
  const showError = (text) => {
    snackbar.value = {
      show: true,
      text,
      color: 'error'
    }
  }
  
  onMounted(() => {
    loadProfile()
  })
  </script>
  
  <style scoped>
.page-container {
  background-color: #FFF8F0;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
}

.profile-container {
  width: 80%;
}

.profile-image-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 3px solid #FF9933;
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

.delete-account-btn {
  text-transform: none;
  letter-spacing: 0.5px;
}

.back-btn-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
}
</style>
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    location="right"
    temporary
    :width="isMobile ? '100%' : '420'"
    class="comments-drawer"
  >
    <div class="comments-container">
      <div class="comments-header">
        <h3 class="comments-title">댓글 {{ comments.length }}개</h3>
        <button class="close-button" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </button>
      </div>

      <div class="comments-list">
        <div v-if="comments.length === 0" class="empty-comments">
          <v-icon size="48" color="rgba(22, 24, 35, 0.2)"
            >mdi-message-text-outline</v-icon
          >
          <p>첫 댓글을 남겨보세요!</p>
        </div>

        <div v-else class="comment-items">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <img :src="comment.userProfileUrl" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.nickname }}</span>
                <span class="comment-time">{{
                  formatDate(comment.createdAt)
                }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <button class="action-btn">
                  <v-icon size="16">mdi-heart-outline</v-icon>
                  <span>{{ comment.likes || 0 }}</span>
                </button>
                <button class="action-btn">답글</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-input-wrapper">
        <v-text-field
          v-model="newComment"
          placeholder="댓글 추가..."
          variant="outlined"
          density="comfortable"
          hide-details
          class="comment-input"
          @keyup.enter="submitComment"
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              variant="text"
              :color="newComment.trim() ? '#fe2c55' : 'rgba(22, 24, 35, 0.34)'"
              size="small"
              @click="submitComment"
              :disabled="!newComment.trim()"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import AuthService from '@/services/auth';
import { onMounted, ref, watch } from 'vue';

const isMobile = ref(window.innerWidth <= 768);

onMounted(() => {
  console.log(AuthService.getUserInfo());
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  comments: {
    type: Array,
    default: () => [],
    validator: value => {
      return value.every(
        comment =>
          'id' in comment &&
          'content' in comment &&
          'nickname' in comment &&
          'userProfileUrl' in comment &&
          'createdAt' in comment,
      );
    },
  },
});

const emit = defineEmits(['update:modelValue', 'submit-comment']);
const isOpen = ref(props.modelValue);
// props.modelValue가 변경될 때마다 isOpen 업데이트
watch(
  () => props.modelValue,
  newValue => {
    isOpen.value = newValue;
  },
);

// isOpen이 변경될 때마다 emit 이벤트 발생
watch(isOpen, newValue => {
  emit('update:modelValue', newValue);
});

const newComment = ref('');

const submitComment = () => {
  if (!newComment.value.trim()) return;
  emit('submit-comment', newComment.value);
  newComment.value = '';
};

const formatDate = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

  return date.toLocaleDateString();
};
</script>

<style scoped>
.comments-drawer {
  border-left: none;
}

.comments-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid rgba(22, 24, 35, 0.12);
  position: relative;
}

.comments-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #121212;
}

.close-button {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  color: #121212;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(22, 24, 35, 0.06);
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
}

.empty-comments {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(22, 24, 35, 0.5);
}

.comment-items {
  padding: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  font-weight: 600;
  font-size: 14px;
  color: #121212;
}

.comment-time {
  font-size: 12px;
  color: rgba(22, 24, 35, 0.5);
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  color: #121212;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: rgba(22, 24, 35, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  color: #fe2c55;
}

.comment-input-wrapper {
  padding: 16px;
  background: white;
  border-top: 1px solid rgba(22, 24, 35, 0.12);
}

.comment-input {
  background: #f1f1f2;
  border-radius: 8px;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0 !important;
}

:deep(.v-text-field) {
  border-radius: 8px;
}

/* Custom scrollbar */
.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(22, 24, 35, 0.06);
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: rgba(22, 24, 35, 0.1);
}
</style>

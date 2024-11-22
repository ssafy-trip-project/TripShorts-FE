<template>
  <v-navigation-drawer
    :modelValue="isOpen"
    @update:model-value="$emit('update:modelValue', $event)"
    location="right"
    temporary
    width="400"
    class="comments-drawer pa-0"
  >
    <v-card class="comments-card h-100">
      <!-- 헤더 -->
      <v-card-title class="comments-header px-4 py-3">
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-1">댓글 {{ comments.length }}개</span>
          <v-btn icon size="small" @click="$emit('update:modelValue', false)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- 댓글 목록 영역 -->
      <v-card-text class="comments-container pa-0">
        <div v-if="comments.length > 0" class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item px-4 py-3"
          >
            <div class="d-flex gap-3">
              <v-avatar size="40" class="me-4">
                <v-img :src="comment.userProfileUrl" cover></v-img>
              </v-avatar>
              <div class="comment-content">
                <div class="comment-user">
                  <span class="font-weight-medium">{{ comment.nickname }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-info d-flex gap-2 mt-1">
                  <span class="text-caption text-grey">
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="d-flex align-center justify-center empty-comments">
          첫 댓글을 남겨보세요!
        </div>
      </v-card-text>

      <!-- 댓글 입력 영역 -->
      <div class="comment-input-container px-4 py-3">
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
              color="primary"
              size="small"
              @click="submitComment"
              :disabled="!newComment.trim()"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, watch } from 'vue';

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
  position: fixed !important;
  z-index: 1000;
}

.comments-card {
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.comments-header {
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 1;
}

.comments-container {
  flex: 1;
  overflow-y: auto;
  background-color: #fafafa;
}

.comment-item {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 20px;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-size: 14px;
  line-height: 1.4;
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  margin-top: 2px;
  word-break: break-word;
}

.comment-info {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.comment-input-container {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  bottom: 0;
}

.empty-comments {
  height: 200px;
  color: rgba(0, 0, 0, 0.5);
}

/* 스크롤바 스타일링 */
.comments-container::-webkit-scrollbar {
  width: 4px;
}

.comments-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.comments-container::-webkit-scrollbar-track {
  background-color: transparent;
}

@media (max-width: 600px) {
  .comments-drawer {
    width: 100% !important;
  }
}
</style>

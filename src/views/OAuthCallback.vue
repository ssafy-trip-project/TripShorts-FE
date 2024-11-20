<!-- src/views/OAuthCallback.vue -->
<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>

        <v-alert v-if="error" type="error" class="mt-4" variant="tonal">
          {{ errorMessage }}
          <v-btn
            class="mt-2"
            color="primary"
            @click="redirectToLogin"
            variant="text"
          >
            로그인 페이지로 돌아가기
          </v-btn>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AuthService from '../services/auth';

export default {
  name: 'OAuthCallback',

  data() {
    return {
      loading: true,
      error: false,
      errorMessage: '',
    };
  },

  async created() {
    try {
      // URL에서 인증 코드 추출
      const code = new URLSearchParams(window.location.search).get('code');
      const error = new URLSearchParams(window.location.search).get('error');

      // 에러 파라미터가 있는 경우 처리
      if (error) {
        throw new Error('카카오 로그인이 취소되었습니다.');
      }

      // 인증 코드가 없는 경우 처리
      if (!code) {
        throw new Error('인증 코드를 찾을 수 없습니다.');
      }

      // 인증 코드로 토큰 받아오기
      await AuthService.handleKakaoCallback(code);

      // 사용자 정보 가져오기
      await AuthService.getUserInfo();

      // 메인 페이지로 리다이렉트
      this.$router.push('/');
    } catch (error) {
      console.error('OAuth 콜백 처리 에러:', error);
      this.error = true;
      this.errorMessage =
        error.message || '로그인 처리 중 오류가 발생했습니다.';
    } finally {
      this.loading = false;
    }
  },

  methods: {
    redirectToLogin() {
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>

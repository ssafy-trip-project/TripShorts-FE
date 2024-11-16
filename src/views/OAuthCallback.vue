<template>
  <div class="d-flex justify-center align-center" style="height: 100vh">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
</template>

<script>
import AuthService from '../services/auth'

export default {
  name: 'OAuthCallback',
  async created() {
    try {
      const accessToken = AuthService.getAccessToken();
      const refreshToken = AuthService.getRefreshToken();
      
      if (accessToken && refreshToken) {
        await AuthService.getUserInfo();
        this.$router.push('/');
      } else {
        throw new Error('No tokens found');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.$router.push('/login');
    }
  }
}
</script>
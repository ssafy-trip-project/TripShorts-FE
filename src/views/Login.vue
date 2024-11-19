<template>
  <div class="page-container">
    <v-container class="text-center login-container">
      <div class="logo-container">
        <h2 class="logo-text">TRIPSHORTS</h2>
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" class="logo">
          <rect width="240" height="240" fill="#FFF8F0" rx="20" />
          <path d="M60 80 h120 a20 20 0 0 1 20 20 v80 a20 20 0 0 1 -20 20 h-120 a20 20 0 0 1 -20 -20 v-80 a20 20 0 0 1 20 -20" 
                fill="#8B4513"/>
          <circle cx="120" cy="140" r="40" fill="#FF9933"/>
          <circle cx="120" cy="140" r="30" fill="#8B4513"/>
          <circle cx="110" cy="130" r="8" fill="#FFF8F0" opacity="0.6"/>
        </svg>
      </div>

      <h1>지금 <span class="highlight">Trip 숏폼</span>과<br />함께 추억을 남겨보세요!</h1>

      <v-btn
        color="#FEE500"
        class="mb-3 kakao-btn"
        block
        @click="handleKakaoLogin"
        size="large"
      >
        <v-icon start>mdi-chat</v-icon>
        카카오로 시작하기
      </v-btn>

      <p class="agreement-text mt-3">
        로그인 시 <span class="highlight">서비스 이용약관</span>에 동의하게 됩니다.
      </p>
    </v-container>
  </div>
</template>

<script setup>
import AuthService from '../services/auth'

const handleKakaoLogin = () => {
  window.location.href = AuthService.getKakaoLoginUrl()
}
</script>

<style scoped>
.page-container {
  background-color: #FFF8F0;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  padding-top: 50px;
}

.login-container {
  max-width: 400px;
  margin: auto;
  padding: 2rem;
}

.logo-container {
  text-align: center;
}

.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 1rem;
}

.logo-text {
  color: #8B4513;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 1px;
}

h1 {
  color: #8B4513;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  line-height: 1.4;
  text-align: center;
}

.highlight {
  color: #FF9933;
  font-weight: bold;
}

.kakao-btn {
  height: 50px;
  font-weight: bold;
  color: black !important;
  border-radius: 8px;
}

.agreement-text {
  font-size: 0.8rem;
  color: #8B4513;
  opacity: 0.8;
  text-align: center;
}

@media (max-width: 600px) {
  .logo {
    width: 100px;
    height: 100px;
  }

  .logo-text {
    font-size: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
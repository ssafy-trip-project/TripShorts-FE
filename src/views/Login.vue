<template>
    <v-container class="text-center" style="max-width: 400px; margin: auto; padding-top: 50px;">
      <h1>지금 <span class="highlight">Trip 숏폼</span>과<br />함께 추억을 남겨보세요!</h1>
  
      <v-btn
        color="white"
        class="mb-3 google-btn"
        outlined
        block
      >
        <v-icon left color="red">mdi-google</v-icon> 구글로 시작하기
      </v-btn>
  
      <v-btn
        color="#fee500"
        class="mb-3 kakao-btn"
        block
      >
        <v-icon left color="black">mdi-chat</v-icon> 카카오로 시작하기
      </v-btn>
  
      <v-btn
        color="#03c75a"
        class="naver-btn"
        block
      >
        <v-icon left color="white">mdi-naver</v-icon> 네이버로 시작하기
      </v-btn>
  
      <p class="agreement-text mt-3">
        로그인 시 <span class="highlight">서비스 이용약관</span>에 동의하게 됩니다.
      </p>
    </v-container>
  </template>
  
  <script>
  export default {
    name: 'Login',
  }
  </script>
  
  <style scoped>
  .highlight {
    color: #3498db; /* 원하는 색상으로 설정 */
    font-weight: bold;
  }
  
  .google-btn {
    border: 1px solid #dbdbdb;
  }
  
  .kakao-btn {
    color: black;
  }
  
  .naver-btn {
    color: white;
  }
  
  .agreement-text {
    font-size: 0.8rem;
    color: gray;
  }
  </style>
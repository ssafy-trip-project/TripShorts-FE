// src/services/auth.js
const API_URL = import.meta.env.VITE_API_URL;
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = `${window.location.origin}/oauth/callback/kakao`;

class AuthService {
  // 토큰 관련 메서드
  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static setTokens(accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }

  static removeTokens() {
    localStorage.removeItem('accessToken');
  }

  // 카카오 로그인 관련 메서드
  static getKakaoLoginUrl() {
    const scope = 'profile_nickname,profile_image,account_email';
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&scope=${scope}`;
    return kakaoAuthUrl;
  }

  static async handleKakaoCallback(code) {
    try {
      const response = await fetch(`${API_URL}/api/auth/kakao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Kakao');
      }

      const data = await response.json();
      if (data.accessToken) {
        this.setTokens(data.accessToken);
      }

      return data;
    } catch (error) {
      console.error('Kakao authentication error:', error);
      throw error;
    }
  }

  // 사용자 정보 조회
  static async getUserInfo() {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token found');
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/member`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  // 로그아웃
  static logout() {
    this.removeTokens();
    window.location.href = '/login';
  }
}

export default AuthService;

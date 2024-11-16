// src/services/auth.js
const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
    // 쿠키 관련 유틸리티 함수
    static getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
  
    static setCookie(name, value, days = 7) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      
      // CloudFront 도메인 사용시
      if (window.location.hostname.includes('cloudfront.net')) {
        document.cookie = `${name}=${value}; ${expires}; path=/; domain=.cloudfront.net; secure; samesite=strict`;
      } else {
        document.cookie = `${name}=${value}; ${expires}; path=/`;
      }
    }
  
    static removeCookie(name) {
      if (window.location.hostname.includes('cloudfront.net')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.cloudfront.net;`;
      } else {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  
    // 토큰 관리
    static getAccessToken() {
      return this.getCookie('accessToken');
    }
  
    static getRefreshToken() {
      return this.getCookie('refreshToken');
    }
  
    static setTokens(accessToken, refreshToken) {
      this.setCookie('accessToken', accessToken);
      this.setCookie('refreshToken', refreshToken);
    }
  
    static removeTokens() {
      this.removeCookie('accessToken');
      this.removeCookie('refreshToken');
    }
  
    // API 요청
    static async getUserInfo() {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }
  
      try {
        const response = await fetch(`${API_URL}/api/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
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
  
    static async logout() {
      const accessToken = this.getAccessToken();
      if (accessToken) {
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
        } catch (error) {
          console.error('Logout request failed:', error);
        }
      }

      this.removeTokens();
    }

    // OAuth 관련
    static getKakaoLoginUrl() {
      console.log(`요청 url ${API_URL}/oauth2/authorization/kakao`);
      return `${API_URL}/oauth2/authorization/kakao`;
    }
  }
  
  export default AuthService;
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') // 토큰 저장소에서 가져오기
  if (token && !config.url.includes('amazonaws.com')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api;

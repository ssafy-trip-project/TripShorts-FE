import api from '../api'

const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

class VideoService {
  static async getVideos(sortby) {
    const response = await api.get('/api/v1/shorts', {
      params: {
        sortby
      }
    })
    return response.data
  }

  static async getVideoInfo(videoId) {
    const response = await api.get(`/api/v1/shorts/search?videoId=${videoId}`)
    return response.data
  }

  static getKaKaoMapUrl(){
    return `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`
  }
}

export default VideoService
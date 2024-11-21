import api from '../api'

class VideoService {
  static async getVideos() {
      const response = await api.get('/api/v1/shorts')
    return response.data
  }

  static async getVideoInfo(videoId) {
    const response = await api.get(`/api/v1/shorts/search?videoId=${videoId}`)
    return response.data
  }
}

export default VideoService
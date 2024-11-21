import api from '../api'

class VideoService {
  static async getVideos() {
      const response = await api.get('/api/v1/shorts')
    return response.data
  }
}

export default VideoService
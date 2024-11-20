import api from '../api'

class VideoService {
  static async getVideos() {
      const response = await api.get('/api/v1/shorts')
      console.log(response)
    return response.data
  }
}

export default VideoService
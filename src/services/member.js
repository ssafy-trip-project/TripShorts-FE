// services/memberService.js

import api from '../api'

const token = localStorage.getItem('accessToken');

export const memberService = {
  // 프로필 정보 조회
  async getMyProfile() {
    const response = await api.get(`/my/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
    )
    return response.data
  },

  // 프로필 이미지 업로드를 위한 presigned URL 획득
    async getPresignedUrl(filename, contentType) {
      console.log(filename, contentType)
    const response = await axios.get(`my/profile/presigned-url`, {
      params: { filename, contentType }
    })
    return response.data
  },

  // 이미지 URL 업데이트
  async updateImageUrl(imageUrl) {
    await axios.put(`${BASE_URL}/profile/image`, { imageUrl })
  },

  // 닉네임 수정
  async updateNickname(nickname) {
    await axios.put(`my/profile`, null, {
      params: { nickname }
    })
  },

  // 회원 탈퇴
  async leave() {
    await axios.delete(`${BASE_URL}/leave`)
  }
}
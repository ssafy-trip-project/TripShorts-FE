// services/memberService.js

import api from '../api'

export const memberService = {
  // 프로필 정보 조회
  async getMyProfile() {
    const response = await api.get(`/my/profile`)
    return response.data
  },

  // 프로필 이미지 업로드를 위한 presigned URL 획득
  async getPresignedUrl(file) {
      
    if (!file) { 
      throw new Error('파일이 선택되지 않았습니다.')
    }

    const response = await api.get(`my/profile/presigned-url`, {
      params: {
        filename: file.name,
        contentType: file.type
      }
    })

    return response.data
  },

  // S3에 이미지 업로드
  async uploadImageToS3(presignedUrl, file) {
    try {
      console.log('File type:', file.type);
      console.log('Presigned URL:', presignedUrl);
  
      await api.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type, // 파일의 MIME 타입
        },
      });
  
      // URL에서 query string 제거
      return presignedUrl.split('?')[0];
    } catch (error) {
      console.error('Error during S3 upload:', error.response || error.message);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  },

  // 프로필 이미지 URL 업데이트
  async updateImageUrl(imageUrl) {
    await api.put(`/my/profile/image`, { imageUrl });
    return imageUrl;
  },

  // 이미지 업로드 전체 프로세스 처리
  async updateProfileImage(file) {
    // 1. Presigned URL 획득
    const { presignedUrl } = await this.getPresignedUrl(file);
    
    // 2. S3에 이미지 업로드
    const imageUrl = await this.uploadImageToS3(presignedUrl, file);
    
    // 3. 프로필 이미지 URL 업데이트
    return await this.updateImageUrl(imageUrl);
  },

  // 닉네임 수정
  async updateNickname(nickname) {
    await api.put(`my/profile`, null, {
        params: {
            nickname
        }
    })
  },

  // 회원 탈퇴
  async leave() {
    await api.delete(`my/leave`)
  }
}
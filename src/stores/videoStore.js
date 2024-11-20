import { defineStore } from 'pinia';

export const useVideoStore = defineStore('video', {
  state: () => ({
    recordedVideo: null,
    thumbnailBlob: null,
  }),
  actions: {
    setRecordedVideo(videoData) {
      this.recordedVideo = videoData;
    },
    setThumbnail(blob) {
      this.thumbnailBlob = blob;
    },
    clearAll() {
      this.recordedVideo = null;
      this.thumbnailBlob = null;
    },
  },
});

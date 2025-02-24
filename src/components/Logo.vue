<template>
    <div class="logo-container">
      <svg
        width="280"
        height="50"
        viewBox="0 0 280 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 카메라 그룹 - 약간 작게 조정 -->
        <g transform="translate(10, 2) scale(0.9)">
          <!-- 카메라 상단 플래시 부분 -->
          <rect
            x="8"
            y="14"
            width="14"
            height="4"
            rx="2"
            fill="#8B4513"
          />
          <!-- 카메라 본체 -->
          <rect
            x="4"
            y="18"
            width="36"
            height="28"
            rx="4"
            fill="#8B4513"
          />
          <!-- 카메라 그립 -->
          <rect
            x="2"
            y="24"
            width="6"
            height="16"
            rx="2"
            fill="#8B4513"
          />
          <!-- 렌즈 외부 링 -->
          <circle cx="22" cy="32" r="12" fill="#FF9933" />
          <!-- 렌즈 내부 -->
          <circle cx="22" cy="32" r="8" fill="#8B4513" />
          <circle cx="22" cy="32" r="6" fill="#FF9933" />
          <!-- 카메라 상단 다이얼 -->
          <circle cx="34" cy="24" r="3" fill="#FF9933" />
        </g>
        <!-- 영문 텍스트 - 중앙 정렬 -->
        <text
          x="60"
          y="40"
          font-family="Arial"
          font-size="32"
          font-weight="bold"
          fill="#8B4513"
        >
          TripShorts
        </text>
      </svg>
    </div>
  </template>
  
  <script>
  export default {
    name: "Logo",
  };
  </script>
  
  <style scoped>
  .logo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  </style>
  
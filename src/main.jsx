import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// 배포로 청크 해시가 바뀌어 옛 캐시가 없는 모듈을 부를 때 자동 복구(1회 새로고침)
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('chunkReloaded')) {
    sessionStorage.setItem('chunkReloaded', '1');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

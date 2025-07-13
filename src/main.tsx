import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ✅ 라우터 관련 함수들을 추가로 import 합니다.
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// ✅ 여기서 라우터를 생성합니다.
const router = createBrowserRouter([
  {
    path: "*", // 모든 경로를 App 컴포넌트가 처리하도록 설정
    Component: App,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ✅ <App /> 대신 <RouterProvider />를 렌더링합니다. */}
    <RouterProvider router={router} />
  </StrictMode>,
);
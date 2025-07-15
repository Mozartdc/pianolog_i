import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ✅ 라우터 관련 함수들을 추가로 import 합니다.
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://85ddbe6c1863cbfe01b641e3ff18b365@o4509672090370048.ingest.us.sentry.io/4509672093843456",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

// ✅ 여기서 라우터를 생성합니다.
const router = createBrowserRouter([
  {
    path: "*", // 모든 경로를 App 컴포넌트가 처리하도록 설정
    Component: App,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>문제가 발생했습니다.</p>}>
      <RouterProvider router={router} />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
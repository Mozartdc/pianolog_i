import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ✅ 라우터 관련 함수들을 추가로 import 합니다.
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import * as Sentry from "@sentry/react";

// ✅ 환경변수에서 Sentry DSN 읽기
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

// ✅ DSN이 있을 때만 Sentry 초기화
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    // ✅ 개발 환경에서는 샘플링 비율을 높이고, 프로덕션에서는 낮춤
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
  });
}

// ✅ 여기서 라우터를 생성합니다.
const router = createBrowserRouter([
  {
    path: "*", // 모든 경로를 App 컴포넌트가 처리하도록 설정
    Component: App,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {sentryDsn ? (
      <Sentry.ErrorBoundary fallback={<p>문제가 발생했습니다.</p>}>
        <RouterProvider router={router} />
      </Sentry.ErrorBoundary>
    ) : (
      <RouterProvider router={router} />
    )}
  </StrictMode>
);
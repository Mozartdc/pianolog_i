import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ✅ Import additional router-related functions
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import * as Sentry from "@sentry/react";

// ✅ Read Sentry DSN from environment variables
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

// ✅ Initialize Sentry only when DSN exists
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    // ✅ Higher sampling rate in dev, lower in production
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
  });
}

// ✅ Create the router here
const router = createBrowserRouter([
  {
    path: "*", // Set up so App component handles all routes
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
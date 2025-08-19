/// <reference types="vite/client" />

// 이미지 파일
declare module '*.png' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.gif' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }

// CSS 모듈
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

// 환경변수
interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_BACKUP_FILE_NAME?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// File System Access API
// -> lib.dom에 이미 정의됨. 충돌 방지 위해 직접 선언은 삭제 권장.
// 꼭 확장이 필요하면 아래처럼 '추가 메서드'만 선언하세요.
/*
declare global {
  interface FileSystemFileHandle {
    // 여기에 프로젝트에서 실제로 추가 확장할 메서드만 선언
  }
}
*/

// gapi 사용 계획이 없으면 제거 권장.
// 사용할 경우, 타입 패키지 설치를 권장(@types/gapi 등).
/*
declare namespace gapi {
  namespace client {
    interface RequestOptions {
      path: string;
      method: string;
      params?: unknown;
    }
    interface RequestResponse {
      result: unknown;
      body: string;
    }
    function request(options: RequestOptions): Promise<RequestResponse>;
  }
}
*/

export {};

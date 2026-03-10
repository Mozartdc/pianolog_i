/// <reference types="vite/client" />

// Image files
declare module '*.png' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.gif' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }

// CSS modules
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

// Environment variables
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
// -> Already included in lib.dom, so no need to redeclare. Could cause conflicts.
// If I really need to extend it, I should only add the methods I actually use.
/*
declare global {
  interface FileSystemFileHandle {
    // Only declare the methods I actually plan to use
  }
}
*/

// If I don’t plan to use gapi, I should just remove it.
// If I do, it’s better to install the type package (@types/gapi, etc.).
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
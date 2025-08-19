// SVGR: 컴포넌트 임포트
declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react';
  const Component: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default Component;
}
// URL 임포트
declare module '*.svg?url' {
  const src: string;
  export default src;
}
// 기본 svg도 URL로 처리하고 싶다면 필요 시 추가
declare module '*.svg' {
  const src: string;
  export default src;
}

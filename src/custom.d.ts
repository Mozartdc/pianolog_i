// SVGR: Component import
declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react';
  const Component: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default Component;
}
// URL import
declare module '*.svg?url' {
  const src: string;
  export default src;
}
// /* If I want the default SVG to act like a URL, I’ll add this later */
declare module '*.svg' {
  const src: string;
  export default src;
}
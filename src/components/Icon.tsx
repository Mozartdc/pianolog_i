import React from 'react';

// ✅ SVG 파일들을 직접 import (Vite의 SVGR 플러그인 사용)
import ExportIcon from '../assets/icons/export.svg?react';
import FlameIcon from '../assets/icons/flame.svg?react';
import KeyboardIcon from '../assets/icons/keyboard.svg?react';
import PlayIcon from '../assets/icons/play.svg?react';
import StaffIcon from '../assets/icons/staff.svg?react';
import TrophyIcon from '../assets/icons/trophy.svg?react';

interface IconProps {
  name: 'export' | 'flame' | 'keyboard' | 'play' | 'staff' | 'trophy';
  size?: number;
  color?: string;
  className?: string;
  responsive?: boolean; // ✅ 반응형 옵션 추가
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = 'var(--text-primary)', // ✅ CSS 변수 기본값
  className,
  responsive = false 
}) => {
  // ✅ import된 컴포넌트를 사용
  const iconComponents = {
    export: ExportIcon,
    flame: FlameIcon,
    keyboard: KeyboardIcon,
    play: PlayIcon,
    staff: StaffIcon,
    trophy: TrophyIcon
  };

  // ✅ 반응형 크기 계산
  const getResponsiveSize = () => {
    if (!responsive) return `${size}px`;
    
    // 화면 크기에 따른 동적 크기 (CSS clamp 활용)
    const minSize = Math.max(size * 0.8, 16); // 최소 16px
    const maxSize = size * 1.2; // 최대 120%
    return `clamp(${minSize}px, ${size / 375 * 100}vw, ${maxSize}px)`;
  };

  const containerSize = getResponsiveSize();
  const IconComponent = iconComponents[name];

  return (
    <div 
      className={className}
      style={{
        width: containerSize,
        height: containerSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'var(--transition-fast)', // ✅ 부드러운 애니메이션
        fontFamily: 'var(--FONT_FAMILY)' // ✅ 폰트 통일
      }}
    >
      <IconComponent
        width="100%"
        height="100%"
        style={{
          color: color,
          display: 'block',
          transition: 'var(--transition-fast)' // ✅ 색상 변경 애니메이션
        }}
        // ✅ 접근성 개선
        role="img"
        aria-label={`${name} 아이콘`}
      />
    </div>
  );
};

// ✅ 미리 정의된 색상 변형들
export const IconVariants = {
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  turquoise: 'var(--TURQUOISE)',
  peri: 'var(--VERY_PERI)',
  magenta: 'var(--VIVA_MAGENTA)',
  mimosa: 'var(--MIMOSA)',
  white: 'var(--WHITE)',
  black: 'var(--BLACK)'
};

// ✅ 미리 정의된 크기 변형들
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48
};

// ✅ 편의 컴포넌트들
export const ResponsiveIcon: React.FC<Omit<IconProps, 'responsive'>> = (props) => (
  <Icon {...props} responsive={true} />
);

export const PrimaryIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color={IconVariants.primary} />
);

export const SecondaryIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color={IconVariants.secondary} />
);

export const TurquoiseIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color={IconVariants.turquoise} />
);

export default Icon;
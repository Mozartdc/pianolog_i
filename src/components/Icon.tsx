import React from 'react';

interface IconProps {
  name: 'export' | 'flame' | 'keyboard' | 'play' | 'staff' | 'trophy';
  size?: number;
  color?: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'currentColor', className }) => {
  const iconPaths = {
    export: '/src/assets/icons/export.svg',
    flame: '/src/assets/icons/flame.svg', 
    keyboard: '/src/assets/icons/keyboard.svg',
    play: '/src/assets/icons/play.svg',
    staff: '/src/assets/icons/staff.svg',
    trophy: '/src/assets/icons/trophy.svg'
  };

  return (
    <div 
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          color: color,
          display: 'block'
        }}
      >
        <use href={`${iconPaths[name]}#icon`} />
      </svg>
    </div>
  );
};

export default Icon;

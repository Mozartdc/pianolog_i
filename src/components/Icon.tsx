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
    <img 
      src={iconPaths[name]}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ color }}
    />
  );
};

export default Icon;

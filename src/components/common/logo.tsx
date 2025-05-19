// src/components/common/logo.tsx
import type React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 120, height = 40 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ENGEAR Logo"
    >
      <rect width="120" height="40" rx="8" className="fill-primary" />
      <text
        x="50%"
        y="50%"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="18"
        fontWeight="bold"
        className="fill-primary-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ENGEAR
      </text>
    </svg>
  );
};

export default Logo;

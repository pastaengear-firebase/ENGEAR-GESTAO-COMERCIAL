// src/components/common/logo.tsx
import type React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  const primaryColor = "#7C253A"; // Maroon from image
  const accentColor = "#F2C04E"; // Golden Yellow from image
  const whiteOutlineColor = "#FFFFFF"; // For outlines as seen in the image
  const taglineColor = "#6A2436"; // Slightly darker/muted maroon for tagline, or primaryColor
  const gradientEndColor = "#B55F78"; // Lighter maroon for the gradient tip on "ar" background

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 340 90" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ENGEAR Logo"
    >
      {/* Left graphic part */}
      {/* Outer Maroon Shape (left pointing chevron) with white outline */}
      <path 
        d="M102 11 L22 45 L102 79 L88 79 L12 45 L88 11 Z" // Sharp chevron
        fill={primaryColor} 
        stroke={whiteOutlineColor} 
        strokeWidth="2.5" // Make outline distinct
      />
      
      {/* Inner gradient arrow for "ar" background */}
      <defs>
        <linearGradient id="arBgGradient" x1="0.1" y1="0.5" x2="0.9" y2="0.5"> {/* Gradient focused on the tip */}
          <stop offset="0%" stopColor={primaryColor}/>
          <stop offset="60%" stopColor={primaryColor}/> 
          <stop offset="100%" stopColor={gradientEndColor}/> 
        </linearGradient>
      </defs>
      <path 
        d="M25 30 L70 30 L88 45 L70 60 L25 60 L43 45 Z" // Right-pointing arrow for "ar" bg
        fill="url(#arBgGradient)"
      />

      {/* "ar" text - Golden Yellow with White Outline */}
      <text 
        x="56.5" // Finely tuned position for "ar"
        y="45" 
        fontFamily="'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif" // Prioritize rounded fonts
        fontSize="24" 
        fontWeight="bold" 
        fill={accentColor} 
        stroke={whiteOutlineColor} 
        strokeWidth="1.2" // Outline for "ar"
        paintOrder="stroke" // Ensures stroke is behind fill if not transparent, or outside if fill is opaque
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        ar
      </text>

      {/* ENGEAR Text - Maroon, approximated font style */}
      {/* Using a readily available bold font as an approximation of the custom ENGEAR font style */}
      <text 
        x="118" // Positioned to the right of the graphic
        y="41"  // Adjusted for vertical alignment
        fontFamily="'Arial Black', Gadget, sans-serif" // A common, very bold sans-serif font
        fontSize="40" 
        fill={primaryColor}
        letterSpacing="0.5" // Slight spacing
        dominantBaseline="middle"
      >
        ENGEAR
      </text>

      {/* Tagline Text - Darker Maroon */}
      <text 
        x="118" 
        y="67" // Below ENGEAR
        fontFamily="Arial, sans-serif" // Standard, readable sans-serif for tagline
        fontSize="10.5" 
        fill={taglineColor}
        dominantBaseline="middle"
      >
        Engenharia de Aquecimento e Refrigeração Ltda.
      </text>
    </svg>
  );
};

export default Logo;

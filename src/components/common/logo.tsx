// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

// CRITICAL INSTRUCTIONS FOR THE LOGO TO APPEAR:
// 1. 'public' FOLDER REQUIRED AT PROJECT ROOT:
//    For Next.js to find static images like your logo,
//    there MUST be a folder named 'public' at the ROOT of your project
//    (same level as 'src', 'package.json', etc.).
//    YOU HAVE CONFIRMED THIS FOLDER EXISTS.
//
// 2. LOGO IMAGE FILE LOCATION:
//    Your logo image file (e.g., NEWLOGO.JPG)
//    MUST be INSIDE this 'public' folder.
//    Expected path: public/NEWLOGO.JPG
//
// 3. IMAGE PATH BELOW:
//    The `logoImagePath` variable is set to "/NEWLOGO.JPG".
//    This means Next.js will look for NEWLOGO.JPG directly
//    inside the 'public' folder.
//
//    Ensure the file extension (.JPG, .jpg, .png, etc.) is correct
//    and the filename matches EXACTLY (case-sensitive).
//    Based on your previous input, I'm using "NEWLOGO.JPG".

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  const logoImagePath = "/NEWLOGO.JPG"; // <--- CONFIRM THIS MATCHES YOUR FILE in public/

  return (
    <div 
      className={cn("bg-white", className)} // Added cn for conditional class merging
      style={{ 
        display: 'inline-block', 
        padding: '5px', 
        borderRadius: '4px' 
      }}
    >
      <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
        <Image
          src={logoImagePath}
          alt="ENGEAR Logo"
          fill // Use fill for responsive sizing within the parent div
          style={{ objectFit: "contain" }} // Ensures the image scales correctly without cropping
          priority // Load the logo image with priority
          unoptimized={true} // Crucial to avoid Next.js image optimization issues if the image is problematic
        />
      </div>
    </div>
  );
};

// Helper function for class names, if not already globally available via utils
// (Assuming cn is available from "@/lib/utils")
import { cn } from '@/lib/utils'; 

export default Logo;

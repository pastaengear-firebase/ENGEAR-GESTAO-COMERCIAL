// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 840, height = 240 }) => {
  // URL da imagem do logo fornecida pelo usuário
  const logoImagePath = "https://storage.googleapis.com/ecdt-logo-saida/14f838ca6736777a8b269b79cae43b2b84900eb9dd53c910eef80890010193ea/ENGEAR.webp";
  const altText = "ENGEAR Logo";

  const actualWidth = width || 840; // Default width increased
  const actualHeight = height || 240; // Default height increased

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center bg-white p-1', // Fundo branco e padding
        className
      )}
      style={{ width: `${actualWidth}px`, height: `${actualHeight}px` }}
      title={altText}
    >
      <Image
        src={logoImagePath}
        alt={altText}
        width={actualWidth}
        height={actualHeight}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        priority
      />
    </div>
  );
};

export default Logo;

// src/components/common/logo.tsx
import type React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width, height }) => {
  // Usando um placeholder porque o link do imgbb não é um link direto para a imagem.
  const logoImagePath = "https://placehold.co/300x80/ffffff/661923?text=ENGEAR&font=sans";
  const altText = "ENGEAR Logo";

  return (
    // O div wrapper. A classe 'className' vinda de fora controlará o tamanho.
    <div className={cn(className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoImagePath}
        alt={altText}
        width={width}
        height={height}
        style={{
          objectFit: 'contain',
          // Se a largura (width) for fornecida, use-a, caso contrário, seja responsivo.
          width: width ? `${width}px` : '100%',
          // Deixe a altura ser automática para manter a proporção, a menos que especificada.
          height: height ? `${height}px` : 'auto',
        }}
      />
    </div>
  );
};

export default Logo;

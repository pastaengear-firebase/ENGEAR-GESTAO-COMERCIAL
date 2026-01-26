// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width, height }) => {
  const logoImagePath = "https://i.ibb.co/GfWMfMY/novologoe.png";
  const altText = "ENGEAR Logo";

  // Determina se o logo deve ser responsivo (se width/height não forem passados)
  const isResponsive = !width && !height;
  
  // Define os valores de width/height para o componente Image.
  // Para o caso responsivo, usamos valores altos para definir a proporção.
  // Para o caso de tamanho fixo, usamos os valores passados.
  const finalWidth = width || 3508;
  const finalHeight = height || 834;

  return (
    // O div wrapper. A classe 'className' vinda de fora controlará o tamanho.
    <div className={cn(className)}>
      <Image
        unoptimized={true}
        src={logoImagePath}
        alt={altText}
        width={finalWidth}
        height={finalHeight}
        style={{
          objectFit: 'contain',
          // Se for responsivo, ocupa 100% da largura do contêiner.
          // Se não, o tamanho é controlado pelos props 'width' e 'height' do Next/Image.
          width: isResponsive ? '100%' : 'auto',
          height: 'auto',
        }}
        priority
      />
    </div>
  );
};

export default Logo;

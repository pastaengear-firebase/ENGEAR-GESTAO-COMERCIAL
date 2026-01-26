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
  const logoImagePath = "https://storage.googleapis.com/source-buck-21832-us-central1-unique/1e838c64-4e4b-4b1f-9988-5188f6911c7d.png";
  const altText = "ENGEAR Logo";

  // Determina se o logo deve ser responsivo (se width/height não forem passados)
  const isResponsive = !width && !height;
  
  // Define os valores de width/height para o componente Image.
  // Para o caso responsivo, usamos valores altos para definir a proporção.
  // Para o caso de tamanho fixo, usamos os valores passados.
  const finalWidth = width || 400;
  const finalHeight = height || 125;

  return (
    // O div wrapper. A classe 'className' vinda de fora controlará o tamanho.
    <div className={cn('bg-white', className)}>
      <Image
        src={logoImagePath}
        alt={altText}
        width={finalWidth}
        height={finalHeight}
        style={{
          objectFit: 'contain',
          // Se for responsivo, ocupa 100% da largura do contêiner.
          // Se não, o tamanho é controlado pelos props 'width' e 'height' do Next/Image.
          width: isResponsive ? '100%' : finalWidth,
          height: 'auto',
        }}
        priority
      />
    </div>
  );
};

export default Logo;

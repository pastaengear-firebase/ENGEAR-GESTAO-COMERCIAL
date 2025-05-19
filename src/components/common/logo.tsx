// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  // ATENÇÃO: Este componente agora espera que você tenha um arquivo de imagem
  // chamado "logo.png" (ou o nome que você preferir) dentro da pasta "public"
  // do seu projeto Next.js.
  // Exemplo: se seu arquivo é "meu_logo_final.webp", coloque-o em "public/meu_logo_final.webp"
  // e altere o valor de `logoImagePath` abaixo para "/meu_logo_final.webp".

  const logoImagePath = "/logo.png"; // Caminho relativo à pasta 'public'

  return (
    <div className={className} style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
      <Image
        src={logoImagePath}
        alt="ENGEAR Logo"
        layout="fill" // Ou 'intrinsic', 'fixed', 'responsive' dependendo do comportamento desejado
        objectFit="contain" // Ou 'cover', 'fill', etc.
        priority // Opcional: Carrega a imagem do logo com prioridade
      />
    </div>
  );
};

export default Logo;

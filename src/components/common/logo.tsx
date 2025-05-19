// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  // ATENÇÃO CRÍTICA - POR FAVOR, LEIA E AJUSTE:
  //
  // 1. LOCALIZAÇÃO DO ARQUIVO:
  //    O arquivo da sua imagem do logo (ex: `meu_logo.png`) DEVE estar na pasta `public`.
  //    Esta pasta `public` PRECISA estar na RAIZ do seu projeto (junto com `src`, `package.json`).
  //
  // 2. CAMINHO DA IMAGEM ABAIXO:
  //    A variável `logoImagePath` DEVE corresponder EXATAMENTE ao nome e caminho do seu arquivo
  //    dentro da pasta `public`. O caminho DEVE começar com uma barra `/`.
  //
  //    EXEMPLOS DE AJUSTE:
  //    - Se seu arquivo é `public/logo_engear.png`, então:
  //      const logoImagePath = "/logo_engear.png";
  //
  //    - Se seu arquivo é `public/images/logo_final.svg`, então:
  //      const logoImagePath = "/images/logo_final.svg";
  //
  //    Certifique-se de que a extensão do arquivo (.png, .jpg, .svg, etc.) está correta.

  const logoImagePath = "/logo.png"; // <--- AJUSTE ESTA LINHA CUIDADOSAMENTE!

  return (
    <div className={className} style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
      <Image
        src={logoImagePath}
        alt="ENGEAR Logo" // O texto alternativo é importante para acessibilidade.
        layout="fill" 
        objectFit="contain" 
        priority // Carrega a imagem do logo com prioridade
        unoptimized={logoImagePath.endsWith('.svg')} // Adicionar se for SVG para evitar otimização desnecessária
      />
    </div>
  );
};

export default Logo;

// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  // ATENÇÃO CRÍTICA - POR FAVOR, LEIA E AJUSTE SE NECESSÁRIO:
  //
  // 1. LOCALIZAÇÃO DO ARQUIVO:
  //    O arquivo da sua imagem do logo (agora definido como `NEWLOGO.jpg`) DEVE estar na pasta `public`.
  //    Esta pasta `public` PRECISA estar na RAIZ do seu projeto (junto com `src`, `package.json`).
  //
  // 2. CAMINHO DA IMAGEM ABAIXO:
  //    A variável `logoImagePath` foi definida para "/NEWLOGO.jpg".
  //    Se o seu arquivo real na pasta `public` tiver um nome ou extensão diferente
  //    (ex: "newlogo.png", "Newlogo.jpg", "NEWLOGO.jpeg"), você DEVE ajustar a linha abaixo para corresponder.
  //
  //    Certifique-se de que a extensão do arquivo (.jpg, .png, .svg, etc.) está correta.
  //    VERIFIQUE TAMBÉM AS LETRAS MAIÚSCULAS E MINÚSCULAS NO NOME DO ARQUIVO.
  //    O nome do arquivo é SENSÍVEL A MAIÚSCULAS/MINÚSCULAS em muitos sistemas.

  const logoImagePath = "/NEWLOGO.jpg"; // <--- VERIFIQUE ESTE CAMINHO E NOME DE ARQUIVO!

  return (
    <div className={className ? `${className} bg-white` : "bg-white"} style={{ display: 'inline-block', padding: '5px', borderRadius: '4px' }}>
      <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
        <Image
          src={logoImagePath}
          alt="ENGEAR Logo" // O texto alternativo é importante para acessibilidade.
          layout="fill"
          objectFit="contain"
          priority // Carrega a imagem do logo com prioridade
          unoptimized={logoImagePath.endsWith('.svg')} // Adicionar se for SVG para evitar otimização desnecessária
        />
      </div>
    </div>
  );
};

export default Logo;

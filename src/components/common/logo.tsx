// src/components/common/logo.tsx
import type React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className, width = 280, height = 80 }) => {
  // ATENÇÃO: Verifique os seguintes pontos CRÍTICOS para a imagem do logo aparecer:
  // 1. O ARQUIVO DA IMAGEM DO LOGO DEVE ESTAR NA PASTA `public` NA RAIZ DO SEU PROJETO.
  //    (Exemplo: se seu projeto está em `/meu-app/`, a imagem deve estar em `/meu-app/public/`)
  //
  // 2. O VALOR DA VARIÁVEL `logoImagePath` ABAIXO DEVE CORRESPONDER EXATAMENTE AO NOME DO SEU ARQUIVO DE IMAGEM
  //    DENTRO DA PASTA `public`.
  //    Exemplos:
  //    - Se o arquivo é `public/logo_da_empresa.png`, então logoImagePath = "/logo_da_empresa.png"
  //    - Se o arquivo é `public/images/logo.png`, então logoImagePath = "/images/logo.png"
  //
  //    O caminho DEVE começar com uma barra `/`.

  const logoImagePath = "/logo.png"; // <--- AJUSTE ESTE CAMINHO SE O NOME OU LOCAL DA SUA IMAGEM FOR DIFERENTE!

  return (
    <div className={className} style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
      <Image
        src={logoImagePath}
        alt="ENGEAR Logo" // O texto alternativo é importante para acessibilidade.
        layout="fill" 
        objectFit="contain" 
        priority // Opcional: Carrega a imagem do logo com prioridade
      />
    </div>
  );
};

export default Logo;

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
  // 1. PASTA 'public' OBRIGATÓRIA NA RAIZ DO PROJETO:
  //    Para que o Next.js encontre imagens estáticas como o seu logo,
  //    DEVE existir uma pasta chamada 'public' na RAIZ do seu projeto.
  //    A imagem que você enviou mostra que a pasta 'public' FOI CRIADA CORRETAMENTE na raiz. Ótimo!
  //
  // 2. LOCALIZAÇÃO DO ARQUIVO DA IMAGEM DO LOGO:
  //    O arquivo da sua imagem do logo (agora definido como `NEWLOGO.JPG`)
  //    DEVE estar DENTRO desta pasta `public`.
  //    Caminho esperado: `public/NEWLOGO.JPG`
  //
  //    O CONTEÚDO QUE VOCÊ MOSTROU NO EDITOR DE TEXTO (./NEWLOGO.JPG)
  //    NÃO É COMO SE ADICIONA A IMAGEM. VOCÊ PRECISA FAZER UPLOAD
  //    DO ARQUIVO DE IMAGEM REAL (NEWLOGO.JPG) PARA DENTRO DA PASTA 'public'.
  //    O arquivo de texto que contém "./NEWLOGO.JPG" deve ser excluído.
  //
  // 3. CAMINHO DA IMAGEM ABAIXO:
  //    A variável `logoImagePath` foi definida para "/NEWLOGO.JPG".
  //    Isso significa que o Next.js procurará por `NEWLOGO.JPG` diretamente
  //    dentro da pasta `public`.
  //
  //    Certifique-se de que a extensão do arquivo (.JPG, .jpg, .png, etc.) está correta
  //    e que o nome do arquivo corresponde exatamente (sensível a maiúsculas/minúsculas).
  //    Com base na sua imagem do editor, estou usando "NEWLOGO.JPG".

  const logoImagePath = "/NEWLOGO.JPG"; // <--- ATUALIZADO PARA .JPG (maiúsculo como na sua imagem)

  return (
    <div className={className ? `${className} bg-white` : "bg-white"} style={{ display: 'inline-block', padding: '5px', borderRadius: '4px' }}>
      <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
        <Image
          src={logoImagePath}
          alt="ENGEAR Logo" // O texto alternativo é importante para acessibilidade.
          fill // Use a propriedade fill em vez de layout="fill"
          style={{ objectFit: "contain" }} // objectFit substitui a funcionalidade de layout="fill" objectFit="contain"
          priority // Carrega a imagem do logo com prioridade
          unoptimized={true} // Adicionado para evitar otimização e corrigir erro 400/500 se a imagem for problemática
        />
      </div>
    </div>
  );
};

export default Logo;

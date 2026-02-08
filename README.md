# ENGEAR - GESTÃO COMERCIAL

Sistema completo de controle de vendas e gestão da equipe comercial ENGEAR, desenvolvido com Next.js 15 e Firebase App Hosting.

## 🚀 Tecnologias

- **Next.js 15.5.10** - Framework React com App Router (secure, patched version)
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Firebase** - Backend as a Service (Authentication, Firestore, Storage)
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes UI acessíveis e não estilizados
- **React Hook Form** - Gerenciamento de formulários
- **Lucide React** - Ícones modernos

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Conta Firebase com projeto criado

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/pastaengear-firebase/ENGEAR-GESTAO-COMERCIAL.git
cd ENGEAR-GESTAO-COMERCIAL
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais Firebase:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` e adicione suas credenciais do Firebase Console:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

**Como obter as credenciais:**
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em "Project Settings" (⚙️)
4. Role até "Your apps" e clique no ícone web (</>)
5. Copie as configurações do Firebase

## 🏃‍♂️ Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🏗️ Build

Para criar uma build de produção:

```bash
npm run build
```

Para executar a build localmente:

```bash
npm start
```

## 🚀 Deploy no Firebase App Hosting

### 1. Instale o Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Faça login no Firebase

```bash
firebase login
```

### 3. Inicialize o projeto (se necessário)

```bash
firebase init hosting
```

### 4. Deploy

```bash
firebase deploy --only hosting
```

Para Firebase App Hosting (Next.js Server Components):

```bash
firebase apphosting:backends:create
```

Siga as instruções do CLI para conectar seu repositório GitHub e configurar o backend.

## 📁 Estrutura do Projeto

```
ENGEAR-GESTAO-COMERCIAL/
├── src/
│   ├── app/                    # App Router do Next.js 14
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   ├── layout.tsx         # Layout raiz
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   ├── components/            # Componentes reutilizáveis
│   │   └── ui/               # Componentes UI (shadcn/ui style)
│   ├── contexts/             # React Contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilitários e helpers
│   │   └── utils.ts         # Funções utilitárias
│   ├── firebase/             # Configuração Firebase
│   │   └── config.ts        # Firebase initialization
│   └── types/                # Tipos TypeScript
│       └── index.ts         # Tipos comuns
├── public/                   # Arquivos estáticos
├── .env.local.example       # Exemplo de variáveis de ambiente
├── apphosting.yaml          # Configuração Firebase App Hosting
├── firebase.json            # Configuração Firebase
├── next.config.js           # Configuração Next.js
├── tailwind.config.js       # Configuração Tailwind
├── tsconfig.json            # Configuração TypeScript
└── package.json             # Dependências e scripts
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local` com credenciais reais
- Use `.env.local.example` apenas como template
- Credenciais sensíveis devem ser configuradas no Firebase Console
- O arquivo `.gitignore` já está configurado para proteger arquivos sensíveis

## 📚 Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [React Hook Form Documentation](https://react-hook-form.com/)

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
3. Push para a branch (`git push origin feature/MinhaFeature`)
4. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe ENGEAR

Desenvolvido com ❤️ pela equipe ENGEAR.

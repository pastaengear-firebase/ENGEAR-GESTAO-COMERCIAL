# 1. Usa uma imagem oficial estável (Node 20 LTS)
FROM node:20-slim

# 2. Define o diretório de trabalho
WORKDIR /app

# 3. Copia arquivos de dependências primeiro (otimiza o cache)
COPY package*.json ./

# 4. Instala as dependências de produção e desenvolvimento para o build
RUN npm install

# 5. Copia o restante do código da aplicação
COPY . .

# 6. Constrói a aplicação Next.js para produção
RUN npm run build

# 7. Define a variável de ambiente da porta exigida pelo App Hosting/Cloud Run
ENV PORT=8080
EXPOSE 8080

# 8. Comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]

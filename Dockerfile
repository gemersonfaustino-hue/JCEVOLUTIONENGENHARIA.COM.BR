# Estágio 1: Construção (Build)
FROM node:22-slim AS builder
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para build)
RUN npm install

# Copia o restante do código do aplicativo
COPY . .

# Executa o build (compila o frontend React com Vite e empacota o backend Express com esbuild)
RUN npm run build

# Estágio 2: Execução (Runtime)
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copia arquivos de dependências e instala apenas dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia os arquivos compilados do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database.json ./database.json

# Expõe a porta 8080 (padrão usada no Cloud Run)
EXPOSE 8080

# Inicia o servidor diretamente via node (evita overhead do npm e repassa sinais de sistema)
CMD ["node", "dist/server.cjs"]

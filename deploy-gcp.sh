#!/bin/bash
# Script de Implantação Automatizada no Google Cloud Platform (GCP)
# Para JC EVOLUTION ENGENHARIA MECÂNICA
#
# Este script automatiza o provisionamento e deploy de:
# 1. APIs necessárias no GCP
# 2. Banco de Dados Cloud SQL (PostgreSQL)
# 3. Artifact Registry para armazenar a imagem Docker
# 4. Build da imagem com Google Cloud Build
# 5. Deploy no Google Cloud Run conectado de forma segura ao Cloud SQL

set -e

# Cores para logs bonitos
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}      JC EVOLUTION - IMPLANTAÇÃO AUTOMATIZADA NO GOOGLE CLOUD       ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Configurar Projeto GCP
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Qual é o ID do seu projeto no Google Cloud (Project ID)?${NC}"
    read -p "> " PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}ID do projeto é obrigatório.${NC}"
        exit 1
    fi
    gcloud config set project "$PROJECT_ID"
else
    echo -e "${GREEN}ID do Projeto Detectado:${NC} $PROJECT_ID"
    read -p "Deseja usar este projeto? (S/n): " confirm_proj
    if [[ "$confirm_proj" =~ ^[Nn] ]]; then
        echo -e "${YELLOW}Digite o ID do projeto que deseja utilizar:${NC}"
        read -p "> " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    fi
fi

# 2. Selecionar Região
DEFAULT_REGION="southamerica-east1" # São Paulo
echo -e "\n${YELLOW}Selecione a região do GCP para implantar (Recomendado: southamerica-east1 para o Brasil):${NC}"
read -p "Aperte ENTER para usar '$DEFAULT_REGION' ou digite outra região: " REGION
if [ -z "$REGION" ]; then
    REGION=$DEFAULT_REGION
fi

echo -e "\n${BLUE}[1/6] Ativando as APIs necessárias no Google Cloud...${NC}"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com

# 3. Configurar Cloud SQL
echo -e "\n${BLUE}[2/6] Configurando o Banco de Dados Cloud SQL (PostgreSQL)...${NC}"
INSTANCE_NAME="jc-evolution-db"
DB_NAME="jc_evolution"
DB_USER="postgres"

# Gerar uma senha forte aleatória para o banco de dados
DB_PASSWORD=$(openssl rand -hex 16)

# Verificar se a instância já existe
if gcloud sql instances describe "$INSTANCE_NAME" &>/dev/null; then
    echo -e "${YELLOW}A instância Cloud SQL '$INSTANCE_NAME' já existe. Vamos reutilizá-la.${NC}"
    read -p "Digite a senha do usuário '$DB_USER' da sua instância Cloud SQL existente (ou deixe em branco se já sabe e quer continuar): " MANUAL_PASSWORD
    if [ -not -z "$MANUAL_PASSWORD" ]; then
        DB_PASSWORD=$MANUAL_PASSWORD
    fi
else
    echo -e "${YELLOW}Criando instância Cloud SQL PostgreSQL (tipo db-f1-micro para menor custo de desenvolvimento)...${NC}"
    echo -e "Isso pode levar de 3 a 5 minutos. Por favor, aguarde..."
    gcloud sql instances create "$INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --root-password="$DB_PASSWORD"
        
    echo -e "${GREEN}Instância criada com sucesso!${NC}"
fi

# Criar banco de dados se não existir
echo -e "Verificando/Criando o banco de dados '$DB_NAME'..."
gcloud sql databases create "$DB_NAME" --instance="$INSTANCE_NAME" || true

# 4. Criar Repositório no Artifact Registry
echo -e "\n${BLUE}[3/6] Configurando o Artifact Registry para armazenar a imagem Docker...${NC}"
REPO_NAME="jc-evolution-repo"
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    echo -e "Criando repositório de imagens Docker..."
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Repositório JC Evolution"
fi

# 5. Enviar código e buildar no Cloud Build
echo -e "\n${BLUE}[4/6] Enviando o código e construindo a imagem no Cloud Build...${NC}"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/app:latest"
gcloud builds submit --tag "$IMAGE_TAG" .

# 6. Preparar variáveis de ambiente para o Cloud Run
echo -e "\n${BLUE}[5/6] Preparando conexão segura com o Cloud SQL...${NC}"
# String de conexão usando Unix Sockets (Formato ideal e ultra seguro para Cloud Run)
CONNECTION_NAME="$PROJECT_ID:$REGION:$INSTANCE_NAME"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

# Perguntar pela chave da API Gemini
echo -e "\n${YELLOW}Insira sua chave de API do Gemini (deixe em branco se for configurar depois):${NC}"
read -p "> " GEMINI_KEY

# 7. Executar o Deploy no Cloud Run
echo -e "\n${BLUE}[6/6] Realizando o Deploy do Web Service no Cloud Run...${NC}"
if [ -z "$GEMINI_KEY" ]; then
    gcloud run deploy jc-evolution-service \
        --image="$IMAGE_TAG" \
        --region="$REGION" \
        --platform=managed \
        --allow-unauthenticated \
        --port=3000 \
        --add-cloudsql-instances="$CONNECTION_NAME" \
        --set-env-vars="DATABASE_URL=$DATABASE_URL,NODE_ENV=production"
else
    gcloud run deploy jc-evolution-service \
        --image="$IMAGE_TAG" \
        --region="$REGION" \
        --platform=managed \
        --allow-unauthenticated \
        --port=3000 \
        --add-cloudsql-instances="$CONNECTION_NAME" \
        --set-env-vars="DATABASE_URL=$DATABASE_URL,GEMINI_API_KEY=$GEMINI_KEY,NODE_ENV=production"
fi

# Pegar a URL de implantação
SERVICE_URL=$(gcloud run services describe jc-evolution-service --region="$REGION" --format='value(status.url)')

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 PARABÉNS! SEU WEB SERVICE FOI IMPLANTADO COM SUCESSO NO GCP! 🎉${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "🔗 ${BLUE}URL do Site:${NC} $SERVICE_URL"
echo -e "📊 ${BLUE}Banco de Dados Cloud SQL:${NC} Ativo, conectado via socket seguro Unix!"
echo -e "🔐 ${BLUE}Credenciais do PostgreSQL criadas:${NC}"
echo -e "   - Host: Unix Socket (/cloudsql/$CONNECTION_NAME)"
echo -e "   - Usuário: $DB_USER"
echo -e "   - Senha gerada: $DB_PASSWORD"
echo -e "   - Banco de dados: $DB_NAME"
echo -e "   - Connection String em Produção: $DATABASE_URL"
echo -e "\n${YELLOW}Guarde estas credenciais de forma segura!${NC}"
echo -e "${BLUE}======================================================================${NC}"

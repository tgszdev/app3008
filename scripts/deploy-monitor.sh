#!/bin/bash

# Script para deploy automatizado e monitoramento
# Uso: ./scripts/deploy-monitor.sh "mensagem do commit"

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script a partir da raiz do projeto (onde está o package.json)"
    exit 1
fi

# Verificar se há mudanças para commitar
if [ -z "$(git status --porcelain)" ]; then
    warning "Nenhuma mudança detectada para commitar"
    exit 0
fi

# Mensagem do commit (primeiro argumento ou padrão)
COMMIT_MSG=${1:-"feat: atualização automática $(date +'%d/%m/%Y %H:%M')"}

log "Iniciando processo de deploy..."

# 1. Adicionar todas as mudanças
log "Adicionando mudanças..."
git add .

# 2. Fazer commit
log "Fazendo commit: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

# 3. Push para GitHub
log "Enviando para GitHub..."
if git push origin main; then
    success "Push para GitHub realizado com sucesso!"
else
    error "Falha no push para GitHub"
    exit 1
fi

# 4. Verificar status no GitHub
log "Verificando status no GitHub..."
COMMIT_HASH=$(git rev-parse HEAD)
log "Commit hash: $COMMIT_HASH"

# 5. Aguardar um pouco para o Vercel processar
log "Aguardando Vercel processar o deploy..."
sleep 10

# 6. Verificar se o site está acessível
log "Testando acessibilidade do site..."
SITE_URL="https://app3008.vercel.app"
FALLBACK_URL="https://app3008-git-main-tgszdev.vercel.app"

# Testar URL principal
if curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" | grep -q "200"; then
    success "Site principal acessível: $SITE_URL"
    FINAL_URL="$SITE_URL"
elif curl -s -o /dev/null -w "%{http_code}" "$FALLBACK_URL" | grep -q "200"; then
    success "Site alternativo acessível: $FALLBACK_URL"
    FINAL_URL="$FALLBACK_URL"
else
    warning "Site não acessível ainda. Pode estar em build..."
    FINAL_URL="Verifique no dashboard do Vercel"
fi

# 7. Resumo final
echo ""
echo "=========================================="
success "DEPLOY CONCLUÍDO!"
echo "=========================================="
echo "📝 Commit: $COMMIT_MSG"
echo "🔗 Hash: $COMMIT_HASH"
echo "🌐 GitHub: https://github.com/tgszdev/app3008"
echo "🚀 Vercel: $FINAL_URL"
echo "📊 Dashboard Vercel: https://vercel.com/dashboard"
echo "=========================================="

# 8. Instruções para acompanhar
echo ""
log "Para acompanhar o deploy:"
echo "1. GitHub: https://github.com/tgszdev/app3008/commits"
echo "2. Vercel: https://vercel.com/dashboard"
echo "3. Site: $FINAL_URL"
echo ""
log "Próximos passos:"
echo "- Acesse o site para verificar as mudanças"
echo "- Verifique os logs no dashboard do Vercel se houver problemas"
echo "- Use este script novamente para próximos deploys"

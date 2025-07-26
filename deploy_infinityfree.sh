#!/bin/bash

# SCRIPT DE DEPLOY PARA INFINITYFREE
# Domínio: cotidianoemdebate.page.gd

echo "🚀 Iniciando deploy para InfinityFree"
echo "🌐 Domínio: cotidianoemdebate.page.gd"
echo "📅 Data: $(date)"
echo "========================================="

# 1. Verificar se o build existe
if [ ! -d "/app/frontend/build" ]; then
    echo "❌ Build não encontrado. Execute 'npm run build' primeiro"
    exit 1
fi

echo "✅ Build encontrado"

# 2. Criar pasta de deploy
DEPLOY_DIR="/app/deploy_infinityfree"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "📁 Pasta de deploy criada: $DEPLOY_DIR"

# 3. Copiar arquivos do build
cp -r /app/frontend/build/* $DEPLOY_DIR/
echo "📋 Arquivos copiados para deploy"

# 4. Criar arquivo .htaccess para React Router
cat > $DEPLOY_DIR/.htaccess << EOF
# React Router Support
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache optimization
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF

echo "⚙️ Arquivo .htaccess criado"

# 5. Criar arquivo README para upload
cat > $DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt << EOF
INSTRUÇÕES PARA DEPLOY NO INFINITYFREE
====================================

DADOS DE ACESSO:
- cPanel: https://cpanel.infinityfree.com
- Username: if0_39560925
- Senha: 36gqRpSlgSP
- Domínio: cotidianoemdebate.page.gd

PASSOS PARA UPLOAD:

1. Faça login no cPanel
2. Abra o "File Manager" 
3. Navegue até htdocs/
4. Faça upload de TODOS os arquivos desta pasta
5. Aguarde o processamento
6. Acesse: https://cotidianoemdebate.page.gd

CONFIGURAÇÕES SSL:
1. No cPanel, vá em "SSL/TLS"
2. Ative "Force HTTPS Redirect" 
3. Instale certificado SSL gratuito

TESTES APÓS DEPLOY:
- ✅ Homepage carregando
- ✅ Menu de navegação funcionando
- ✅ Produtos listando (via API externa)
- ✅ Notícias exibindo
- ✅ Login administrativo funcionando
- ✅ SSL ativo (https://)

PROBLEMAS COMUNS:
- Erro 404: Verifique se o .htaccess foi uploadado
- Erro de API: Verifique conectividade com backend
- SSL: Aguarde até 24h para ativação completa
EOF

# 6. Criar arquivo de verificação
cat > $DEPLOY_DIR/deploy_info.php << 'EOPHP'
<?php echo 'Deploy realizado em: ' . date('Y-m-d H:i:s'); ?>
EOPHP

# 7. Listar arquivos para conferência
echo ""
echo "📦 ARQUIVOS PRONTOS PARA UPLOAD:"
echo "================================="
ls -la $DEPLOY_DIR/
echo ""

# 8. Informações importantes
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://cpanel.infinityfree.com"
echo "2. Login: if0_39560925"
echo "3. Abra File Manager → htdocs"
echo "4. Faça upload dos arquivos da pasta: $DEPLOY_DIR"
echo "5. Aguarde processamento (5-10 min)"
echo "6. Teste: https://cotidianoemdebate.page.gd"
echo ""

echo "🎯 BACKEND API:"
echo "Mantido em: https://7a8d90a0-f471-4d33-9da2-4d2ccc8accda.preview.emergentagent.com"
echo "CORS configurado para: cotidianoemdebate.page.gd"
echo ""

echo "✅ Deploy preparado com sucesso!"
echo "📁 Arquivos em: $DEPLOY_DIR"
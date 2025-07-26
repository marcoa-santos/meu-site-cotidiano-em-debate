#!/bin/bash

# SCRIPT DE CONFIGURAÇÃO DO DOMÍNIO: cotidianoemdebate.com.br
# Execute este script APÓS registrar o domínio

DOMAIN="cotidianoemdebate.com.br"
WWW_DOMAIN="www.cotidianoemdebate.com.br"

echo "🌐 Configurando domínio: $DOMAIN"
echo "📅 Data: $(date)"
echo "----------------------------------------"

# 1. Verificar se o domínio está propagado
echo "🔍 Verificando propagação DNS..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "✅ DNS propagado com sucesso"
else
    echo "❌ DNS ainda não propagado. Aguarde mais algumas horas."
    exit 1
fi

# 2. Testar conectividade
echo "🔗 Testando conectividade..."
if curl -s --head $DOMAIN > /dev/null; then
    echo "✅ Domínio acessível"
else
    echo "⚠️  Domínio ainda não totalmente acessível"
fi

# 3. Informações para configuração SSL
echo ""
echo "🛡️ PRÓXIMO PASSO - CONFIGURAR SSL:"
echo "Execute os seguintes comandos no servidor:"
echo ""
echo "# Instalar Certbot"
echo "sudo apt install certbot python3-certbot-nginx -y"
echo ""
echo "# Obter certificado SSL"
echo "sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
echo ""
echo "# Testar renovação automática"
echo "sudo certbot renew --dry-run"
echo ""

# 4. Configuração do servidor web
echo "⚙️ CONFIGURAÇÃO DO SERVIDOR WEB:"
echo "Adicione ao seu arquivo de configuração do Nginx:"
echo ""
cat << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo ""
echo "✅ Configuração preparada para $DOMAIN"
echo "📋 Consulte o arquivo DOMAIN_SETUP.md para instruções completas"
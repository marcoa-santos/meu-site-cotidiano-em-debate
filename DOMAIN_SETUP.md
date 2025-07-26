# CONFIGURAÇÃO DO DOMÍNIO: cotidianoemdebate.com.br

## 🌐 INFORMAÇÕES DO DOMÍNIO
- **Domínio Principal:** cotidianoemdebate.com.br
- **WWW:** www.cotidianoemdebate.com.br
- **Repositório:** Cotidiano em Debate
- **Tipo:** .com.br (domínio brasileiro comercial)

## 📋 LISTA DE VERIFICAÇÃO

### ✅ REGISTRO DO DOMÍNIO
- [ ] Acessar https://registro.br
- [ ] Verificar disponibilidade de "cotidianoemdebate.com.br"
- [ ] Registrar domínio (R$40/ano aproximadamente)
- [ ] Configurar dados de contato
- [ ] Confirmar propriedade via e-mail

### ✅ CONFIGURAÇÃO DNS
- [ ] Configurar registro A: @ → [IP_DO_SERVIDOR]
- [ ] Configurar registro A: www → [IP_DO_SERVIDOR]
- [ ] Configurar registro CNAME: repositorio → cotidianoemdebate.com.br
- [ ] Aguardar propagação DNS (24-48 horas)

### ✅ CERTIFICADO SSL
- [ ] Instalar Let's Encrypt
- [ ] Configurar renovação automática
- [ ] Testar HTTPS
- [ ] Configurar redirecionamento HTTP → HTTPS

### ✅ CONFIGURAÇÃO DO SERVIDOR
- [ ] Atualizar arquivo de configuração do servidor web
- [ ] Configurar virtual host para o domínio
- [ ] Testar acesso via novo domínio
- [ ] Configurar redirecionamentos necessários

## 🔧 COMANDOS TÉCNICOS (Para depois do registro)

### Verificar propagação DNS:
```bash
nslookup cotidianoemdebate.com.br
dig cotidianoemdebate.com.br
```

### Testar certificado SSL:
```bash
openssl s_client -connect cotidianoemdebate.com.br:443
```

## 📊 TIMELINE ESTIMADO
- **Registro:** 10-15 minutos
- **Configuração DNS:** 5 minutos  
- **Propagação:** 24-48 horas
- **SSL:** 10-15 minutos
- **Testes finais:** 30 minutos

## 🎯 RESULTADO FINAL
Após a configuração completa:
- ✅ https://cotidianoemdebate.com.br
- ✅ https://www.cotidianoemdebate.com.br
- ✅ Certificado SSL válido
- ✅ Redirecionamentos funcionando
- ✅ Repositório acessível pelo novo domínio

## 📞 SUPORTE
Se precisar de ajuda durante o processo:
1. Documentação do Registro.br
2. Suporte técnico do registrar escolhido
3. Documentação Let's Encrypt para SSL
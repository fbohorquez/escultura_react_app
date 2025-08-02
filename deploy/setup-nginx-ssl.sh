#!/bin/bash

# Script para configurar nginx con SSL en el servidor remoto

set -e

REMOTE_USER="ec2-user"
REMOTE_HOST="dev2bit.com"
SSH_KEY="$HOME/.ssh/dev2bit.pem"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

configure_nginx_ssl() {
    log_info "Configurando nginx con SSL en el servidor remoto..."
    
    # Transferir configuración nginx
    scp -i "$SSH_KEY" nginx-ssl.conf "$REMOTE_USER@$REMOTE_HOST:/tmp/"
    
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        # Instalar nginx si no está instalado
        if ! command -v nginx &> /dev/null; then
            echo "📦 Instalando nginx..."
            sudo yum update -y
            sudo amazon-linux-extras install nginx1 -y
            sudo systemctl enable nginx
        fi
        
        # Verificar certificados SSL
        if [[ ! -f /etc/letsencrypt/live/escultura.dev2bit.com/fullchain.pem ]]; then
            echo "❌ Certificado SSL no encontrado en /etc/letsencrypt/live/escultura.dev2bit.com/"
            echo "   Por favor, instala el certificado SSL primero"
            exit 1
        fi
        
        echo "✅ Certificado SSL encontrado"
        
        # Backup de configuración actual
        if [[ -f /etc/nginx/conf.d/escultura.conf ]]; then
            sudo cp /etc/nginx/conf.d/escultura.conf /etc/nginx/conf.d/escultura.conf.backup.$(date +%Y%m%d-%H%M%S)
        fi
        
        # Copiar nueva configuración
        sudo cp /tmp/nginx-ssl.conf /etc/nginx/conf.d/escultura.conf
        
        # Remover configuración por defecto si existe
        if [[ -f /etc/nginx/conf.d/default.conf ]]; then
            sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
        fi
        
        # Verificar configuración
        echo "🔍 Verificando configuración de nginx..."
        sudo nginx -t
        
        if [[ $? -eq 0 ]]; then
            echo "✅ Configuración de nginx válida"
            
            # Reiniciar nginx
            echo "🔄 Reiniciando nginx..."
            sudo systemctl restart nginx
            sudo systemctl status nginx --no-pager
            
            echo "✅ nginx configurado y ejecutándose con SSL"
        else
            echo "❌ Error en la configuración de nginx"
            exit 1
        fi
        
        # Verificar puertos
        echo "🔍 Verificando puertos abiertos..."
        ss -tuln | grep -E ':(80|443|3089)'
        
        # Configurar firewall si está disponible
        if command -v firewall-cmd &> /dev/null; then
            echo "🔥 Configurando firewall..."
            sudo firewall-cmd --permanent --add-service=http
            sudo firewall-cmd --permanent --add-service=https
            sudo firewall-cmd --permanent --add-port=3089/tcp
            sudo firewall-cmd --reload
            echo "✅ Firewall configurado"
        fi
EOF
    
    log_success "Configuración de nginx completada"
}

verify_ssl_setup() {
    log_info "Verificando configuración SSL..."
    
    echo "🔍 Verificando certificados SSL remotos..."
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        echo "📋 Certificados SSL disponibles:"
        sudo ls -la /etc/letsencrypt/live/escultura.dev2bit.com/
        
        echo ""
        echo "📅 Fecha de expiración del certificado:"
        sudo openssl x509 -in /etc/letsencrypt/live/escultura.dev2bit.com/fullchain.pem -noout -dates
        
        echo ""
        echo "🔍 Estado de nginx:"
        sudo systemctl status nginx --no-pager -l
EOF
    
    echo ""
    log_success "Verificación completada"
    echo ""
    echo "🌐 URLs de acceso con SSL:"
    echo "   📱 Aplicación: https://escultura.dev2bit.com"
    echo "   🔗 Signaling (WebSocket): wss://escultura.dev2bit.com:3089"
    echo "   💚 Health Check: https://escultura.dev2bit.com/health"
}

show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup    - Configurar nginx con SSL (por defecto)"
    echo "  verify   - Verificar configuración SSL"
    echo "  status   - Ver estado de nginx"
    echo "  logs     - Ver logs de nginx"
    echo "  help     - Mostrar esta ayuda"
}

case "${1:-setup}" in
    setup)
        configure_nginx_ssl
        verify_ssl_setup
        ;;
    verify)
        verify_ssl_setup
        ;;
    status)
        ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl status nginx --no-pager"
        ;;
    logs)
        ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "sudo tail -f /var/log/nginx/escultura.*.log"
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac

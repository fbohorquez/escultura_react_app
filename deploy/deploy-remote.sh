#!/bin/bash

# Script de despliegue remoto para Escultura
# Sincroniza el proyecto con el servidor y actualiza los contenedores Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuración del servidor remoto
REMOTE_USER="ec2-user"
REMOTE_HOST="dev2bit.com"
REMOTE_PATH="/srv/escultura-react"
SSH_KEY="$HOME/.ssh/dev2bit.pem"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos..."
    
    # Verificar rsync
    if ! command -v rsync &> /dev/null; then
        log_error "rsync no está instalado"
        exit 1
    fi
    
    # Verificar clave SSH
    if [[ ! -f "$SSH_KEY" ]]; then
        log_error "Clave SSH no encontrada: $SSH_KEY"
        exit 1
    fi
    
    # Verificar conexión SSH
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection test'" &>/dev/null; then
        log_error "No se puede conectar al servidor remoto"
        exit 1
    fi
    
    log_success "Prerrequisitos verificados"
}

# Función para sincronizar archivos
sync_files() {
    log_info "Sincronizando archivos con el servidor remoto..."
    
    # Crear directorio remoto si no existe
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"
    
    # Rsync con exclusiones
    rsync -avz --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='.vscode' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='.env.local' \
        --exclude='.env.development.local' \
        --exclude='.env.test.local' \
        --exclude='.env.production.local' \
        -e "ssh -i $SSH_KEY" \
        "$PROJECT_ROOT/" \
        "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
    
    log_success "Archivos sincronizados"
}

# Función para gestionar Docker en el servidor remoto
manage_remote_docker() {
    log_info "Gestionando contenedores Docker en el servidor remoto..."
    
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd /srv/escultura-react/deploy
        
        echo "🛑 Deteniendo contenedores existentes..."
        if sudo docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
            sudo docker-compose -f docker-compose.prod.yml down
            echo "✅ Contenedores detenidos"
        else
            echo "ℹ️  No hay contenedores ejecutándose"
        fi

        echo "🧹 Limpiando contenedores detenidos..."
        sudo docker-compose -f docker-compose.prod.yml rm -f || true

        echo "🔨 Construyendo y iniciando nuevos contenedores..."
        sudo docker-compose -f docker-compose.prod.yml up --build -d
        
        echo "📊 Estado de los contenedores:"
        sudo docker-compose -f docker-compose.prod.yml ps
        
        echo "🔍 Verificando salud de los servicios..."
        sleep 10
        
        # Verificar aplicación React con SSL
        for i in {1..6}; do
            if curl -k -s https://escultura.dev2bit.com:5173 > /dev/null; then
                echo "✅ Aplicación React respondiendo via HTTPS en puerto 5173"
                break
            else
                echo "⏳ Esperando aplicación React HTTPS... ($i/6)"
                sleep 5
            fi
        done
        
        # Verificar servidor signaling
        for i in {1..6}; do
            if curl -s http://localhost:3088/health > /dev/null; then
                echo "✅ Servidor signaling respondiendo en puerto 3088"
                break
            else
                echo "⏳ Esperando servidor signaling... ($i/6)"
                sleep 5
            fi
        done
EOF
    
    log_success "Gestión Docker completada"
}

# Función para mostrar logs remotos
show_remote_logs() {
    log_info "Mostrando logs de los contenedores remotos..."
    
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd /srv/escultura-react/deploy
        echo "📋 Logs de los últimos 50 líneas:"
        sudo docker-compose logs --tail=50
EOF
}

# Función para verificar el estado del despliegue
verify_deployment() {
    log_info "Verificando el despliegue..."
    
    # Obtener IP del servidor
    SERVER_IP=$(ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s ifconfig.me" 2>/dev/null || echo "dev2bit.com")
    
    echo ""
    log_success "¡Despliegue completado!"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "   📱 Aplicación React: https://escultura.dev2bit.com:5173"
    echo "   🔗 Servidor Signaling: ws://escultura.dev2bit.com:3088"
    echo "   💚 Health Check: http://escultura.dev2bit.com:3088/health"
    echo ""
    echo "📋 Comandos útiles:"
    echo "   Ver logs: ./deploy-remote.sh logs"
    echo "   Ver estado: ./deploy-remote.sh status"
    echo "   Reiniciar: ./deploy-remote.sh restart"
}

# Función principal de despliegue
deploy() {
    echo "🚀 Iniciando despliegue remoto de Escultura"
    echo "=========================================="
    echo "📍 Servidor: $REMOTE_USER@$REMOTE_HOST"
    echo "📁 Destino: $REMOTE_PATH"
    echo ""
    
    check_prerequisites
    sync_files
    manage_remote_docker
    verify_deployment
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy   - Desplegar proyecto completo (por defecto)"
    echo "  sync     - Solo sincronizar archivos"
    echo "  restart  - Solo reiniciar contenedores remotos"
    echo "  logs     - Mostrar logs de contenedores remotos"
    echo "  status   - Mostrar estado de contenedores remotos"
    echo "  ssh      - Conectar por SSH al servidor"
    echo "  help     - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0              # Despliegue completo"
    echo "  $0 deploy       # Despliegue completo"
    echo "  $0 sync         # Solo sincronizar archivos"
    echo "  $0 logs         # Ver logs remotos"
}

# Manejar comandos
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    sync)
        check_prerequisites
        sync_files
        log_success "Sincronización completada"
        ;;
    restart)
        check_prerequisites
        manage_remote_docker
        ;;
    logs)
        check_prerequisites
        ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH/deploy && sudo docker-compose -f docker-compose.prod.yml logs --tail=50"
        ;;
    status)
        check_prerequisites
        ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH/deploy && sudo docker-compose -f docker-compose.prod.yml ps"
        ;;
    ssh)
        ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST"
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

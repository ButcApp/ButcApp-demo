#!/bin/bash

# ButcApp Deployment Script
# Debian/Ubuntu VPS için otomatik kurulum script'i

set -e  # Hata durumunda script'i durdur

echo "🚀 ButcApp Deployment Başlatılıyor..."

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] HATA: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] UYARI: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] BİLGİ: $1${NC}"
}

# 1. Sistem Kontrolü
log "Sistem kontrol ediliyor..."
if [[ $EUID -ne 0 ]]; then
   error "Bu script root olarak çalıştırılmalıdır. 'sudo ./deploy.sh' komutunu kullanın."
fi

# 2. Sistem Güncelleme
log "Sistem paketleri güncelleniyor..."
apt update && apt upgrade -y

# 3. Node.js 20.x LTS Kurulumu
log "Node.js 20.x LTS kurulumu..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    info "Node.js zaten kurulu: $NODE_VERSION"
fi

# 4. Gerekli Paketler
log "Gerekli paketler kuruluyor..."
apt install -y git build-essential python3 python3-pip

# 5. Proje Dizini
PROJECT_DIR="/var/www/butcapp"
log "Proje dizini kontrol ediliyor: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    log "Proje dizini oluşturuluyor..."
    mkdir -p $PROJECT_DIR
fi

cd $PROJECT_DIR

# 6. Git Clone veya Update
if [ ! -d ".git" ]; then
    log "Proje GitHub'dan klonlanıyor..."
    git clone https://github.com/ButcApp/ButcApp-demo.git .
else
    log "Proje güncelleniyor..."
    git fetch origin
    git reset --hard origin/master
    git pull origin master
fi

# 7. Node.js Versiyon Kontrolü
NODE_VERSION=$(node --version)
REQUIRED_VERSION="v20"
if [[ $NODE_VERSION != $REQUIRED_VERSION* ]]; then
    warning "Node.js versiyonu uyuşmuyor: $NODE_VERSION (Gerekli: $REQUIRED_VERSION.x)"
fi

# 8. NPM Cache Temizliği ve Kurulum
log "NPM cache temizleniyor ve bağımlılıklar kuruluyor..."
npm cache clean --force
rm -rf node_modules package-lock.json

# Production için bağımlılıkları kur
log "Production bağımlılıkları kuruluyor..."
npm ci --only=production

# Tüm bağımlılıkları kur (build için)
npm install

# 9. Environment Variables
log "Environment variables ayarlanıyor..."
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://butcapp.com
PORT=3000
EOF

# 10. Build İşlemi
log "Next.js build işlemi başlatılıyor..."
npm run build

if [ $? -ne 0 ]; then
    error "Build işlemi başarısız oldu!"
fi

# 11. PM2 Kurulumu
log "PM2 kurulumu ve yapılandırması..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# PM2 ecosystem dosyası
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'butcapp',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/butcapp-error.log',
    out_file: '/var/log/butcapp-out.log',
    log_file: '/var/log/butcapp-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    watch: false,
    ignore_watch: ['node_modules', '.next', '.git'],
    restart_delay: 4000
  }]
};
EOF

# Log dizinleri
mkdir -p /var/log
touch /var/log/butcapp-error.log
touch /var/log/butcapp-out.log
touch /var/log/butcapp-combined.log
chown www-data:www-data /var/log/butcapp*.log

# 12. PM2 Başlatma
log "PM2 ile uygulama başlatılıyor..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 13. Nginx Kurulumu
log "Nginx kurulumu ve yapılandırması..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
fi

# Nginx config
cat > /etc/nginx/sites-available/butcapp << EOF
server {
    listen 80;
    server_name butcapp.com www.butcapp.com;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name butcapp.com www.butcapp.com;

    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/butcapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/butcapp.com/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Site'ı aktif et
ln -sf /etc/nginx/sites-available/butcapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test
nginx -t

if [ $? -ne 0 ]; then
    error "Nginx yapılandırma hatası!"
fi

systemctl restart nginx

# 14. SSL Sertifikası (Let's Encrypt)
log "SSL sertifikası kuruluyor..."
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
fi

# SSL otomatik yenileme
crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -

# 15. Firewall Ayarları
log "Firewall ayarları yapılıyor..."
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw --force enable
else
    warning "UFW bulunamadı. Manuel olarak firewall ayarlarını yapın."
fi

# 16. İzinler
log "Dosya izinleri ayarlanıyor..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 17. Servislerin Durumu
log "Servisler kontrol ediliyor..."
systemctl status nginx --no-pager -l
pm2 status

# 18. Test
log "Uygulama test ediliyor..."
sleep 5

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Next.js uygulaması çalışıyor"
else
    error "❌ Next.js uygulaması çalışmıyor!"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    log "✅ Nginx çalışıyor"
else
    error "❌ Nginx çalışmıyor!"
fi

# 19. Monitor Script'i
log "Monitor script'i oluşturuluyor..."
cat > /home/monitor-butcapp.sh << 'EOF'
#!/bin/bash

# ButcApp monitor script'i
if ! pm2 list | grep -q "butcapp.*online"; then
    echo "$(date): ButcApp çalışmıyor, yeniden başlatılıyor..."
    cd /var/www/butcapp
    pm2 start ecosystem.config.js
fi

if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx çalışmıyor, yeniden başlatılıyor..."
    systemctl restart nginx
fi
EOF

chmod +x /home/monitor-butcapp.sh

# Monitor için cron job
crontab -l | { cat; echo "*/5 * * * * /home/monitor-butcapp.sh >> /var/log/butcapp-monitor.log 2>&1"; } | crontab -

# 20. Update Script'i
log "Update script'i oluşturuluyor..."
cat > /home/update-butcapp.sh << 'EOF'
#!/bin/bash

# ButcApp güncelleme script'i
echo "ButcApp güncellenmeye başlanıyor..."

cd /var/www/butcapp

# Değişiklikleri çek
git pull origin master

# Bağımlılıkları güncelle
npm install

# Build işlemi
npm run build

# PM2 ile uygulamayı yeniden başlat
pm2 restart butcapp

echo "ButcApp başarıyla güncellendi!"
EOF

chmod +x /home/update-butcapp.sh

# 21. Bilgiler
echo ""
log "🎉 DEPLOYMENT BAŞARILI!"
echo ""
info "📋 Önemli Bilgiler:"
echo "   • Uygulama Adresi: https://butcapp.com"
echo "   • Admin Panel: https://butcapp.com/admin"
echo "   • Admin Login: admin@butcapp.com / admin123"
echo "   • PM2 Durumu: pm2 status"
echo "   • PM2 Loglar: pm2 logs butcapp"
echo "   • Nginx Durumu: systemctl status nginx"
echo "   • Update için: /home/update-butcapp.sh"
echo "   • Monitor için: /home/monitor-butcapp.sh"
echo ""
info "🔧 Yönetim Komutları:"
echo "   • Uygulamayı yeniden başlat: pm2 restart butcapp"
echo "   • Uygulamayı durdur: pm2 stop butcapp"
echo "   • Nginx yeniden başlat: systemctl restart nginx"
echo "   • SSL yenileme: certbot renew"
echo ""
warning "⚠️  Unutmayın:"
echo "   • Domain DNS ayarlarını yapmayı unutmayın!"
echo "   • SSL sertifikası almak için domain'in sunucuya yönlendirilmesi gerekir."
echo "   • SSL almak için: certbot --nginx -d butcapp.com -d www.butcapp.com"
echo ""

log "Deployment tamamlandı! ✅"
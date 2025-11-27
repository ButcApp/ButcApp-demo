#!/bin/bash

# ButcApp Production Kurulum Script'i
# Debian/Ubuntu VPS için hazırlanmıştır

set -e

echo "🚀 ButcApp Production Kurulum Başlatılıyor..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[HATA] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[UYARI] $1${NC}"
}

# 1. Sistem Kontrolü
log "Sistem kontrol ediliyor..."

# Root kontrolü
if [[ $EUID -ne 0 ]]; then
   error "Bu script root olarak çalıştırılmalıdır!"
fi

# Debian/Ubuntu kontrolü
if ! command -v apt &> /dev/null; then
    error "Bu script sadece Debian/Ubuntu sistemleri için geçerlidir!"
fi

# 2. Sistem Güncelleme
log "Sistem güncelleniyor..."
apt update && apt upgrade -y

# 3. Gerekli Paketlerin Kurulumu
log "Node.js 20.x LTS kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

log "Diğer gerekli paketler kuruluyor..."
apt install -y git build-essential python3 python3-pip nginx certbot python3-certbot-nginx

# 4. Versiyon Kontrolü
log "Kurulan versiyonlar kontrol ediliyor..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js: $NODE_VERSION"
log "NPM: $NPM_VERSION"

# 5. Proje Dizininin Oluşturulması
log "Proje dizini oluşturuluyor..."
mkdir -p /var/www/butcapp
cd /var/www/butcapp

# 6. GitHub Repoisunun Klonlanması
log "GitHub reposu klonlanıyor..."
if [ -d ".git" ]; then
    log "Repo zaten mevcut, güncelleniyor..."
    git pull origin master
else
    log "Repo klonlanıyor..."
    git clone https://github.com/ButcApp/ButcApp-demo.git .
fi

# 7. Bağımlılıkların Yüklenmesi
log "Bağımlılıklar yükleniyor..."
npm install

# 8. Build İşlemi
log "Production build işlemi başlatılıyor..."
npm run build

# 9. Environment Variables
log "Environment variables oluşturuluyor..."
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://butcapp.com
PORT=3000
EOF

# 10. PM2 Kurulumu
log "PM2 kuruluyor ve yapılandırılıyor..."
npm install -g pm2

# PM2 ecosystem dosyası
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'butcapp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/butcapp',
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

# Log dosyaları oluşturma
mkdir -p /var/log
touch /var/log/butcapp-error.log
touch /var/log/butcapp-out.log
touch /var/log/butcapp-combined.log
chown www-data:www-data /var/log/butcapp*.log
chmod 644 /var/log/butcapp*.log

# PM2 başlatma
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 11. Nginx Yapılandırması
log "Nginx yapılandırılıyor..."

# Nginx config dosyası
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
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Site aktifleştirme
ln -sf /etc/nginx/sites-available/butcapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test
nginx -t

# 12. Firewall Ayarları
log "Firewall ayarları yapılıyor..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# 13. İzin Ayarları
log "Dosya izinleri ayarlanıyor..."
chown -R www-data:www-data /var/www/butcapp
chmod -R 755 /var/www/butcapp

# 14. Servislerin Başlatılması
log "Servisler başlatılıyor..."
systemctl restart nginx
pm2 restart butcapp

# 15. SSL Sertifikası (Domain ayarlarından sonra)
warning "SSL sertifikası için domain'inizin sunucuya yönlendirildiğinden emin olun!"
warning "SSL sertifikası almak için şu komutu çalıştırın:"
warning "certbot --nginx -d butcapp.com -d www.butcapp.com"

# 16. Monitor Script'i
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

# Cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/monitor-butcapp.sh >> /var/log/butcapp-monitor.log 2>&1") | crontab -

# 17. Update Script'i
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

# 18. Bilgiler
log "Kurulum tamamlandı!"
echo ""
echo "🎉 ButcApp başarıyla kuruldu!"
echo ""
echo "📊 Durum Kontrolü:"
echo "  PM2: pm2 status"
echo "  Nginx: systemctl status nginx"
echo "  Loglar: pm2 logs butcapp"
echo ""
echo "🔄 Güncelleme: /home/update-butcapp.sh"
echo "📊 Monitor: /home/monitor-butcapp.sh"
echo ""
echo "🌐 Domain Ayarları:"
echo "  A Record: @ -> SUNUCU_IP"
echo "  A Record: www -> SUNUCU_IP"
echo ""
echo "🔒 SSL Kurulumu:"
echo "  certbot --nginx -d butcapp.com -d www.butcapp.com"
echo ""
echo "✅ Test:"
echo "  curl http://localhost:3000"
echo "  curl -I http://localhost"
echo ""

# Servislerin son durumu
log "Servislerin durumu kontrol ediliyor..."
pm2 status
systemctl status nginx --no-pager -l

echo "🚀 Kurulum tamamlandı! ButcApp artık çalışıyor!"
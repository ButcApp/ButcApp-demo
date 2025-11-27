#!/bin/bash

# ButcApp Production Deployment Script
# Ubuntu VPS için deployment script'i

echo "🚀 ButcApp Production Deployment Başlatılıyor..."

# 1. DEĞİŞKENLER
PROJECT_DIR="/var/www/butcapp"
DOMAIN="your-domain.com"  # DEĞİŞTİR: Kendi domain'inizi girin
DB_USER="username"       # DEĞİŞTİR: PostgreSQL kullanıcı adı
DB_NAME="butcapp_db"     # DEĞİŞTİR: Veritabanı adı
SSL_CERT_PATH="/path/to/your/certificate.crt"    # DEĞİŞTİR
SSL_KEY_PATH="/path/to/your/private.key"        # DEĞİŞTİR

# 2. PROJE KURULUMU
echo "📁 Proje dizini kontrol ediliyor..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Proje dizini bulunamadı: $PROJECT_DIR"
    echo "Lütfen önce projeyi $PROJECT_DIR dizinine kopyalayın"
    exit 1
fi

cd $PROJECT_DIR

# 3. NODE.JS KURULUMU (eğer kurulu değilse)
if ! command -v node &> /dev/null; then
    echo "📦 Node.js kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. PM2 KURULUMU
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 kuruluyor..."
    sudo npm install -g pm2
fi

# 5. POSTGRESQL KURULUMU (eğer kurulu değilse)
if ! command -v psql &> /dev/null; then
    echo "📦 PostgreSQL kuruluyor..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Veritabanı ve kullanıcı oluşturma
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'your_password';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

# 6. NGINX KURULUMU VE YAPILANDIRMA
if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx kuruluyor..."
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo "⚙️ Nginx yapılandırması yapılıyor..."
sudo cp nginx/butcapp.conf /etc/nginx/sites-available/butcapp
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/butcapp
sudo sed -i "s|/path/to/your/certificate.crt|$SSL_CERT_PATH|g" /etc/nginx/sites-available/butcapp
sudo sed -i "s|/path/to/your/private.key|$SSL_KEY_PATH|g" /etc/nginx/sites-available/butcapp

sudo ln -sf /etc/nginx/sites-available/butcapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. LOG KLASÖRLERİNİ OLUŞTUR
echo "📝 Log klasörleri oluşturuluyor..."
sudo mkdir -p /var/log/butcapp
sudo chown -R www-data:www-data /var/log/butcapp

# 8. DEPENDENCIES KURULUMU
echo "📦 Node.js dependencies kuruluyor..."
npm install --production

# 9. VERİTABANI MİGRASYONU
echo "🗄️ Veritabanı migrasyonu yapılıyor..."
PGPASSWORD="your_password" psql -h localhost -U $DB_USER -d $DB_NAME -f migration.sql

# 10. PROJE DERLEME
echo "🔨 Proje derleniyor..."
npm run build

# 11. PM2 BAŞLATMA
echo "🚀 PM2 ile uygulama başlatılıyor..."
pm2 stop butcapp 2>/dev/null || true
pm2 delete butcapp 2>/dev/null || true

# Environment variables'ı güncelle
sed -i "s/username:password@localhost:5432/$DB_USER:your_password@localhost:5432/g" ecosystem.config.js
sed -i "s/butcapp_db/$DB_NAME/g" ecosystem.config.js

pm2 start ecosystem.config.js --env production
pm2 save

# 12. PM2 STARTUP KURULUMU
echo "🔧 PM2 startup ayarlanıyor..."
pm2 startup | sudo bash

# 13. SİSTEM SERVİSLERİ
echo "⚙️ Sistem servisleri ayarlanıyor..."
sudo systemctl enable pm2-root 2>/dev/null || sudo systemctl enable pm2-user 2>/dev/null || true
sudo systemctl start pm2-root 2>/dev/null || sudo systemctl start pm2-user 2>/dev/null || true

# 14. KONTROLLER
echo "🔍 Kontroller yapılıyor..."
echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager -l

echo ""
echo "🌐 Uygulama test ediliyor..."
curl -I http://localhost:3000 || echo "❌ Local test başarısız"

echo ""
echo "✅ Deployment tamamlandı!"
echo ""
echo "📋 SON ADIMLAR:"
echo "1. SSL sertifikalarınızı kurun: certbot --nginx -d $DOMAIN"
echo "2. Domain DNS ayarlarınızı kontrol edin"
echo "3. Environment variables'ı güncelleyin:"
echo "   - Database şifresi"
echo "   - SSL certificate path'leri"
echo "4. Firewall ayarları:"
echo "   sudo ufw allow 22"
echo "   sudo ufw allow 80"
echo "   sudo ufw allow 443"
echo "   sudo ufw enable"
echo ""
echo "🎉 Uygulamanız hazır: https://$DOMAIN"
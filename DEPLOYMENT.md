# ButcApp Production Deployment Guide

## 📋 ÖN GEREKSİNİMLER

### 1. Ubuntu VPS (18.04+)
### 2. Domain adı (örn: butcapp.com)
### 3. SSL Sertifika (Let's Encrypt önerilir)

## 🚀 DEPLOYMENT ADIMLARI

### 1. Projeyi VPS'e Kopyalayın
```bash
# Local'den VPS'e kopyalama
scp -r ./butcapp/* user@your-vps-ip:/var/www/butcapp/

# VPS'e bağlanıp dizin oluşturma
ssh user@your-vps-ip
sudo mkdir -p /var/www/butcapp
sudo chown -R $USER:$USER /var/www/butcapp
```

### 2. Deployment Script'ini Çalıştırın
```bash
cd /var/www/butcapp
./deploy.sh
```

### 3. Manuel Ayarlar (Script sonrası)

#### SSL Sertifika Kurulumu
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Environment Variables Güncelleme
```bash
# ecosystem.config.js dosyasını düzenle
nano /var/www/butcapp/ecosystem.config.js

# .env.local dosyasını düzenle
nano /var/www/butcapp/.env.local
```

#### Firewall Ayarları
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📁 DOSYA YAPISI

```
/var/www/butcapp/
├── src/
│   ├── lib/
│   │   ├── supabase-client.ts    # Client-side auth
│   │   ├── supabase-server.ts    # Server-side auth
│   │   ├── supabase.ts          # General client (no cookies)
│   │   └── db.ts               # PostgreSQL client
│   └── app/api/
│       └── investments/
│           └── route.ts         # API endpoints
├── nginx/
│   └── butcapp.conf            # Nginx config
├── ecosystem.config.js           # PM2 config
├── migration.sql               # Database schema
├── deploy.sh                  # Deployment script
└── .env.local                 # Environment variables
```

## 🔧 KONTROL KOMUTLARI

### PM2
```bash
pm2 status                    # Uygulama durumu
pm2 logs butcapp             # Logları görüntüle
pm2 restart butcapp          # Uygulamayı yeniden başlat
pm2 reload butcapp           # Zero-downtime reload
```

### Nginx
```bash
sudo nginx -t                 # Konfigürasyon test
sudo systemctl reload nginx    # Yeniden yükle
sudo systemctl status nginx    # Durum kontrol
```

### PostgreSQL
```bash
sudo -u postgres psql -c "\l"           # Veritabanı listesi
sudo -u postgres psql -d butcapp_db -c "\dt"  # Tablo listesi
```

## 🐛 TROUBLESHOOTING

### Build Hatası (next/headers)
1. `src/lib/supabase.ts` dosyasında `import { cookies } from 'next/headers'` olmamalı
2. Client component'lar `supabase-client.ts` kullanmalı
3. Server component'lar `supabase-server.ts` kullanmalı

### AuthSessionMissingError
1. Supabase URL ve key'lerin doğru olduğundan emin olun
2. Cookie handling için doğru client'ı kullandığınızdan emin olun
3. Environment variables'ı kontrol edin

### Database Bağlantı Hatası
1. PostgreSQL servisinin çalıştığını kontrol edin
2. DATABASE_URL'in doğru olduğundan emin olun
3. Migration script'inin çalıştığını kontrol edin

### SSL Hatası
1. Sertifika path'lerinin doğru olduğundan emin olun
2. Certbot ile sertifika yenileyin: `sudo certbot renew`

## 🔄 GÜNCELLEME

```bash
cd /var/www/butcapp
git pull origin main
npm install
npm run build
pm2 reload butcapp
```

## 📊 MONITORING

### Logları İzleme
```bash
# Tüm loglar
tail -f /var/log/butcapp/combined.log

# Hata logları
tail -f /var/log/butcapp/error.log

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performans İzleme
```bash
# PM2 monitoring
pm2 monit

# Sistem kaynakları
htop
df -h
free -h
```
# Production Deployment Guide

## 🚀 Sisteminizi Production'a Deploy Etme

### 1. **Cron Job'ların Otomatik Çalışması**

Şu anda sisteminizde 3 adet cron job var:

- **Data Collection**: Her gün 07:00'da veri toplama
- **Gmail Email**: Her gün 08:30'da Gmail üzerinden email gönderimi  
- **Beehiiv Newsletter**: Her gün 09:30'da Beehiiv üzerinden newsletter gönderimi

**Production'da çalışması için gereksinimler:**

#### A) VPS/Cloud Server (Önerilen)
- **DigitalOcean**, **AWS EC2**, **Hetzner**, **Google Cloud** vb.
- 24/7 çalışan server gerekli (Vercel gibi serverless değil!)

#### B) Process Manager
```bash
# PM2 ile production deployment
npm install -g pm2

# Backend'i başlat
pm2 start npm --name "regor-backend" -- start

# Otomatik restart aktif et
pm2 startup
pm2 save
```

#### C) Environment Variables (.env)
Backend klasöründe `.env` dosyası oluşturun:

```env
SUPABASE_URL=https://iydumrdysermgkqkstwg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZHVtcmR5c2VybWdrcWtzdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjU2MDUsImV4cCI6MjA2OTA0MTYwNX0.d0fJvKXXVUda4ZfTCIPZRaH3bvgxn6mMjLQ9HJ-6dp0
BEEHIIV_API_KEY=MlJX5r1ic7hmVpvNidctaWfSpmKjOOLXzvMVGfBiWSyc9SrDiKodVOC4XHZDISz
BEEHIIV_PUBLICATION_ID=fce8c8f0-b6af-4afd-83c1-b7277ade080d
SERPAPI_KEY=990a5f23f0f698d34e3cec80e987bb032271e97d3465969363b334d5bcc2f294
NEWSAPI_KEY=167ccc472c1649e8a822a1c108b00895
OPENAI_API_KEY=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
IPINFO_TOKEN=990a5f23f0f698d34e3cec80e987bb032271e97d3465969363b334d5bcc2f294
OPENWEATHERMAP_KEY=669a4f4d376be3d5fa0c02a081a2665c
PORT=4000
GMAIL_USER=ozdoruk@gmail.com
GMAIL_APP_PASSWORD=recucxgzbixexmmu
```

### 2. **Beehiiv Entegrasyonu Test**

#### Manuel Test Endpoint'leri:
```bash
# Data collection test
curl http://localhost:4000/run-data-collection

# Gmail email sending test  
curl http://localhost:4000/run-email-sending

# 🆕 Beehiiv newsletter test
curl http://localhost:4000/run-beehiiv-newsletter
```

#### Beehiiv'de Subscription'ları Kontrol:
1. Beehiiv dashboard'unuza girin
2. **Audience > Subscribers** bölümüne gidin
3. Yeni kayıt olan kullanıcıları görebilmelisiniz
4. Custom field olarak **city** bilgisini görebilmelisiniz

### 3. **Subscription System Yenilikleri**

#### Eski Sistem:
```javascript
// Sadece Supabase'e kaydediyordu
await supabase.from('users').insert([{ email, city }]);
```

#### Yeni Sistem:
```javascript
// 1. Supabase'e kaydet
await supabase.from('users').insert([{ email, city }]);

// 2. Beehiiv'e de kaydet (YENİ!)
await beehiivAPI.createSubscription(email, city);

// 3. City için veri topla
await fetchAllCityData(city);
```

### 4. **Email Gönderim Seçenekleri**

Artık 2 farklı email sisteminiz var:

#### A) Gmail SMTP (Mevcut)
- **Endpoint**: `/run-email-sending`
- **Zaman**: Her gün 08:30
- **Avantaj**: Tamamen sizin kontrolünüzde
- **Dezavantaj**: Gmail limitleri (500 email/gün)

#### B) Beehiiv Newsletter (YENİ!)
- **Endpoint**: `/run-beehiiv-newsletter` 
- **Zaman**: Her gün 09:30
- **Avantaj**: Professional newsletter, sınırsız gönderim
- **Dezavantaj**: Beehiiv'e bağımlı

### 5. **Production Deployment Adımları**

```bash
# 1. Server'da repository'yi clone edin
git clone <your-repo>
cd Regor

# 2. Dependencies'leri yükleyin
cd backend && npm install
cd ../frontend && npm install

# 3. .env dosyasını oluşturun (yukarıdaki içerikle)
nano backend/.env

# 4. Backend'i production'da başlatın
cd backend
npm run build  # TypeScript compile
pm2 start dist/index.js --name "regor-backend"

# 5. Frontend'i build edin (Vercel/Netlify için)
cd frontend
npm run build
```

### 6. **Monitoring ve Logs**

```bash
# PM2 ile log monitoring
pm2 logs regor-backend

# Status kontrol
pm2 status

# Restart
pm2 restart regor-backend
```

### 7. **Cron Job Zamanlaması**

- **07:00**: Data collection (veri toplama)
- **08:30**: Gmail email sending (30 dakika buffer)
- **09:30**: Beehiiv newsletter sending (30 dakika buffer)

Bu saat sıralaması sayesinde:
1. Önce güncel veri toplanır (07:00)
2. Veri işlenmesi için 1.5 saat buffer
3. Gmail ile hızlı bilgilendirme yapılır (08:30)  
4. Beehiiv ile profesyonel newsletter gönderilir (09:30)

### 8. **Troubleshooting**

#### Beehiiv API Hatası:
```bash
# API key'i kontrol edin
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.beehiiv.com/v2/publications/YOUR_PUB_ID/subscriptions
```

#### Cron Çalışmıyor:
- Server'ın timezone'unu kontrol edin
- PM2 process'inin aktif olduğundan emin olun
- Logs'u kontrol edin

#### Email Gönderilmiyor:
- Gmail app password'ünü kontrol edin
- Supabase'de veri olduğundan emin olun
- Rate limiting'e takılmamış olduğunuzu kontrol edin

### 9. **Beehiiv Dashboard'da Göreceğiniz Veriler**

- **Subscriber count**: Otomatik artan subscriber sayısı
- **Custom fields**: Her subscriber'da city bilgisi
- **Newsletter statistics**: Açılma oranları, tıklama oranları
- **Automated newsletters**: Sistem tarafından otomatik oluşturulan content

---

## 🎯 Özet

✅ **Beehiiv entegrasyonu tamamlandı**  
✅ **Dual email system (Gmail + Beehiiv)**  
✅ **Otomatik subscription (Local + Beehiiv)**  
✅ **Professional newsletter templates**  
✅ **Production deployment guide**

**Test etmek için:**
1. Frontend'de bir subscription yapın
2. Beehiiv dashboard'da subscriber'ı görün
3. `/run-beehiiv-newsletter` endpoint'ini test edin
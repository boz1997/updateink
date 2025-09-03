This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# ENDPOINT FONKSİYONLARI VE SAYFALARI

## 1. TEST EMAIL ENDPOINT
**URL:** http://localhost:4000/test-email?city=Miami
**Dosya:** backend/src/testEmail.ts
**Fonksiyon:** testEmailHandler
**İşlev:** Belirtilen şehir için test email'i oluşturur ve HTML formatında döndürür
**Kullanılan Fonksiyonlar:**
- detectEventCategoryWithAI (backend/src/utils/ai.ts)
- generateSimpleTestTemplate (backend/src/utils/simpleTestTemplate.ts)
- Weather, news, events, sports verilerini çeker

## 2. EMAIL SENDING ENDPOINT
**URL:** http://localhost:4000/run-email-sending
**Dosya:** backend/src/emailSendingScheduler.ts
**Fonksiyon:** runEmailSendingJob()
**İşlev:** Tüm kullanıcılara günlük email gönderir
**Kullanılan Fonksiyonlar:**
- generateEmailHTML (backend/src/emailScheduler.ts)
- getAllUsers()
- getCachedCityData()
- sendEmailToUser()

## 3. DATA COLLECTION ENDPOINT
**URL:** http://localhost:4000/run-data-collection
**Dosya:** backend/src/dataCollectionScheduler.ts
**Fonksiyon:** runDataCollectionJob()
**İşlev:** Tüm şehirler için veri toplar ve cache'e kaydeder
**Kullanılan Fonksiyonlar:**
- getUniqueCities()
- collectAndCacheDataForCity()
- saveCityDataToCache()

## 4. SINGLE CITY DATA COLLECTION ENDPOINT
**URL:** http://localhost:4000/collect-city-data?city=Miami
**Dosya:** backend/src/dataCollectionScheduler.ts
**Fonksiyon:** collectAndCacheDataForCity(city)
**İşlev:** Tek bir şehir için veri toplar ve cache'e kaydeder
**Kullanılan Fonksiyonlar:**
- fetchAllCityData (backend/src/dataFetcher.ts)
- saveCityDataToCache()

## ÖZET
- **Test Email:** testEmail.ts → testEmailHandler
- **Email Sending:** emailSendingScheduler.ts → runEmailSendingJob()
- **Data Collection:** dataCollectionScheduler.ts → runDataCollectionJob()
- **Single City Data:** dataCollectionScheduler.ts → collectAndCacheDataForCity() 

 Ana Template Dosyası: mjmlTemplate.ts
Bu dosyada 12 adet imgbb URL'si var:
Logo ve Sosyal Medya İkonları:
https://i.ibb.co/fVnRyL1g/header-Logo.png - Ana logo
https://i.ibb.co/SDxwQThz/facebook-Icon.png - Facebook ikonu (2 yerde)
https://i.ibb.co/V0Q10sGW/instagram-Icon.png - Instagram ikonu (2 yerde)
https://i.ibb.co/hFR0Qwkx/twitter-Icon.png - Twitter/X ikonu
https://i.ibb.co/3xsnRJy/twitter-x-white.png - Footer'da beyaz Twitter ikonu
Hero ve Section Header'ları:
https://i.ibb.co/4ZV0v9kB/bg-Hero-Banner-2.png - Ana hero background
https://i.ibb.co/ZzD2pXyb/location-Pin.png - Konum pin ikonu
https://i.ibb.co/gFyxNy2P/Header-5.png - "Today's Weather" başlığı
https://i.ibb.co/r2KWmJJ3/Header-1.png - "Today's Brief" başlığı
https://i.ibb.co/0jF7JMV3/Header-2.png - "News" başlığı
https://i.ibb.co/gbxCx6N2/Header-3.png - "Events" başlığı
https://i.ibb.co/qY7FGNLd/Header-4.png - "Sports" başlığı
İçerik İkonları:
https://i.ibb.co/cXNsWnVV/right-arrows-1.png - Today's Brief için ok ikonu
https://i.ibb.co/y9Bjn3y/logo-white.png - Footer'da beyaz logo
📍 Yedek Template: yedek.ts
Bu dosyada da benzer URL'ler var ama bazı farklılıklar:
https://i.ibb.co/MxykqZzd/TopNavBg.png - Farklı hero background
https://i.ibb.co/1f957v4h/Message.png - Membership mesajı için görsel (aktif template'te yorum satırında)
📍 Sponsor Logo'ları (SQL dosyalarında)
Sponsor verilerinde de imgbb URL'leri var:
A1 Roofing: https://i.ibb.co/8Lz0FvWr/A1roofing.png
Blazing Heat HVAC: https://i.ibb.co/rfKQ0bD7/blazing-Heat.png
Go With The Flow Plumbing: https://i.ibb.co/MyxwgSWd/go-With-Flow.png
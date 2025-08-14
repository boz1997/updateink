export interface SimpleTestData {
    city: string;
    date: string;
    weather?: {
      condition: string;
      high: number;
      low: number;
      wind: string;
      current?: {
        temp: number;
        condition: string;
      };
    } | null;
    todaysBrief: Array<{
      title: string;
    }>;
    news: Array<{
      title: string;
      summary: string;
      link?: string;
      headline?: string;
      snippet?: string;
    }>;
    events: Array<{
      title: string;
      time?: string;
      venue?: string;
      category?: string;
      date?: string;
      name?: string;
    }>;
    sports: {
      summary: string;
      readMoreLink?: string;
      schedules?: Array<{
        title: string;
        emoji?: string;
        matches: Array<{
          date: string;
          details: string;
        }>;
      }>;
      matches?: Array<{
        sport: string;
        title: string;
        date: string;
        venue?: string;
        teams?: string;
      }>;
    };
  }
  
  /**
   * Veri testi için basit HTML template'i
   * Sadece verileri madde madde gösterir, hiçbir UI güzelliği yok
   */
  export const generateSimpleTestTemplate = (data: SimpleTestData): string => {
    return `
  <!DOCTYPE html>
  <html lang="tr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VERİ TESTİ - ${data.city}</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background-color: #f5f5f5;
          }
          .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
              color: #333;
              border-bottom: 3px solid #007bff;
              padding-bottom: 10px;
          }
          h2 {
              color: #007bff;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #007bff;
              padding-left: 15px;
          }
          .data-section {
              background: #f8f9fa;
              padding: 20px;
              margin: 15px 0;
              border-radius: 8px;
              border: 1px solid #dee2e6;
          }
          .data-item {
              background: white;
              padding: 10px 15px;
              margin: 8px 0;
              border-radius: 5px;
              border-left: 3px solid #28a745;
          }
          .data-title {
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
          }
          .data-content {
              color: #666;
              font-size: 14px;
          }
          .data-link {
              color: #007bff;
              text-decoration: none;
              font-size: 12px;
          }
          .data-link:hover {
              text-decoration: underline;
          }
          .error {
              background: #f8d7da;
              color: #721c24;
              padding: 10px;
              border-radius: 5px;
              border: 1px solid #f5c6cb;
          }
          .success {
              background: #d4edda;
              color: #155724;
              padding: 10px;
              border-radius: 5px;
              border: 1px solid #c3e6cb;
          }
          .info {
              background: #d1ecf1;
              color: #0c5460;
              padding: 10px;
              border-radius: 5px;
              border: 1px solid #bee5eb;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>🔍 VERİ TESTİ - ${data.city}</h1>
          <div class="info">
              <strong>Test Tarihi:</strong> ${data.date}<br>
              <strong>Şehir:</strong> ${data.city}<br>
              <strong>Template:</strong> Basit Test Template
          </div>
  
          <!-- HAVA DURUMU -->
          <h2>🌤️ HAVA DURUMU VERİLERİ</h2>
          <div class="data-section">
              ${data.weather ? `
                  <div class="data-item">
                      <div class="data-title">Durum:</div>
                      <div class="data-content">${data.weather.condition || 'Veri yok'}</div>
                  </div>
                  <div class="data-item">
                      <div class="data-title">Yüksek Sıcaklık:</div>
                      <div class="data-content">${data.weather.high || 'Veri yok'}°F</div>
                  </div>
                  <div class="data-item">
                      <div class="data-title">Düşük Sıcaklık:</div>
                      <div class="data-content">${data.weather.low || 'Veri yok'}°F</div>
                  </div>
                  <div class="data-item">
                      <div class="data-title">Rüzgar:</div>
                      <div class="data-content">${data.weather.wind || 'Veri yok'}</div>
                  </div>
                  ${data.weather.current ? `
                      <div class="data-item">
                          <div class="data-title">Mevcut Sıcaklık:</div>
                          <div class="data-content">${data.weather.current.temp}°F</div>
                      </div>
                      <div class="data-item">
                          <div class="data-title">Mevcut Durum:</div>
                          <div class="data-content">${data.weather.current.condition}</div>
                      </div>
                  ` : ''}
              ` : `
                  <div class="error">❌ Hava durumu verisi bulunamadı!</div>
              `}
          </div>
  
          <!-- GÜNÜN ÖZETİ -->
          <h2>📋 GÜNÜN ÖZETİ VERİLERİ</h2>
          <div class="data-section">
              ${data.todaysBrief && data.todaysBrief.length > 0 ? `
                  <div class="success">✅ ${data.todaysBrief.length} adet özet bulundu</div>
                  ${data.todaysBrief.map((item, index) => `
                      <div class="data-item">
                          <div class="data-title">Özet ${index + 1}:</div>
                          <div class="data-content">${item.title}</div>
                      </div>
                  `).join('')}
              ` : `
                  <div class="error">❌ Günün özeti verisi bulunamadı!</div>
              `}
          </div>
  
          <!-- HABERLER -->
          <h2>📰 HABER VERİLERİ</h2>
          <div class="data-section">
              ${data.news && data.news.length > 0 ? `
                  <div class="success">✅ ${data.news.length} adet haber bulundu</div>
                  ${data.news.map((item, index) => `
                      <div class="data-item">
                          <div class="data-title">Haber ${index + 1}:</div>
                          <div class="data-content">
                              <strong>Başlık:</strong> ${item.title || item.headline || 'Başlık yok'}<br>
                              <strong>Özet:</strong> ${item.summary || item.snippet || 'Özet yok'}<br>
                              ${item.link ? `<a href="${item.link}" class="data-link" target="_blank">🔗 Linki Aç</a>` : '<span style="color: #dc3545;">❌ Link yok</span>'}
                          </div>
                      </div>
                  `).join('')}
              ` : `
                  <div class="error">❌ Haber verisi bulunamadı!</div>
              `}
          </div>
  
          <!-- ETKİNLİKLER -->
          <h2>🎉 ETKİNLİK VERİLERİ</h2>
          <div class="data-section">
              ${data.events && data.events.length > 0 ? `
                  <div class="success">✅ ${data.events.length} adet etkinlik bulundu</div>
                  ${data.events.map((event, index) => `
                      <div class="data-item">
                          <div class="data-title">Etkinlik ${index + 1}:</div>
                          <div class="data-content">
                              <strong>İsim:</strong> ${event.title || event.name || 'İsim yok'}<br>
                              <strong>Tarih:</strong> ${event.date || event.time || 'Tarih yok'}<br>
                              <strong>Mekan:</strong> ${event.venue || 'Mekan yok'}<br>
                              <strong>Kategori:</strong> ${event.category || 'Kategori yok'}
                          </div>
                      </div>
                  `).join('')}
              ` : `
                  <div class="error">❌ Etkinlik verisi bulunamadı!</div>
              `}
          </div>
  
          <!-- SPOR -->
          <h2>⚽ SPOR VERİLERİ</h2>
          <div class="data-section">
              ${data.sports ? `
                  <div class="data-item">
                      <div class="data-title">Spor Özeti:</div>
                      <div class="data-content">${data.sports.summary || 'Özet yok'}</div>
                  </div>
                  ${data.sports.readMoreLink && data.sports.readMoreLink !== '#' ? `
                      <div class="data-item">
                          <div class="data-title">Devamını Oku Linki:</div>
                          <div class="data-content">
                              <a href="${data.sports.readMoreLink}" class="data-link" target="_blank">🔗 Linki Aç</a>
                          </div>
                      </div>
                  ` : ''}
                  ${data.sports.matches && data.sports.matches.length > 0 ? `
                      <div class="data-item">
                          <div class="data-title">Maç Programları:</div>
                          <div class="data-content">
                              ${data.sports.matches.map(match => `
                                  <strong>${match.sport || '🏆'}:</strong><br>
                                  • ${match.title} - ${match.date}<br>
                                  ${match.venue ? `📍 ${match.venue}<br>` : ''}
                                  ${match.teams ? `🏟️ ${match.teams}<br>` : ''}
                              `).join('')}
                          </div>
                      </div>
                  ` : `
                      <div class="data-item">
                          <div class="data-title">Maç Programları:</div>
                          <div class="data-content">Maç programı verisi yok</div>
                      </div>
                  `}
              ` : `
                  <div class="error">❌ Spor verisi bulunamadı!</div>
              `}
          </div>
  
          <!-- ÖZET -->
          <h2>📊 VERİ ÖZETİ</h2>
          <div class="data-section">
              <div class="data-item">
                  <div class="data-title">Toplam Veri Sayısı:</div>
                  <div class="data-content">
                      • Hava Durumu: ${data.weather ? '✅ Mevcut' : '❌ Yok'}<br>
                      • Günün Özeti: ${data.todaysBrief ? data.todaysBrief.length : 0} adet<br>
                      • Haberler: ${data.news ? data.news.length : 0} adet<br>
                      • Etkinlikler: ${data.events ? data.events.length : 0} adet<br>
                      • Spor: ${data.sports ? '✅ Mevcut' : '❌ Yok'}
                  </div>
              </div>
          </div>
  
          <div class="info" style="margin-top: 30px;">
              <strong>Not:</strong> Bu template sadece veri testi için oluşturulmuştur. 
              Gerçek email template'i için yeni beehiiv template'i kullanılacak.
          </div>
      </div>
  </body>
  </html>
    `.trim();
  };
  
  /**
   * Test için basit post data'sı oluşturur
   */
  export const createSimpleTestPost = (data: SimpleTestData) => {
    const htmlContent = generateSimpleTestTemplate(data);
    
    return {
      title: `🔍 VERİ TESTİ - ${data.city} - ${data.date}`,
      status: 'draft', // Test için draft olarak
      content_blocks: [
        {
          type: 'paragraph',
          content: {
            html: htmlContent
          }
        }
      ]
    };
  }; 
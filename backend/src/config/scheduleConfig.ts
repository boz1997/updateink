/**
 * Basit Schedule Konfigürasyonu
 * Sadece 2 ana işlem: Veri toplama ve Beehiiv gönderimi
 */

export const SCHEDULE_CONFIG = {
  // Veri toplama saati
  DATA_COLLECTION: {
    time: '0 5 * * *',          // 08:00 TR (05:00 UTC)
    timezone: 'UTC',
    description: '08:00 TR - Daily data collection'
  },

  // Beehiiv gönderim saati  
  BEEHIIV_SENDING: {
    time: '10 5 * * *',         // 08:10 TR (05:10 UTC)
    timezone: 'UTC', 
    description: '08:10 TR - Beehiiv newsletter sending'
  }
};

// Kolay değiştirmek için
export const SCHEDULE_TIMES = {
  // Türkiye saati bazında
  TR_08_00: '0 5 * * *',    // 08:00 TR
  TR_08_10: '10 5 * * *',   // 08:10 TR
  TR_09_00: '0 6 * * *',    // 09:00 TR
  TR_09_10: '10 6 * * *',   // 09:10 TR
};

export function getScheduleSummary(): string {
  return `
📅 SCHEDULE CONFIG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 Data Collection: ${SCHEDULE_CONFIG.DATA_COLLECTION.time}
   └─ ${SCHEDULE_CONFIG.DATA_COLLECTION.description}

🔸 Beehiiv Sending: ${SCHEDULE_CONFIG.BEEHIIV_SENDING.time}  
   └─ ${SCHEDULE_CONFIG.BEEHIIV_SENDING.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}

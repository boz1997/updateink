/**
 * Basit Schedule Konfigürasyonu
 * Sadece 2 ana işlem: Veri toplama ve Beehiiv gönderimi
 */

export const SCHEDULE_CONFIG = {
  // Veri toplama saati
  DATA_COLLECTION: {
    time: '0 20 * * *',         // 23:00 TR (20:00 UTC)
    timezone: 'UTC',
    description: '23:00 TR - Daily data collection for next day'
  },

  // Beehiiv gönderim saati  
  BEEHIIV_SENDING: {
    time: '10 21 * * *',        // 00:10 TR (21:10 UTC)
    timezone: 'UTC', 
    description: '00:10 TR - Beehiiv newsletter sending'
  }
};

// Kolay değiştirmek için
export const SCHEDULE_TIMES = {
  // Türkiye saati bazında
  TR_00_10: '10 21 * * *',  // 00:10 TR
  TR_23_00: '0 20 * * *',   // 23:00 TR
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

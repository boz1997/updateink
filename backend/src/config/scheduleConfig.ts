/**
 * Basit Schedule Konfigürasyonu
 * Sadece 2 ana işlem: Veri toplama ve Beehiiv gönderimi
 */

export const SCHEDULE_CONFIG = {
  // Veri toplama saati
  DATA_COLLECTION: {
    time: '0 16 * * *',         // 19:00 TR (16:00 UTC)
    timezone: 'UTC',
    description: '19:00 TR - Daily data collection for next day'
  },

  // Beehiiv gönderim saati  
  BEEHIIV_SENDING: {
    time: '0 5 * * *',          // 08:00 TR (05:00 UTC)
    timezone: 'UTC', 
    description: '08:00 TR - Beehiiv newsletter sending'
  }
};

// Kolay değiştirmek için
export const SCHEDULE_TIMES = {
  // Türkiye saati bazında
  TR_08_00: '0 5 * * *',    // 08:00 TR
  TR_19_00: '0 16 * * *',   // 19:00 TR
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

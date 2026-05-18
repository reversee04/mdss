import { monitorAllDiseases } from '@/services/alert.service';

/**
 * Run outbreak monitoring every hour
 */
export async function runOutbreakMonitor(): Promise<void> {
  console.log('Starting outbreak monitoring...');
  
  try {
    await monitorAllDiseases();
    console.log('Outbreak monitoring completed successfully');
  } catch (error) {
    console.error('Outbreak monitoring failed:', error);
  }
}

// Export for use with cron job scheduler
export default runOutbreakMonitor;
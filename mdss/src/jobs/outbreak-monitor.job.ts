import { monitorAllDiseases } from '@/services/alert.service';

/**
 * Run outbreak monitoring every hour
 */
export async function runOutbreakMonitor() {
  console.log('Starting outbreak monitoring...');
  
  try {
    const results = await monitorAllDiseases();
    console.log(
      `Outbreak monitoring completed successfully. Checked ${results.length}, breaches ${results.filter((result) => result.shouldAlert).length}, created ${results.filter((result) => result.alertCreated).length}.`
    );
    return results;
  } catch (error) {
    console.error('Outbreak monitoring failed:', error);
    throw error;
  }
}

// Export for use with cron job scheduler
export default runOutbreakMonitor;

import cron from 'node-cron';
import runOutbreakMonitor from '@/jobs/outbreak-monitor.job';

// Every hour
cron.schedule('0 * * * *', async () => {
  console.log('Starting outbreak monitor cron...');
  await runOutbreakMonitor();
});
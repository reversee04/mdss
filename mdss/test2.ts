import { prisma } from './src/lib/prisma';
import { getTrendAnalysis } from './src/services/analytics.service';

async function test() {
  const trends = await getTrendAnalysis({
    interval: 'daily',
    startDate: '2026-05-08',
    endDate: '2026-06-07'
  });
  console.log(JSON.stringify(trends, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());

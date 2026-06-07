import { getTrendAnalysis } from './src/services/analytics.service';
import { prisma } from './src/lib/prisma';

async function main() {
  const result = await getTrendAnalysis({
    interval: 'daily',
  });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);

import { prisma } from '../lib/prisma';

async function checkEncounters() {
  console.log('=== ENCOUNTER DATA CHECK ===\n');

  const totalEncounters = await prisma.encounter.count();
  console.log(`Total encounters in database: ${totalEncounters}`);

  if (totalEncounters === 0) {
    console.log('\n❌ NO ENCOUNTERS IN DATABASE');
    console.log('\n⚠️  The alert system needs encounter data to work.');
    console.log('\nTo populate data, you need to:');
    console.log('1. Ensure the hospitalAPI server is running on port 4000');
    console.log('2. Run the ETL sync to pull data from hospitalAPI');
    console.log('3. Or manually seed test data');
  } else {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEncounters = await prisma.encounter.count({
      where: {
        date_of_diagnosis: { gte: thirtyDaysAgo },
      },
    });

    console.log(`Encounters in last 30 days: ${recentEncounters}`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const veryRecentEncounters = await prisma.encounter.count({
      where: {
        date_of_diagnosis: { gte: sevenDaysAgo },
      },
    });

    console.log(`Encounters in last 7 days: ${veryRecentEncounters}`);

    if (veryRecentEncounters === 0) {
      console.log('\n⚠️  No encounters in the last 7 days');
      console.log('The alert system monitors the last 7 days of data.');
      console.log('You may need to run ETL sync or adjust the time window.');
    }

    // Show sample encounters
    const sampleEncounters = await prisma.encounter.findMany({
      take: 5,
      include: {
        disease: {
          select: {
            disease_name: true,
          },
        },
        facility: {
          select: {
            name: true,
            district: true,
          },
        },
      },
      orderBy: { date_of_diagnosis: 'desc' },
    });

    console.log('\nSample encounters:');
    sampleEncounters.forEach(e => {
      console.log(`- ${e.disease.disease_name} at ${e.facility.name} (${e.facility.district}) on ${e.date_of_diagnosis.toISOString()}`);
    });
  }

  console.log('\n=== END CHECK ===');
}

checkEncounters()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });

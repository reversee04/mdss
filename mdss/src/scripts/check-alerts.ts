import { prisma } from '../lib/prisma';

async function checkAlertSystem() {
  console.log('=== ALERT SYSTEM DIAGNOSTIC ===\n');

  // 1. Check disease configuration
  console.log('1. DISEASE CONFIGURATION');
  const diseases = await prisma.disease.findMany({
    select: {
      disease_id: true,
      disease_name: true,
      icd10Code: true,
      outbreak_threshold: true,
      warning_threshold: true,
      monitoring_enabled: true,
      alert_cooldown_hours: true,
      last_alert_sent: true,
    },
  });

  if (diseases.length === 0) {
    console.log('   ❌ No diseases found in database');
  } else {
    console.log(`   Found ${diseases.length} diseases:\n`);
    diseases.forEach(d => {
      console.log(`   - ${d.disease_name} (${d.disease_id})`);
      console.log(`     ICD-10: ${d.icd10Code || 'N/A'}`);
      console.log(`     Monitoring: ${d.monitoring_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`     Outbreak Threshold: ${d.outbreak_threshold || 0} cases/100k`);
      console.log(`     Warning Threshold: ${d.warning_threshold || 0} cases/100k`);
      console.log(`     Cooldown: ${d.alert_cooldown_hours} hours`);
      console.log(`     Last Alert: ${d.last_alert_sent ? d.last_alert_sent.toISOString() : 'Never'}`);
      console.log('');
    });
  }

  // 2. Check for recent encounters (last 7 days)
  console.log('\n2. RECENT ENCOUNTERS (Last 7 Days)');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentEncounters = await prisma.encounter.findMany({
    where: {
      date_of_diagnosis: { gte: sevenDaysAgo },
    },
    include: {
      disease: {
        select: {
          disease_name: true,
          outbreak_threshold: true,
          warning_threshold: true,
          monitoring_enabled: true,
        },
      },
      facility: {
        select: {
          district: true,
          region: true,
        },
      },
    },
    orderBy: { date_of_diagnosis: 'desc' },
  });

  if (recentEncounters.length === 0) {
    console.log('   ❌ No encounters found in the last 7 days');
    console.log('   ⚠️  This is likely why alerts are not triggering - no data to monitor!');
  } else {
    console.log(`   Found ${recentEncounters.length} encounters in the last 7 days\n`);
    
    // Group by disease
    const byDisease: Record<string, any[]> = {};
    recentEncounters.forEach(e => {
      const diseaseName = e.disease.disease_name;
      if (!byDisease[diseaseName]) byDisease[diseaseName] = [];
      byDisease[diseaseName].push(e);
    });

    Object.entries(byDisease).forEach(([diseaseName, encounters]) => {
      const disease = encounters[0].disease;
      console.log(`   - ${diseaseName}: ${encounters.length} cases`);
      console.log(`     Monitoring: ${disease.monitoring_enabled ? '✅' : '❌'}`);
      console.log(`     Outbreak Threshold: ${disease.outbreak_threshold || 0}`);
      console.log(`     Warning Threshold: ${d.warning_threshold || 0}`);
      
      // Group by district
      const byDistrict: Record<string, number> = {};
      encounters.forEach(e => {
        const district = e.facility.district || 'Unknown';
        byDistrict[district] = (byDistrict[district] || 0) + 1;
      });
      
      console.log(`     By District:`);
      Object.entries(byDistrict).forEach(([district, count]) => {
        console.log(`       - ${district}: ${count} cases`);
      });
      console.log('');
    });
  }

  // 3. Check for existing alerts
  console.log('\n3. EXISTING ALERTS');
  const alerts = await prisma.outbreakAlert.findMany({
    include: {
      disease: {
        select: {
          disease_name: true,
        },
      },
    },
    orderBy: { sent_at: 'desc' },
    take: 10,
  });

  if (alerts.length === 0) {
    console.log('   ℹ️  No alerts found in database');
  } else {
    console.log(`   Found ${alerts.length} recent alerts:\n`);
    alerts.forEach(a => {
      console.log(`   - ${a.alert_type.toUpperCase()}: ${a.disease.disease_name}`);
      console.log(`     Severity: ${a.severity}`);
      console.log(`     District: ${a.district || 'National'}`);
      console.log(`     Cases/100k: ${a.cases_per_100k}`);
      console.log(`     Threshold: ${a.threshold_value}`);
      console.log(`     Sent: ${a.sent_at.toISOString()}`);
      console.log(`     Acknowledged: ${a.acknowledged ? '✅' : '❌'}`);
      console.log('');
    });
  }

  // 4. Check facilities and districts
  console.log('\n4. FACILITIES AND DISTRICTS');
  const facilities = await prisma.facility.findMany({
    select: {
      district: true,
      region: true,
    },
    distinct: ['district'],
  });

  console.log(`   Found ${facilities.length} districts:`);
  facilities.forEach(f => {
    console.log(`   - ${f.district} (${f.region})`);
  });

  // 5. Test alert calculation for a specific disease
  console.log('\n5. ALERT CALCULATION TEST');
  if (diseases.length > 0) {
    const testDisease = diseases[0];
    console.log(`   Testing: ${testDisease.disease_name}`);
    console.log(`   Outbreak Threshold: ${testDisease.outbreak_threshold || 0}`);
    console.log(`   Warning Threshold: ${testDisease.warning_threshold || 0}`);
    console.log(`   Monitoring: ${testDisease.monitoring_enabled ? 'Enabled' : 'Disabled'}`);
    
    if (!testDisease.monitoring_enabled) {
      console.log('   ❌ MONITORING IS DISABLED - Alerts will not trigger!');
    }
    
    if (testDisease.outbreak_threshold === 0 && testDisease.warning_threshold === 0) {
      console.log('   ❌ NO THRESHOLDS SET - Alerts will not trigger!');
    }
    
    const diseaseEncounters = recentEncounters.filter(e => e.disease_id === testDisease.disease_id);
    console.log(`   Recent cases (7 days): ${diseaseEncounters.length}`);
    
    if (diseaseEncounters.length === 0) {
      console.log('   ❌ NO RECENT CASES - Nothing to monitor!');
    }
  }

  console.log('\n=== END DIAGNOSTIC ===');
}

checkAlertSystem()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });

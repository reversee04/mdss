import { prisma } from '../lib/prisma';

async function setAlertThresholds() {
  console.log('=== SETTING ALERT THRESHOLDS ===\n');

  // Define thresholds for focused diseases
  const diseaseThresholds = [
    { icd10Code: 'A00', name: 'Cholera', outbreak: 30, warning: 10 },
    { icd10Code: 'B50', name: 'Malaria', outbreak: 100, warning: 50 },
    { icd10Code: 'B20', name: 'HIV/AIDS', outbreak: 30, warning: 15 },
    { icd10Code: 'A15', name: 'Tuberculosis', outbreak: 50, warning: 20 },
  ];

  for (const config of diseaseThresholds) {
    console.log(`Updating ${config.name} (${config.icd10Code})...`);
    
    const result = await prisma.disease.updateMany({
      where: {
        icd10Code: config.icd10Code,
      },
      data: {
        outbreak_threshold: config.outbreak,
        warning_threshold: config.warning,
        monitoring_enabled: true,
        alert_cooldown_hours: 24,
      },
    });

    console.log(`  ✅ Updated ${result.count} disease(s)`);
    console.log(`     Outbreak Threshold: ${config.outbreak} cases/100k`);
    console.log(`     Warning Threshold: ${config.warning} cases/100k`);
    console.log('');
  }

  // Verify the updates
  console.log('\n=== VERIFICATION ===');
  const diseases = await prisma.disease.findMany({
    where: {
      icd10Code: { in: diseaseThresholds.map(d => d.icd10Code) },
    },
    select: {
      disease_name: true,
      icd10Code: true,
      outbreak_threshold: true,
      warning_threshold: true,
      monitoring_enabled: true,
    },
  });

  diseases.forEach(d => {
    console.log(`${d.disease_name} (${d.icd10Code}):`);
    console.log(`  Outbreak: ${d.outbreak_threshold}, Warning: ${d.warning_threshold}`);
    console.log(`  Monitoring: ${d.monitoring_enabled ? 'Enabled' : 'Disabled'}`);
  });

  console.log('\n✅ Thresholds updated successfully');
}

setAlertThresholds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to update thresholds:', error);
    process.exit(1);
  });

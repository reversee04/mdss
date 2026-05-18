import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const diseases = [
    {
      id: "hiv",
      name: "HIV/AIDS",
      description: "Human Immunodeficiency Virus / Acquired Immunodeficiency Syndrome",
      outbreak_threshold: 15,
      warning_threshold: 8,
      alert_recipients: ["hiv-surveillance@health.gov.mw", "director-epidemiology@health.gov.mw"],
    },
    {
      id: "malaria",
      name: "Malaria",
      description: "Mosquito-borne infectious disease caused by Plasmodium parasites",
      outbreak_threshold: 150,
      warning_threshold: 100,
      alert_recipients: ["malaria-control@health.gov.mw", "vector-control@health.gov.mw"],
    },
    {
      id: "tb",
      name: "Tuberculosis",
      description: "Infectious bacterial disease caused by Mycobacterium tuberculosis affecting the lungs",
      outbreak_threshold: 25,
      warning_threshold: 15,
      alert_recipients: ["tb-surveillance@health.gov.mw", "dots-coordinator@health.gov.mw"],
    },
    {
      id: "cholera",
      name: "Cholera",
      description: "Acute diarrheal infection caused by ingestion of food or water contaminated with Vibrio cholerae",
      outbreak_threshold: 5,
      warning_threshold: 2,
      alert_recipients: ["wash-response@health.gov.mw", "cholera-outbreak@health.gov.mw"],
    },
  ];

  console.log("Seeding MDSS with 4 Focused Diseases...");

  // 1. Upsert focused diseases
  for (const d of diseases) {
    await prisma.disease.upsert({
      where: { disease_id: d.id },
      update: {
        disease_name: d.name,
        description: d.description,
        outbreak_threshold: d.outbreak_threshold,
        warning_threshold: d.warning_threshold,
        alert_recipients: d.alert_recipients,
      },
      create: {
        disease_id: d.id,
        disease_name: d.name,
        description: d.description,
        outbreak_threshold: d.outbreak_threshold,
        warning_threshold: d.warning_threshold,
        alert_recipients: d.alert_recipients,
        monitoring_enabled: true,
      },
    });
    console.log(`- Seeded disease: ${d.name} (${d.id})`);
  }

  // 2. Clean up any other diseases not in our focused list
  const allowedIds = diseases.map((d) => d.id);
  const deleteCount = await prisma.disease.deleteMany({
    where: {
      disease_id: {
        notIn: allowedIds,
      },
    },
  });

  if (deleteCount.count > 0) {
    console.log(`- Cleaned up ${deleteCount.count} unsupported disease(s) from database.`);
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

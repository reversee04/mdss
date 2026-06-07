import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test users...");

  const testUsers = [
    {
      user_id: "USR-ADMIN-001",
      name: "Dr. Grace Banda",
      email: "g.banda@health.gov.mw",
      password: "password123",
      role: "admin",
    },
    {
      user_id: "USR-ANALYST-001",
      name: "James Phiri",
      email: "j.phiri@health.gov.mw",
      password: "password123",
      role: "analyst",
    },
    {
      user_id: "USR-EPIDEMIO-001",
      name: "Mary Chirwa",
      email: "m.chirwa@health.gov.mw",
      password: "password123",
      role: "epidemiologist",
    },
    {
      user_id: "USR-MINISTRY-001",
      name: "Hon. Peter Kumwenda",
      email: "p.kumwenda@ministry.gov.mw",
      password: "password123",
      role: "ministry",
    },
  ];

  for (const user of testUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password_hash: passwordHash,
        role: user.role,
        status: "active",
      },
      create: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        password_hash: passwordHash,
        role: user.role,
        status: "active",
      },
    });
    console.log(`- Seeded user: ${user.name} (${user.email}) - Role: ${user.role}`);
  }

  const diseases = [
    {
      icd10Code: "B20",
      name: "HIV/AIDS",
      description: "Human Immunodeficiency Virus / Acquired Immunodeficiency Syndrome",
      outbreak_threshold: 15,
      warning_threshold: 8,
      alert_recipients: ["hiv-surveillance@health.gov.mw", "director-epidemiology@health.gov.mw"],
    },
    {
      icd10Code: "B50",
      name: "Malaria",
      description: "Mosquito-borne infectious disease caused by Plasmodium parasites",
      outbreak_threshold: 150,
      warning_threshold: 100,
      alert_recipients: ["malaria-control@health.gov.mw", "vector-control@health.gov.mw"],
    },
    {
      icd10Code: "A15",
      name: "Tuberculosis",
      description: "Infectious bacterial disease caused by Mycobacterium tuberculosis affecting the lungs",
      outbreak_threshold: 25,
      warning_threshold: 15,
      alert_recipients: ["tb-surveillance@health.gov.mw", "dots-coordinator@health.gov.mw"],
    },
    {
      icd10Code: "A00",
      name: "Cholera",
      description: "Acute diarrheal infection caused by ingestion of food or water contaminated with Vibrio cholerae",
      outbreak_threshold: 5,
      warning_threshold: 2,
      alert_recipients: ["wash-response@health.gov.mw", "cholera-outbreak@health.gov.mw"],
    },
  ];

  console.log("Seeding MDSS focused diseases with ICD-10 codes...");

  for (const disease of diseases) {
    await prisma.disease.upsert({
      where: { icd10Code: disease.icd10Code },
      update: {
        disease_name: disease.name,
        description: disease.description,
        outbreak_threshold: disease.outbreak_threshold,
        warning_threshold: disease.warning_threshold,
        alert_recipients: disease.alert_recipients,
        monitoring_enabled: true,
      },
      create: {
        icd10Code: disease.icd10Code,
        disease_name: disease.name,
        description: disease.description,
        outbreak_threshold: disease.outbreak_threshold,
        warning_threshold: disease.warning_threshold,
        alert_recipients: disease.alert_recipients,
        monitoring_enabled: true,
      },
    });
    console.log(`- Seeded disease: ${disease.name} (ICD: ${disease.icd10Code})`);
  }

  const finalDiseaseCount = await prisma.disease.count({
    where: { icd10Code: { in: diseases.map((disease) => disease.icd10Code) } },
  });
  console.log(`Verified ${finalDiseaseCount} focused diseases are present`);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed test users first
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

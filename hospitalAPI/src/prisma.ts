import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Debug: This will print 'string' or 'undefined' to your terminal when you start
console.log("Password Type:", typeof process.env.DB_PASSWORD);

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  // Force the password to be a string
  password: String(process.env.DB_PASSWORD || ""), 
  port: Number(process.env.DB_PORT) || 5432,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };

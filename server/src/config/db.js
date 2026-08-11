import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function connectDb() {
  try {
    await prisma.$connect();
    console.log("Connected to the database");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}

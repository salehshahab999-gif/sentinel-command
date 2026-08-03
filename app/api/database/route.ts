import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export async function GET() {
  try {
    const targets = await prisma.target.findMany();

    return NextResponse.json({
      status: "Connected",
      database: "CockroachDB",
      targets,
    });

  } catch (error) {
    return NextResponse.json({
      status: "Error",
      message: String(error),
    });
  }
}
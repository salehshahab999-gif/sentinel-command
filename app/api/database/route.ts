import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeDatabaseLog } from "../../../core/database/database-log";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

let databaseWasDown = false;

export async function GET() {
  try {
    const targets = await prisma.target.findMany();

    if (databaseWasDown) {
      await writeDatabaseLog("DATABASE CONNECTION RECOVERED", {
        level: "INFO",
        event: "DATABASE_CONNECTION",
        status: "RECOVERED",
        details: {
          database: "CockroachDB",
          targets: targets.length,
        },
      });

      databaseWasDown = false;
    }

    return NextResponse.json({
      status: "Connected",
      database: "CockroachDB",
      targets,
    });
  } catch (error) {
    if (!databaseWasDown) {
      await writeDatabaseLog("DATABASE CONNECTION DOWN", {
        level: "ERROR",
        event: "DATABASE_CONNECTION",
        status: "DOWN",
        details: {
          database: "CockroachDB",
          error: String(error),
        },
      });

      databaseWasDown = true;
    }

    return NextResponse.json(
      {
        status: "Error",
        message: String(error),
      },
      { status: 500 },
    );
  }
}
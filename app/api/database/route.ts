import { NextResponse } from "next/server";
import { prisma } from "../../../core/database/prisma-client";
import { writeDatabaseLog } from "../../../core/database/database-log";
import { writeApiLog } from "../../../core/api/api-log";

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
          database: "SQLite (Local)",
          targets: targets.length,
        },
      });

      databaseWasDown = false;
    }

    await writeApiLog("GET", "/api/database", "200", {
      level: "INFO",
      event: "API_REQUEST_SUCCESS",
      details: {
        database: "SQLite (Local)",
        targets: targets.length,
      },
    });

    return NextResponse.json({
      status: "Connected",
      database: "SQLite (Local)",
      targets,
    });
  } catch (error) {
    if (!databaseWasDown) {
      await writeDatabaseLog("DATABASE CONNECTION DOWN", {
        level: "ERROR",
        event: "DATABASE_CONNECTION",
        status: "DOWN",
        details: {
          database: "SQLite (Local)",
          error: String(error),
        },
      });

      databaseWasDown = true;
    }

    await writeApiLog("GET", "/api/database", "500", {
      level: "ERROR",
      event: "API_REQUEST_FAILED",
      details: {
        error: String(error),
      },
    });

    return NextResponse.json(
      {
        status: "Error",
        message: String(error),
      },
      { status: 500 },
    );
  }
}
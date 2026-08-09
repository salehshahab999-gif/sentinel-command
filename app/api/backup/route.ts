import { createBackup } from "./backup";
import {
  restoreBackup,
  getLatestBackup,
  getLatestBackupTime,
} from "../../../backup-system/restore/restore";

export async function GET() {
  try {
    const latestBackup = getLatestBackup();
    const latestBackupTime = getLatestBackupTime();

    return Response.json({
      status: "Ready",
      message: "Backup System Ready",
      latestBackup,
      latestBackupTime,
    });
  } catch {
    return Response.json({
      status: "Ready",
      message: "No Backup Found",
      latestBackup: null,
      latestBackupTime: null,
    });
  }
}

export async function POST() {
  const fileName = createBackup();

  return Response.json({
    status: "Success",
    message: "Backup Created",
    file: fileName,
  });
}

export async function PUT() {
  try {
    const latestBackup = getLatestBackup();
    const result = restoreBackup(latestBackup);

    return Response.json({
      status: "Success",
      message: "Backup Verified",
      file: result.file,
      content: result.content,
    });
  } catch (error) {
    return Response.json(
      {
        status: "Error",
        message: String(error),
      },
      { status: 500 },
    );
  }
}

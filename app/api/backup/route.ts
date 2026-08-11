import { createBackup } from "./backup";
import {
  restoreBackup,
  getLatestBackup,
  getLatestBackupTime,
} from "../../../backup-system/restore/restore";
import { writeSecurityLog } from "../../../core/security/security-log";
import { writeApiLog } from "../../../core/api/api-log";

export async function GET() {
  try {
    const latestBackup = getLatestBackup();
    const latestBackupTime = getLatestBackupTime();

    await writeApiLog("GET", "/api/backup", "200", {
      level: "INFO",
      event: "BACKUP_STATUS",
      details: {
        latestBackup,
        latestBackupTime,
      },
    });

    return Response.json({
      status: "Ready",
      message: "Backup System Ready",
      latestBackup,
      latestBackupTime,
    });
  } catch (error) {
    await writeApiLog("GET", "/api/backup", "200", {
      level: "WARN",
      event: "BACKUP_STATUS",
      details: {
        message: "No Backup Found",
        error: String(error),
      },
    });

    return Response.json({
      status: "Ready",
      message: "No Backup Found",
      latestBackup: null,
      latestBackupTime: null,
    });
  }
}

export async function POST() {
  try {
    const fileName = createBackup();

    await writeSecurityLog("CREATE_BACKUP", "system", "SUCCESS", {
      level: "INFO",
      event: "BACKUP_CREATED",
      details: {
        file: fileName,
      },
    });

    await writeApiLog("POST", "/api/backup", "200", {
      level: "INFO",
      event: "BACKUP_CREATED",
      details: {
        file: fileName,
      },
    });

    return Response.json({
      status: "Success",
      message: "Backup Created",
      file: fileName,
    });
  } catch (error) {
    await writeSecurityLog("CREATE_BACKUP", "system", "FAILED", {
      level: "ERROR",
      event: "BACKUP_CREATE_FAILED",
      details: {
        error: String(error),
      },
    });

    await writeApiLog("POST", "/api/backup", "500", {
      level: "ERROR",
      event: "BACKUP_CREATE_FAILED",
      details: {
        error: String(error),
      },
    });

    return Response.json(
      {
        status: "Error",
        message: String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT() {
  try {
    const latestBackup = getLatestBackup();
    const result = restoreBackup(latestBackup);

    await writeSecurityLog("RESTORE_BACKUP", "system", "SUCCESS", {
      level: "INFO",
      event: "BACKUP_RESTORED",
      details: {
        file: result.file,
      },
    });

    await writeApiLog("PUT", "/api/backup", "200", {
      level: "INFO",
      event: "BACKUP_RESTORED",
      details: {
        file: result.file,
      },
    });

    return Response.json({
      status: "Success",
      message: "Backup Verified",
      file: result.file,
      content: result.content,
    });
  } catch (error) {
    await writeSecurityLog("RESTORE_BACKUP", "system", "FAILED", {
      level: "ERROR",
      event: "BACKUP_RESTORE_FAILED",
      details: {
        error: String(error),
      },
    });

    await writeApiLog("PUT", "/api/backup", "500", {
      level: "ERROR",
      event: "BACKUP_RESTORE_FAILED",
      details: {
        error: String(error),
      },
    });

    return Response.json(
      {
        status: "Error",
        message: String(error),
      },
      { status: 500 },
    );
  }
}
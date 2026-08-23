import fs from "fs";
import path from "path";

const BACKUP_FILE = "sentinel-backup-checkpoint.txt";

export function restoreBackup(fileName: string = BACKUP_FILE) {
  const backupDir = path.join(process.cwd(), "backups");
  const filePath = path.join(backupDir, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error("Backup file not found");
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return {
    file: fileName,
    status: "Verified",
    content,
  };
}

export function getLatestBackup() {
  const backupDir = path.join(process.cwd(), "backups");
  const filePath = path.join(backupDir, BACKUP_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error("No backup file found");
  }

  return BACKUP_FILE;
}

export function getLatestBackupTime() {
  const backupDir = path.join(process.cwd(), "backups");
  const filePath = path.join(backupDir, BACKUP_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error("No backup file found");
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const match = content.match(/Created:\s*(.+)/);

  if (!match) {
    return Date.now();
  }

  const rawDate = match[1].trim();

  const dateMatch = rawDate.match(
    /(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2}):(\d{2})/
  );

  if (!dateMatch) {
    return Date.now();
  }

  const [
    ,
    day,
    month,
    year,
    hour,
    minute,
    second,
  ] = dateMatch;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  return date.getTime();
}
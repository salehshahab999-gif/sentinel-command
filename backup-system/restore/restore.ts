import fs from "fs";
import path from "path";

export function restoreBackup(fileName: string) {
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

  if (!fs.existsSync(backupDir)) {
    throw new Error("Backup directory not found");
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith("sentinel-backup-"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error("No backup files found");
  }

  return files[0].file;
}

export function getLatestBackupTime() {
  const backupDir = path.join(process.cwd(), "backups");

  const latestBackup = getLatestBackup();
  const filePath = path.join(backupDir, latestBackup);

  return fs.statSync(filePath).mtime.getTime();
}

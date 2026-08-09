import fs from "fs";
import path from "path";

export function createBackup() {
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fileName = `sentinel-backup-${Date.now()}.txt`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, "Sentinel Backup\nBackup created successfully.");

  return fileName;
}

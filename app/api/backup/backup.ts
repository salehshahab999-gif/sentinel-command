import fs from "fs";
import path from "path";

export function createBackup() {
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fileName = "sentinel-backup-checkpoint.txt";
  const filePath = path.join(backupDir, fileName);

  const createdAt = new Date().toLocaleString("en-GB");

  const content = `Sentinel Command Center
Backup Type: Checkpoint
Created: ${createdAt}
Status: Valid
`;

  fs.writeFileSync(filePath, content, "utf-8");

  return fileName;
}

import { AI_MEMORY, AIMemoryItem } from "./ai-memory";

export interface AIMemoryBackup {
  id: string;
  createdAt: number;
  data: AIMemoryItem[];
}

export const AI_MEMORY_BACKUPS: AIMemoryBackup[] = [];

export function createMemoryBackup(): AIMemoryBackup {
  const backup: AIMemoryBackup = {
    id: `BACKUP-${Date.now()}`,
    createdAt: Date.now(),
    data: [...AI_MEMORY],
  };

  AI_MEMORY_BACKUPS.push(backup);

  return backup;
}

export function restoreMemoryBackup(backupId: string): AIMemoryItem[] | null {
  const backup = AI_MEMORY_BACKUPS.find((item) => item.id === backupId);

  if (!backup) {
    return null;
  }

  return backup.data;
}

export function getMemoryBackups(): AIMemoryBackup[] {
  return AI_MEMORY_BACKUPS;
}

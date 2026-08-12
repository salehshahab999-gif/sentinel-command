export type CollectorStatus =
  | "READY"
  | "RUNNING"
  | "FAILED";

export interface CollectorResult {
  name: string;
  status: CollectorStatus;
  value: unknown;
  timestamp: string;
}
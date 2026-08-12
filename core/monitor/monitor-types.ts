export type MonitorStatus =
  | "ONLINE"
  | "WARNING"
  | "ERROR"
  | "OFFLINE";

export interface MonitorItem {
  name: string;
  status: MonitorStatus;
  message: string;
}
export type AIStatus = "ONLINE" | "OFFLINE" | "MONITORING";

export interface AIRegistryItem {
  id: string;
  name: string;
  status: AIStatus;
}

export const AI_REGISTRY: AIRegistryItem[] = [
  {
    id: "AI-01",
    name: "Analysis Core 01",
    status: "MONITORING",
  },
  {
    id: "AI-02",
    name: "Analysis Core 02",
    status: "MONITORING",
  },
  {
    id: "AI-03",
    name: "Analysis Core 03",
    status: "MONITORING",
  },
  {
    id: "AI-04",
    name: "Analysis Core 04",
    status: "MONITORING",
  },
  {
    id: "AI-05",
    name: "Analysis Core 05",
    status: "MONITORING",
  },
  {
    id: "AI-06",
    name: "Analysis Core 06",
    status: "MONITORING",
  },
  {
    id: "AI-07",
    name: "Analysis Core 07",
    status: "MONITORING",
  },
  {
    id: "AI-08",
    name: "Analysis Core 08",
    status: "MONITORING",
  },
  {
    id: "AI-09",
    name: "Analysis Core 09",
    status: "MONITORING",
  },
  {
    id: "AI-10",
    name: "Analysis Core 10",
    status: "MONITORING",
  },
];

export interface AIConfig {
  mode: "MONITOR_ONLY" | "ACTIVE";
  maxAgents: number;
  allowExternalAI: boolean;
  logging: boolean;
}

export const AI_CONFIG: AIConfig = {
  mode: "MONITOR_ONLY",
  maxAgents: 10,
  allowExternalAI: false,
  logging: true,
};

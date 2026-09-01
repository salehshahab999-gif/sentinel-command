import { spawn } from "node:child_process";
import path from "node:path";

export type WindowsLocationBridgeResult = {
  ok: boolean;
  status: "AVAILABLE" | "ACCESS_DENIED" | "ERROR";
  provider?: string;
  position?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    altitudeMeters: number | null;
    speedMetersPerSecond: number | null;
    headingDegrees: number | null;
    observedAt: string;
  };
  satelliteData?: {
    horizontalDilutionOfPrecision: number | null;
    verticalDilutionOfPrecision: number | null;
    positionDilutionOfPrecision: number | null;
  } | null;
  message?: string;
  error?: string;
};

export type WindowsLocationBridgeOptions = {
  projectPath?: string;
  timeoutMs?: number;
};

export async function probeWindowsLocation(
  options: WindowsLocationBridgeOptions = {},
): Promise<WindowsLocationBridgeResult> {
  const projectPath = path.resolve(
    options.projectPath ?? "tools/windows-location-bridge/WindowsLocationBridge.csproj",
  );
  const timeoutMs = options.timeoutMs ?? 45_000;

  return new Promise((resolve) => {
    const child = spawn(
      "dotnet",
      ["run", "--project", projectPath, "--no-launch-profile"],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: WindowsLocationBridgeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish({
        ok: false,
        status: "ERROR",
        error: "WINDOWS_LOCATION_BRIDGE_TIMEOUT",
        message: `Windows Location bridge exceeded ${timeoutMs}ms.`,
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      finish({
        ok: false,
        status: "ERROR",
        error: error.name,
        message: error.message,
      });
    });

    child.on("close", () => {
      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const lastLine = lines.at(-1);

      if (lastLine) {
        try {
          finish(JSON.parse(lastLine) as WindowsLocationBridgeResult);
          return;
        } catch {
          // Fall through to a structured bridge error.
        }
      }

      finish({
        ok: false,
        status: "ERROR",
        error: "WINDOWS_LOCATION_BRIDGE_NO_JSON",
        message: stderr.trim() || "The Windows Location bridge returned no JSON result.",
      });
    });
  });
}

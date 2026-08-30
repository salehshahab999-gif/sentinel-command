import fs from "node:fs";
import path from "node:path";

import {
  parseRouterLogs,
} from "./router-log-parser";

import {
  normalizeRouterEvents,
} from "./router-log-normalizer";

const logFile =
  path.join(
    process.cwd(),
    "logs",
    "router",
    "asus-syslog.log",
  );

function main() {
  if (!fs.existsSync(logFile)) {
    throw new Error(
      `Router log file not found: ${logFile}`,
    );
  }

  const content =
    fs.readFileSync(
      logFile,
      "utf8",
    );

  const parsed =
    parseRouterLogs(
      content,
    );

  const normalized =
    normalizeRouterEvents(
      parsed,
    );

  console.log(
    "PARSED EVENTS:",
    parsed.length,
  );

  console.log(
    "NORMALIZED EVENTS:",
    normalized.length,
  );

  console.log(
    JSON.stringify(
      normalized,
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(
    "Router log normalizer test failed:",
    error,
  );

  process.exitCode = 1;
}
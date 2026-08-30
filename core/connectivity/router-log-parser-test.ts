import fs from "node:fs";
import path from "node:path";

import {
  filterImportantRouterEvents,
  parseRouterLogs,
} from "./router-log-parser";

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

  const events =
    parseRouterLogs(
      content,
    );

  const important =
    filterImportantRouterEvents(
      events,
    );

  console.log(
    "TOTAL EVENTS:",
    events.length,
  );

  console.log(
    "IMPORTANT EVENTS:",
    important.length,
  );

  console.log(
    "\nFIRST 20 EVENTS:",
  );

  console.log(
    JSON.stringify(
      events.slice(0, 20),
      null,
      2,
    ),
  );

  console.log(
    "\nIMPORTANT EVENTS:",
  );

  console.log(
    JSON.stringify(
      important,
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(
    "Router log parser test failed:",
    error,
  );

  process.exitCode = 1;
}
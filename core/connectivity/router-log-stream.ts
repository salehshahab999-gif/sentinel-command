import fs from "node:fs";
import path from "node:path";

import {
  parseRouterLogLine,
} from "./router-log-parser";

export interface RouterLogStream {
  start(): void;
  stop(): void;
}

const LOG_FILE =
  path.join(
    process.cwd(),
    "logs",
    "router",
    "asus-syslog.log",
  );

const POLL_INTERVAL_MS = 1000;

export function createRouterLogStream(
  onEvent: (
    event: ReturnType<
      typeof parseRouterLogLine
    >,
  ) => void,
): RouterLogStream {
  let running = false;

  let timer:
    | NodeJS.Timeout
    | null = null;

  let position = 0;

  function readNewContent(): void {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }

    const stats =
      fs.statSync(
        LOG_FILE,
      );

    if (
      stats.size < position
    ) {
      position = 0;
    }

    if (
      stats.size === position
    ) {
      return;
    }

    const file =
      fs.openSync(
        LOG_FILE,
        "r",
      );

    try {
      const size =
        stats.size - position;

      const buffer =
        Buffer.alloc(
          size,
        );

      fs.readSync(
        file,
        buffer,
        0,
        size,
        position,
      );

      position =
        stats.size;

      const content =
        buffer.toString(
          "utf8",
        );

      for (
        const line of content.split(
          /\r?\n/,
        )
      ) {
        const trimmed =
          line.trim();

        if (
          trimmed.length === 0
        ) {
          continue;
        }

        onEvent(
          parseRouterLogLine(
            trimmed,
          ),
        );
      }
    } finally {
      fs.closeSync(
        file,
      );
    }
  }

  return {
    start(): void {
      if (running) {
        return;
      }

      running = true;

      if (
        fs.existsSync(
          LOG_FILE,
        )
      ) {
        position =
          fs.statSync(
            LOG_FILE,
          ).size;
      }

      timer =
        setInterval(
          readNewContent,
          POLL_INTERVAL_MS,
        );

      readNewContent();
    },

    stop(): void {
      running = false;

      if (
        timer !== null
      ) {
        clearInterval(
          timer,
        );

        timer = null;
      }
    },
  };
}
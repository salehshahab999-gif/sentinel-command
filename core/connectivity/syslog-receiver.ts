import dgram from "node:dgram";
import fs from "node:fs";
import path from "node:path";

const HOST = "192.168.1.3";
const PORT = 514;

const LOG_DIR =
  path.join(process.cwd(), "logs", "router");

const LOG_FILE =
  path.join(
    LOG_DIR,
    "asus-syslog.log",
  );

export interface SyslogReceiver {
  start(): Promise<void>;
  stop(): Promise<void>;
}

function ensureLogDirectory(): void {
  fs.mkdirSync(
    LOG_DIR,
    {
      recursive: true,
    },
  );
}

function appendLog(
  message: string,
  address: string,
): void {
  ensureLogDirectory();

  const timestamp =
    new Date().toISOString();

  const line =
    `[${timestamp}] [${address}] ${message}\n`;

  fs.appendFileSync(
    LOG_FILE,
    line,
    "utf8",
  );
}

export function createSyslogReceiver():
  SyslogReceiver {
  const socket =
    dgram.createSocket("udp4");

  let started = false;

  return {
    start(): Promise<void> {
      return new Promise(
        (resolve, reject) => {
          const onError =
            (error: Error) => {
              socket.off(
                "listening",
                onListening,
              );

              reject(error);
            };

          const onListening =
            () => {
              started = true;

              socket.off(
                "error",
                onError,
              );

              const address =
                socket.address();

              console.log(
                `Syslog receiver listening on ${address.address}:${address.port}/UDP`,
              );

              resolve();
            };

          socket.once(
            "error",
            onError,
          );

          socket.once(
            "listening",
            onListening,
          );

          socket.on(
            "message",
            (message, remote) => {
              appendLog(
                message.toString(
                  "utf8",
                ),
                remote.address,
              );

              console.log(
                `[SYSLOG] ${remote.address}: ${message.toString("utf8")}`,
              );
            },
          );

          ensureLogDirectory();

          socket.bind(
            PORT,
            HOST,
          );
        },
      );
    },

    stop(): Promise<void> {
      if (!started) {
        return Promise.resolve();
      }

      return new Promise(
        (resolve) => {
          socket.close(
            () => {
              started = false;
              resolve();
            },
          );
        },
      );
    },
  };
}
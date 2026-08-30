import {
  createSyslogReceiver,
} from "./core/connectivity/syslog-receiver";

async function main() {
  const receiver =
    createSyslogReceiver();

  await receiver.start();

  console.log(
    "Sentinel Syslog Receiver is running.",
  );

  console.log(
    "Listening on 192.168.1.3:514/UDP",
  );

  console.log(
    "Press Ctrl+C to stop.",
  );

  const shutdown =
    async () => {
      console.log(
        "\nStopping Syslog Receiver...",
      );

      await receiver.stop();

      process.exit(0);
    };

  process.once(
    "SIGINT",
    shutdown,
  );

  process.once(
    "SIGTERM",
    shutdown,
  );
}

main().catch(
  (error) => {
    console.error(
      "Syslog Receiver failed:",
      error,
    );

    process.exitCode = 1;
  },
);
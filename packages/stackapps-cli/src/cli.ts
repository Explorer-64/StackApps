#!/usr/bin/env node
import { DEFAULT_PUBLIC_SCAN_URL, postPublicScan } from "./scanClient.js";

function printHelp() {
  console.log(`stackapps — StackApps from the terminal

Usage:
  stackapps scan <https://your.app>   Run the public twelve-check readiness scan
  stackapps help                      Show this message

Environment:
  STACKAPPS_PUBLIC_SCAN_URL   Public scan HTTP endpoint (POST JSON { "url" }).
  Default: ${DEFAULT_PUBLIC_SCAN_URL}
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    process.exit(0);
  }

  if (cmd === "scan") {
    const url = argv[1];
    if (!url || !url.startsWith("http")) {
      console.error("Error: pass a full URL, e.g. stackapps scan https://example.com");
      process.exit(2);
    }
    const out = await postPublicScan(url);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}. Try: stackapps help`);
  process.exit(2);
}

main().catch((e: unknown) => {
  if (e instanceof Error) {
    console.error(e.message);
    const body = (e as Error & { body?: unknown }).body;
    if (body !== undefined) console.error(JSON.stringify(body, null, 2));
  } else {
    console.error(String(e));
  }
  process.exit(1);
});

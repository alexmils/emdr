import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const skipClean =
  process.env.SKIP_CLEAN === "1" || args.includes("--fast");
const useWebpack =
  process.env.DEV_WEBPACK === "1" || args.includes("--webpack");

function cleanNext() {
  try {
    rmSync(join(root, ".next"), { recursive: true, force: true });
    console.log("[dev] Cleared .next cache.");
  } catch {
    /* ok */
  }
}

if (!skipClean) {
  cleanNext();
}

let restarts = 0;

function launch() {
  const turboFlag = useWebpack ? "" : " --turbo";
  const cmd = `npx next dev${turboFlag} -p 3471`;

  console.log(
    `[dev] Starting (${useWebpack ? "webpack" : "turbopack"}) on http://localhost:3471`
  );

  const child = spawn(cmd, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      WATCHPACK_POLLING: "true",
      __NEXT_DEVTOOL_SEGMENT_EXPLORER: "false",
    },
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null && restarts < 1) {
      restarts += 1;
      console.log("\n[dev] Server exited — clearing cache and restarting once…");
      cleanNext();
      launch();
      return;
    }
    process.exit(code ?? 0);
  });
}

launch();

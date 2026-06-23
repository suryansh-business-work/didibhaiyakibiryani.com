#!/usr/bin/env node
/**
 * Frees the local dev ports (3000–3004) before `npm run all` boots the stack,
 * so a stale process from a previous run can't hold a port. Cross-platform
 * (Windows via netstat/taskkill, macOS/Linux via lsof). Runs as the first step
 * of `npm run all`; also exposed as `npm run kill:ports`.
 */
import { execSync } from "node:child_process";

const PORTS = [3000, 3001, 3002, 3003, 3004];
const isWindows = process.platform === "win32";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return ""; // nothing listening, or the lookup tool is unavailable
  }
}

/** Map of port -> Set of PIDs currently bound to it. */
function pidsByPort() {
  const map = new Map(PORTS.map((p) => [p, new Set()]));
  if (isWindows) {
    for (const line of run("netstat -ano -p tcp").split("\n")) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 5) continue;
      const pid = cols[cols.length - 1];
      if (!/^\d+$/.test(pid) || pid === "0") continue;
      for (const port of PORTS) {
        if (cols[1].endsWith(`:${port}`)) map.get(port).add(pid);
      }
    }
    return map;
  }
  for (const port of PORTS) {
    for (const pid of run(`lsof -ti tcp:${port}`).split("\n")) {
      const trimmed = pid.trim();
      if (trimmed) map.get(port).add(trimmed);
    }
  }
  return map;
}

function kill(pid) {
  if (isWindows) {
    run(`taskkill /F /PID ${pid}`);
    return;
  }
  try {
    process.kill(Number(pid), "SIGKILL");
  } catch {
    /* already gone */
  }
}

let freed = 0;
for (const [port, pids] of pidsByPort()) {
  for (const pid of pids) {
    kill(pid);
    freed += 1;
    console.log(`  ✓ freed port ${port} (killed PID ${pid})`);
  }
}
console.log(freed ? `\u{1F9F9} Freed ${freed} stale process(es).` : `✓ Ports ${PORTS.join(", ")} already free.`);

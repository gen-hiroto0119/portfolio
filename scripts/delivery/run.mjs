import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:net";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = join(projectRoot, "test-output", "delivery");
const copyEntries = [
  "app",
  "components",
  "lib",
  "public",
  "tests/delivery",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.js",
  "eslint.config.mjs",
];
const copyExclusions = new Set([".git", ".next", ".vercel", "node_modules"]);
const maxCapturedCharacters = 2_000_000;
const buildTimeoutMs = 8 * 60 * 1000;
const driverTimeoutMs = 4 * 60 * 1000;
const serverReadyTimeoutMs = 60 * 1000;
const activeChildren = new Set();
let interrupted = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    interrupted = true;
    for (const child of activeChildren) void stopChild(child);
  });
}

function appendTail(current, chunk) {
  const combined = current + chunk.toString("utf8");
  return combined.length > maxCapturedCharacters
    ? combined.slice(-maxCapturedCharacters)
    : combined;
}

function launch(command, args, { cwd, env }) {
  const child = spawn(command, args, {
    cwd,
    detached: process.platform !== "win32",
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const record = {
    child,
    stdout: "",
    stderr: "",
    exit: null,
    spawnError: null,
    stopPromise: null,
    timedOut: false,
  };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    record.stdout = appendTail(record.stdout, chunk);
  });
  child.stderr.on("data", (chunk) => {
    record.stderr = appendTail(record.stderr, chunk);
  });
  child.once("error", (error) => {
    record.spawnError = error;
  });
  record.closed = new Promise((resolveExit) => {
    child.once("close", (code, signal) => {
      record.exit = { code, signal };
      activeChildren.delete(record);
      resolveExit(record.exit);
    });
  });
  activeChildren.add(record);
  return record;
}

function signalChild(record, signal) {
  if (!record || record.exit) return;
  try {
    if (process.platform === "win32") {
      record.child.kill(signal);
    } else if (record.child.pid) {
      process.kill(-record.child.pid, signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function waitForExit(record, timeoutMs) {
  if (record.exit) return true;
  let timeout;
  const exited = await Promise.race([
    record.closed.then(() => true),
    new Promise((resolveTimeout) => {
      timeout = setTimeout(() => resolveTimeout(false), timeoutMs);
    }),
  ]);
  clearTimeout(timeout);
  return exited;
}

async function stopChild(record) {
  if (!record || record.exit) return;
  if (record.stopPromise) return record.stopPromise;
  record.stopPromise = (async () => {
    signalChild(record, "SIGTERM");
    if (!await waitForExit(record, 3000)) {
      signalChild(record, "SIGKILL");
      await record.closed;
    }
  })();
  return record.stopPromise;
}

async function runCommand(label, command, args, options, timeoutMs) {
  const record = launch(command, args, options);
  const timer = setTimeout(() => {
    record.timedOut = true;
    void stopChild(record);
  }, timeoutMs);
  await record.closed;
  clearTimeout(timer);
  if (record.spawnError) throw new Error(`${label} could not start: ${record.spawnError.message}`);
  return record;
}

function requireSuccess(label, record) {
  if (record.timedOut) throw new Error(`${label} timed out`);
  if (record.exit?.code !== 0) {
    const status = record.exit?.signal
      ? `signal ${record.exit.signal}`
      : `exit code ${record.exit?.code}`;
    throw new Error(`${label} failed with ${status}`);
  }
}

async function copyProject(workDir) {
  const filter = (source) => {
    const rel = relative(projectRoot, source);
    if (!rel) return true;
    return !rel.split(sep).some((segment) => (
      copyExclusions.has(segment)
      || segment.startsWith(".env")
      || segment.endsWith(".tsbuildinfo")
    ));
  };

  for (const entry of copyEntries) {
    await cp(join(projectRoot, entry), join(workDir, entry), {
      filter,
      recursive: true,
    });
  }
}

async function allocatePort() {
  const server = createServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a loopback port");
  const { port } = address;
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
  return port;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitForReady(record, baseUrl) {
  const deadline = Date.now() + serverReadyTimeoutMs;
  let lastFailure = "server did not respond";

  while (Date.now() < deadline && !interrupted) {
    if (record.exit) throw new Error("Local Next.js server exited before readiness");
    try {
      const response = await fetch(`${baseUrl}/api/notion/revalidate`, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(1500),
      });
      await response.body?.cancel();
      if (response.status === 401) return;
      lastFailure = `readiness returned HTTP ${response.status}`;
    } catch {
      lastFailure = "server is not accepting local requests";
    }
    await delay(150);
  }

  throw new Error(`Local Next.js server readiness timed out: ${lastFailure}`);
}

function redact(value, secrets) {
  let output = value;
  for (const secret of secrets) {
    if (secret) output = output.replaceAll(secret, "[REDACTED]");
  }
  return output;
}

async function preserveFailureLogs(outputDir, logs, error, secrets) {
  const path = join(outputDir, `failure-${Date.now()}-${process.pid}`);
  await mkdir(path, { recursive: true });
  const files = {
    "build.log": logs.build,
    "server.log": logs.server,
    "delivery.log": logs.driver,
    "runner.log": error?.stack ?? String(error),
  };
  for (const [name, contents] of Object.entries(files)) {
    if (contents) await writeFile(join(path, name), redact(contents, secrets), "utf8");
  }
  return path;
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 24) {
    throw new Error("Delivery tests require Node.js 24 or later");
  }

  const port = await allocatePort();
  await mkdir(outputRoot, { recursive: true });
  const workDir = await mkdtemp(join(tmpdir(), "portfolio-delivery-"));
  const fixtureDir = join(workDir, ".delivery");
  const fixturePath = join(fixtureDir, "snapshot.json");
  const readsPath = join(fixtureDir, "blob-reads.ndjson");
  const npmUserConfig = join(workDir, ".npm-user-config");
  const npmGlobalConfig = join(workDir, ".npm-global-config");
  const blobToken = `vercel_blob_rw_ci_${randomBytes(32).toString("hex")}`;
  const syncSecret = randomBytes(32).toString("hex");
  const baseUrl = `http://127.0.0.1:${port}`;
  const safeEnv = {
    PATH: process.env.PATH ?? "",
    HOME: workDir,
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    TMP: process.env.TMPDIR ?? tmpdir(),
    TEMP: process.env.TMPDIR ?? tmpdir(),
    CI: "true",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SITE_URL: baseUrl,
    ISR_BASE_URL: baseUrl,
    BLOB_READ_WRITE_TOKEN: blobToken,
    BLOG_SYNC_ENABLED: "true",
    BLOG_SYNC_SECRET: syncSecret,
    ISR_TEST_SECRET: syncSecret,
    ISR_TEST_ROOT: workDir,
    ISR_FIXTURE_PATH: fixturePath,
    ISR_READS_PATH: readsPath,
  };
  const installEnv = {
    PATH: process.env.PATH ?? "",
    HOME: workDir,
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    TMP: process.env.TMPDIR ?? tmpdir(),
    TEMP: process.env.TEMP ?? tmpdir(),
    CI: "true",
    npm_config_cache: join(homedir(), ".npm"),
    npm_config_globalconfig: npmGlobalConfig,
    npm_config_userconfig: npmUserConfig,
  };
  const secrets = [blobToken, syncSecret];
  const logs = { build: "", server: "", driver: "" };
  const driverPath = join(workDir, "tests/delivery/driver.mjs");
  const preloadPath = join(workDir, "tests/delivery/preload.mjs");
  const nextPath = join(workDir, "node_modules/next/dist/bin/next");
  const preloadOptions = `--import=${pathToFileURL(preloadPath).href}`;
  const isolatedEnv = { ...safeEnv, NODE_OPTIONS: preloadOptions };
  let serverRecord;
  let failure;

  try {
    await copyProject(workDir);
    await mkdir(fixtureDir, { recursive: true });
    await Promise.all([
      writeFile(npmUserConfig, "", "utf8"),
      writeFile(npmGlobalConfig, "", "utf8"),
    ]);

    const install = await runCommand(
      "Isolated npm ci",
      "npm",
      ["ci", "--no-audit", "--no-fund"],
      { cwd: workDir, env: installEnv },
      5 * 60 * 1000,
    );
    logs.build = `${install.stdout}${install.stderr}`;
    if (install.stdout) process.stdout.write(install.stdout);
    if (install.stderr) process.stderr.write(install.stderr);
    requireSuccess("Isolated npm ci", install);

    const seeded = await runCommand(
      "Fixture seed",
      process.execPath,
      [driverPath, "--seed"],
      { cwd: workDir, env: safeEnv },
      30_000,
    );
    requireSuccess("Fixture seed", seeded);

    const build = await runCommand(
      "Production build",
      process.execPath,
      [nextPath, "build"],
      { cwd: workDir, env: isolatedEnv },
      buildTimeoutMs,
    );
    logs.build += `${build.stdout}${build.stderr}`;
    requireSuccess("Production build", build);
    console.log("Production build passed in isolated workcopy.");

    serverRecord = launch(
      process.execPath,
      [nextPath, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      { cwd: workDir, env: isolatedEnv },
    );

    await waitForReady(serverRecord, baseUrl);

    const driver = await runCommand(
      "HTTP delivery lifecycle",
      process.execPath,
      [driverPath],
      { cwd: workDir, env: safeEnv },
      driverTimeoutMs,
    );
    logs.driver = `${driver.stdout}${driver.stderr}`;
    if (driver.stdout) process.stdout.write(driver.stdout);
    if (driver.stderr) process.stderr.write(driver.stderr);
    requireSuccess("HTTP delivery lifecycle", driver);
  } catch (error) {
    failure = error;
  } finally {
    if (serverRecord) {
      try {
        await stopChild(serverRecord);
      } catch (error) {
        failure ??= error;
      }
      logs.server = `${serverRecord.stdout}${serverRecord.stderr}`;
    }
    if (failure) {
      try {
        const logPath = await preserveFailureLogs(outputRoot, logs, failure, secrets);
        console.error(`Sanitized delivery diagnostics saved under ${relative(projectRoot, logPath)}.`);
      } catch (error) {
        console.error(`Could not preserve delivery diagnostics: ${error.message}`);
      }
    }
    try {
      await rm(workDir, { force: true, recursive: true });
    } catch (error) {
      failure ??= error;
    }
  }

  if (failure) {
    console.error(`Delivery test failed: ${redact(failure.stack ?? String(failure), secrets)}`);
    process.exitCode = 1;
  } else {
    console.log("Isolated HTTP delivery lifecycle passed.");
  }
}

main().catch((error) => {
  console.error(`Delivery runner failed: ${error.stack ?? error}`);
  process.exitCode = 1;
});

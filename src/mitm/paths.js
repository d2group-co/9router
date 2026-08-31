const fs = require("fs");
const path = require("path");
const os = require("os");

const APP_NAME = "9router";
const IS_VERCEL = process.env.VERCEL === "1";

function defaultDir() {
  // Vercel Functions only expose writable temporary storage under /tmp.
  // MITM artifacts are temporary runtime data and must never fall back to HOME.
  if (IS_VERCEL) return path.join("/tmp", APP_NAME);

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_NAME);
  }
  return path.join(os.homedir(), `.${APP_NAME}`);
}

function getDataDir() {
  const configured = process.env.DATA_DIR;

  // Keep the CommonJS MITM path resolver aligned with src/lib/dataDir.js.
  // A host/container DATA_DIR is not portable to Vercel serverless functions.
  if (IS_VERCEL) {
    if (configured && !configured.startsWith("/tmp/")) {
      console.warn(`[DATA_DIR] Ignoring non-/tmp DATA_DIR '${configured}' on Vercel`);
    }
    const dir = configured?.startsWith("/tmp/") ? configured : defaultDir();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  if (!configured) return defaultDir();

  if (process.platform === "win32" && /^\//.test(configured)) {
    console.warn(`[DATA_DIR] '${configured}' is a Unix path on Windows → fallback to default`);
    return defaultDir();
  }

  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    if (e?.code === "EACCES" || e?.code === "EPERM") {
      console.warn(`[DATA_DIR] '${configured}' not writable → fallback ~/.${APP_NAME}`);
      return defaultDir();
    }
    throw e;
  }
}

const DATA_DIR = getDataDir();
const MITM_DIR = path.join(DATA_DIR, "mitm");

module.exports = { DATA_DIR, MITM_DIR };

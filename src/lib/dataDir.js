import fs from "node:fs";
import path from "path";
import os from "os";

const APP_NAME = "9router";
const IS_VERCEL = process.env.VERCEL === "1";

function defaultDir() {
  // Vercel Functions only expose writable temporary storage under /tmp. This
  // keeps the app runtime from failing with EROFS, but /tmp is ephemeral and
  // must not be treated as durable production persistence.
  if (IS_VERCEL) return path.join("/tmp", APP_NAME);

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_NAME);
  }
  return path.join(os.homedir(), `.${APP_NAME}`);
}

export function getDataDir() {
  const configured = process.env.DATA_DIR;

  // DATA_DIR paths from a persistent host/container are not portable to Vercel.
  // Always keep file-backed runtime state inside the platform's writable temp area.
  if (IS_VERCEL) {
    if (configured && !configured.startsWith("/tmp/")) {
      console.warn(`[DATA_DIR] Ignoring non-/tmp DATA_DIR '${configured}' on Vercel`);
    }
    const dir = configured?.startsWith("/tmp/") ? configured : defaultDir();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  if (!configured) return defaultDir();

  // On Windows, ignore Unix-style absolute paths (e.g. /var/lib/...) that come
  // from a Linux-targeted environment file — they are not valid here.
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

export const DATA_DIR = getDataDir();

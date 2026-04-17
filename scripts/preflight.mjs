#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const envExamplePath = path.join(root, ".env.example");
const envPath = path.join(root, ".env");

const REQUIRED_SCRIPTS = ["dev", "test", "prisma:migrate", "prisma:seed"];
const REQUIRED_ENV_VARS = ["DATABASE_URL", "UPLOAD_DIR"];

let failures = 0;
let warnings = 0;

const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => {
  warnings += 1;
  console.log(`⚠️  ${msg}`);
};
const fail = (msg) => {
  failures += 1;
  console.log(`❌ ${msg}`);
};

function safeExec(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
  } catch {
    return null;
  }
}

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const rows = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const values = {};
  for (const row of rows) {
    const clean = row.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;
    const idx = clean.indexOf("=");
    const key = clean.slice(0, idx).trim();
    const value = clean.slice(idx + 1).trim().replace(/^"|"$/g, "");
    values[key] = value;
  }
  return values;
}

console.log("\nFood Forest Forge preflight\n");

if (!fs.existsSync(pkgPath)) {
  fail("package.json not found at repo root.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Node version check
const major = Number(process.versions.node.split(".")[0]);
if (major >= 18) {
  ok(`Node.js version ${process.versions.node} detected (>=18).`);
} else {
  fail(`Node.js version ${process.versions.node} detected; Node 18+ is required.`);
}

// npm registry diagnostics
const registry = safeExec("npm config get registry");
if (!registry) {
  warn("Unable to read npm registry via `npm config get registry`.");
} else if (registry.includes("registry.npmjs.org")) {
  ok(`npm registry is ${registry}`);
} else {
  warn(`npm registry is ${registry} (non-default). If installs fail with 403, switch to https://registry.npmjs.org/.`);
}

const proxy = safeExec("npm config get proxy");
const httpsProxy = safeExec("npm config get https-proxy");
if (proxy && proxy !== "null") warn(`npm proxy is set to ${proxy}`);
if (httpsProxy && httpsProxy !== "null") warn(`npm https-proxy is set to ${httpsProxy}`);

// lockfile check

const lockFiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"].filter((f) => fs.existsSync(path.join(root, f)));
if (lockFiles.length > 0) {
  ok(`Lockfile detected: ${lockFiles.join(", ")}`);
} else {
  warn("No lockfile detected. Consider committing package-lock.json for reproducible installs.");
}

// script presence
const scripts = pkg.scripts ?? {};
for (const scriptName of REQUIRED_SCRIPTS) {
  if (scripts[scriptName]) {
    ok(`npm script present: ${scriptName}`);
  } else {
    fail(`Missing npm script: ${scriptName}`);
  }
}

if (pkg.prisma?.seed) {
  ok(`Prisma seed command configured: ${pkg.prisma.seed}`);
} else {
  fail("Missing `prisma.seed` configuration in package.json.");
}

// env checks
if (!fs.existsSync(envExamplePath)) {
  fail(".env.example is missing.");
}

const envVals = { ...parseDotEnv(envExamplePath), ...parseDotEnv(envPath), ...process.env };
for (const key of REQUIRED_ENV_VARS) {
  if (envVals[key]) {
    ok(`Environment variable available: ${key}`);
  } else {
    fail(`Missing required env var: ${key}. Add it in .env (copy from .env.example).`);
  }
}

// prisma schema check
if (fs.existsSync(path.join(root, "prisma", "schema.prisma"))) {
  ok("Prisma schema detected at prisma/schema.prisma");
} else {
  fail("Missing prisma/schema.prisma");
}

console.log("\nSummary:");
console.log(`- Failures: ${failures}`);
console.log(`- Warnings: ${warnings}`);

if (failures > 0) {
  console.log("\nPreflight failed. Fix failures above before running install/migrate/dev.");
  process.exit(1);
}

console.log("\nPreflight passed.");

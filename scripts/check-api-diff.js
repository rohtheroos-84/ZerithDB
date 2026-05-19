#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function getChangedPackages(baseRef = 'main') {
  try { execSync(`git fetch origin ${baseRef}`, { stdio: 'ignore' }); } catch (e) {}
  const diff = run(`git diff --name-only origin/${baseRef}..HEAD`).split(/\r?\n/).filter(Boolean);
  const pkgChanges = new Set();
  for (const f of diff) {
    const m = f.match(/^packages\/([^\/]+)\//);
    if (m) pkgChanges.add(m[1]);
    if (f.startsWith('packages/')) pkgChanges.add(f.split('/')[1]);
  }
  return Array.from(pkgChanges);
}

function getPublishablePackages() {
  const pkgsDir = path.join(process.cwd(), 'packages');
  if (!fs.existsSync(pkgsDir)) return [];
  return fs.readdirSync(pkgsDir).filter(name => {
    const pj = path.join(pkgsDir, name, 'package.json');
    if (!fs.existsSync(pj)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(pj, 'utf8'));
      return !data.private;
    } catch (e) { return false; }
  });
}

function fileDiff(a, b) {
  try {
    return run(`git --no-pager diff --no-index -- ${a} ${b}`);
  } catch (e) {
    return e.stdout || String(e);
  }
}

function changesetHasMajor(changesetFiles) {
  for (const cs of changesetFiles) {
    try {
      const txt = fs.readFileSync(cs, 'utf8').toLowerCase();
      if (txt.includes('major')) return true;
    } catch (e) {}
  }
  return false;
}

async function main() {
  const baseRef = process.env.BASE_REF || 'main';
  const prLabels = (process.env.PR_LABELS || '').toLowerCase();

  const publishable = getPublishablePackages();
  if (publishable.length === 0) {
    console.log('No publishable packages found. Skipping API diff check.');
    process.exit(0);
  }

  const changedPkgs = getChangedPackages(baseRef);
  // If none of the publishable packages changed, skip
  const affected = publishable.filter(p => changedPkgs.includes(p));
  if (affected.length === 0) {
    console.log('No publishable package changes detected. Skipping API diff.');
    process.exit(0);
  }

  const changesetFiles = run(`git diff --name-only origin/${baseRef}..HEAD`).split(/\r?\n/).filter(p => p.startsWith('.changeset/'));
  const hasMajor = changesetHasMajor(changesetFiles) || prLabels.includes('breaking');

  let failed = false;
  for (const pkg of affected) {
    const baseline = path.join(process.cwd(), 'api-baselines', `${pkg}.d.ts`);
    const current = path.join(process.cwd(), 'packages', pkg, 'dist', 'index.d.ts');

    if (!fs.existsSync(current)) {
      console.error(`Package ${pkg} has no built declaration at ${current}. Run build before running API checks.`);
      failed = true;
      continue;
    }

    if (!fs.existsSync(baseline)) {
      console.error(`Missing API baseline for package ${pkg}: ${baseline}`);
      console.error('To generate baselines locally, run `pnpm run generate:api-baselines` and commit the results.');
      failed = true;
      continue;
    }

    const a = baseline;
    const b = current;
    if (fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8')) {
      console.error(`API difference detected for package ${pkg}:`);
      const d = fileDiff(a, b);
      console.error(d);
      if (!hasMajor) {
        console.error('\nThis change appears to modify the public API without a `major` changeset or `breaking` label.');
        console.error('If this is an intended breaking change, run `pnpm changeset` and choose `major`, or add a `breaking` label.');
        failed = true;
      } else {
        console.log('Change is marked major/breaking; allow API difference.');
      }
    } else {
      console.log(`No API changes for ${pkg}`);
    }
  }

  process.exit(failed ? 1 : 0);
}

main();

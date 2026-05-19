#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) { execSync(cmd, { stdio: 'inherit' }); }

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

async function main() {
  // Build packages first
  run('pnpm turbo build --filter=!./apps/*');

  const publishable = getPublishablePackages();
  if (publishable.length === 0) {
    console.log('No publishable packages found.');
    process.exit(0);
  }

  const outDir = path.join(process.cwd(), 'api-baselines');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  for (const pkg of publishable) {
    const src = path.join(process.cwd(), 'packages', pkg, 'dist', 'index.d.ts');
    const dest = path.join(outDir, `${pkg}.d.ts`);
    if (!fs.existsSync(src)) {
      console.warn(`Skipping ${pkg}: missing ${src}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log(`Wrote baseline for ${pkg} -> ${dest}`);
  }

  console.log('Done. Commit the api-baselines/ directory to record the public API baselines.');
}

main();

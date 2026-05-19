#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

async function main() {
  const baseRef = process.env.BASE_REF || 'main';
  const prLabels = (process.env.PR_LABELS || '').toLowerCase();

  try {
    // Ensure we have the base ref fetched
    try { execSync(`git fetch origin ${baseRef}`, { stdio: 'ignore' }); } catch (e) {}

    const diffCmd = `git diff --name-only origin/${baseRef}..HEAD`;
    const changed = run(diffCmd).split(/\r?\n/).filter(Boolean);

    // find changed packages under packages/*
    const pkgChanges = new Set();
    for (const f of changed) {
      const m = f.match(/^packages\/([^\/]+)\//);
      if (m) pkgChanges.add(m[1]);
      if (f.startsWith('packages/')) pkgChanges.add(f.split('/')[1]);
    }

    // filter publishable packages (skip private ones)
    const publishable = [];
    for (const pkg of pkgChanges) {
      const pkgJsonPath = path.join('packages', pkg, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          if (!pj.private) publishable.push({ name: pj.name || pkg, dir: pkg });
        } catch (e) {
          // ignore parse failures
        }
      }
    }

    if (publishable.length === 0) {
      console.log('No publishable packages changed — skipping changeset check.');
      process.exit(0);
    }

    // Check for .changeset files introduced in this PR (present in diff)
    const changesetFiles = changed.filter(p => p.startsWith('.changeset/'));

    if (changesetFiles.length === 0) {
      console.error('\nERROR: Detected changes to published packages but no Changeset found.');
      console.error('Packages changed: ' + publishable.map(p => p.name).join(', '));
      console.error('Please run `pnpm changeset` and add a Changeset to describe version bumps.');
      console.error('If this is a BREAKING change, choose `major` when prompted (or add a `breaking` label).\n');
      process.exit(1);
    }

    // If there are changeset files, check whether any of them includes a `major` bump
    let hasMajor = false;
    for (const cs of changesetFiles) {
      try {
        const txt = fs.readFileSync(cs, 'utf8').toLowerCase();
        if (txt.includes('major')) hasMajor = true;
      } catch (e) {
        // ignore read errors
      }
    }

    if (hasMajor || prLabels.includes('breaking')) {
      console.log('Found changeset and marked as major/breaking. OK.');
      process.exit(0);
    }

    // Otherwise, pass — we only require presence of a changeset; for strict enforcement of
    // breaking-change tagging, maintainers should include policies. We'll fail only if
    // package changes and no changeset at all.
    console.log('Changes to publishable packages detected and a Changeset is present. OK.');
    process.exit(0);

  } catch (err) {
    console.error(err && err.message ? err.message : String(err));
    process.exit(2);
  }
}

main();

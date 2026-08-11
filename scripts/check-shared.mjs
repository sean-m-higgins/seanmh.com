#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_BRANCH = "content";
// version/nexus is deliberately absent: it keeps the shared files in its tree
// but never imports them, and its switcher copy has diverged. version/d-3d-game
// does not import the switcher either, but its copy is kept byte-identical so
// the dial stays one file everywhere it is used.
const VERSION_BRANCHES = [
  "version/a-scroll",
  "version/b-card",
  "version/c-terminal",
  "version/d-3d-game",
];

const sharedFiles = [
  {
    path: "src/content/site.ts",
    branches: VERSION_BRANCHES,
  },
  {
    path: "src/content/experience.ts",
    branches: VERSION_BRANCHES,
  },
  {
    path: "src/assets/images/headshot.jpeg",
    branches: VERSION_BRANCHES,
  },
  {
    path: "src/components/VersionSwitcher.astro",
    branches: VERSION_BRANCHES,
  },
  {
    path: "src/styles/transitions.css",
    branches: VERSION_BRANCHES,
  },
  {
    path: "src/content/projects.ts",
    branches: ["version/c-terminal"],
  },
];

function worktreesByBranch() {
  const output = execFileSync(
    "git",
    ["worktree", "list", "--porcelain", "-z"],
    { encoding: "utf8" },
  );
  const worktrees = new Map();

  for (const record of output.split("\0\0")) {
    let path;
    let branch;
    for (const field of record.split("\0")) {
      if (field.startsWith("worktree ")) path = field.slice("worktree ".length);
      if (field.startsWith("branch refs/heads/")) {
        branch = field.slice("branch refs/heads/".length);
      }
    }
    if (path && branch) worktrees.set(branch, path);
  }

  return worktrees;
}

const worktrees = worktreesByBranch();
const contentPath = worktrees.get(CONTENT_BRANCH);
const missingBranches = [CONTENT_BRANCH, ...VERSION_BRANCHES].filter(
  (branch) => !worktrees.has(branch),
);

if (!contentPath || missingBranches.length > 0) {
  console.error(`Missing worktrees: ${missingBranches.join(", ")}`);
  process.exitCode = 1;
} else {
  const mismatches = [];

  for (const shared of sharedFiles) {
    const canonicalPath = join(contentPath, shared.path);
    if (!existsSync(canonicalPath)) {
      mismatches.push(`${CONTENT_BRANCH}: ${shared.path} (missing)`);
      continue;
    }

    const canonical = readFileSync(canonicalPath);
    for (const branch of shared.branches) {
      const candidatePath = join(worktrees.get(branch), shared.path);
      if (!existsSync(candidatePath)) {
        mismatches.push(`${branch}: ${shared.path} (missing)`);
        continue;
      }

      const candidate = readFileSync(candidatePath);
      if (!canonical.equals(candidate)) {
        mismatches.push(`${branch}: ${shared.path}`);
      }
    }
  }

  if (mismatches.length > 0) {
    console.error("Shared files differ from content:");
    for (const mismatch of mismatches) console.error(`  ${mismatch}`);
    process.exitCode = 1;
  } else {
    console.log(`Shared content matches across ${VERSION_BRANCHES.length} versions.`);
  }
}

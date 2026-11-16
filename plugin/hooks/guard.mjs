#!/usr/bin/env node
// Guard hooks for seanmh.com. Reads one hook event as JSON on stdin and prints
// a decision as JSON on stdout. Printing nothing lets the action through.
import { execFileSync } from "node:child_process";
import { dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Mirrors sharedFiles in scripts/check-shared.mjs on main; test/guard.test.js
// fails if the two lists drift apart.
export const SHARED_FILES = [
  "src/content/site.ts",
  "src/content/experience.ts",
  "src/assets/images/headshot.jpeg",
  "src/components/VersionSwitcher.astro",
  "src/styles/transitions.css",
  "src/content/projects.ts",
];

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const MIN_NODE_MAJOR = 22;

export function repoInfo(dir) {
  try {
    const [top, branch] = execFileSync(
      "git",
      ["-C", dir, "rev-parse", "--show-toplevel", "--abbrev-ref", "HEAD"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim().split("\n");
    return { top, branch };
  } catch {
    return null;
  }
}

function bashDecision(command, repo) {
  const branch = repo?.branch ?? "";

  if (/\bgit\b[^;&|]*\bpush\b/.test(command)) {
    const target = branch.startsWith("version/")
      ? branch
      : command.match(/\bversion\/[\w-]+/)?.[0];
    if (target) {
      return [
        "ask",
        `Pushing ${target} deploys its Cloudflare Pages project to production. Confirm with Sean before pushing.`,
      ];
    }
  }

  if (/\bwrangler\s+deploy\b/.test(command) && !/--dry-run\b/.test(command)) {
    if (branch !== "main") {
      return [
        "deny",
        `wrangler deploy from ${branch || "this checkout"} would replace the seanmh.com router Worker. Only main deploys the Worker; version branches deploy through Cloudflare Pages.`,
      ];
    }
    return [
      "ask",
      "This deploys the production router Worker for seanmh.com. Run npx wrangler deploy --dry-run first and confirm with Sean.",
    ];
  }

  return null;
}

function editDecision(filePath, repo) {
  if (!repo || repo.branch === "content") return null;
  const rel = relative(repo.top, filePath);
  if (!SHARED_FILES.includes(rel)) return null;
  return [
    "deny",
    `${rel} is a shared file. Edit it on the content branch (~/SoftLot/MyWebsite/wt/content), then carry it to version branches with the sync-shared skill.`,
  ];
}

export function decide(input, lookup = repoInfo) {
  const event = input.hook_event_name;

  if (event === "SessionStart") {
    const major = Number(process.versions.node.split(".")[0]);
    if (major >= MIN_NODE_MAJOR) return null;
    return {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `Node ${process.versions.node} is active, but every seanmh.com branch needs Node 22.12 or newer. Builds will fail. Tell Sean before running npm scripts; ~/SoftLot/MyWebsite/.tool-versions should pin nodejs 22.23.2 through asdf.`,
      },
    };
  }

  if (event !== "PreToolUse") return null;

  const tool = input.tool_name;
  const toolInput = input.tool_input ?? {};
  let result = null;

  if (tool === "Bash" && toolInput.command) {
    result = bashDecision(toolInput.command, lookup(input.cwd ?? process.cwd()));
  } else if (EDIT_TOOLS.has(tool)) {
    const filePath = toolInput.file_path ?? toolInput.notebook_path;
    if (filePath) result = editDecision(filePath, lookup(dirname(filePath)));
  }

  if (!result) return null;
  const [permissionDecision, permissionDecisionReason] = result;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision,
      permissionDecisionReason,
    },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  const output = decide(JSON.parse(raw || "{}"));
  if (output) process.stdout.write(JSON.stringify(output));
}

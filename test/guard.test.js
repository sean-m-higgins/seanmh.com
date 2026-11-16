import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { decide, SHARED_FILES } from "../plugin/hooks/guard.mjs";

const repo = (branch) => () => ({ top: "/repo", branch });
const bash = (command) => ({
  hook_event_name: "PreToolUse",
  tool_name: "Bash",
  tool_input: { command },
  cwd: "/repo",
});
const edit = (file_path) => ({
  hook_event_name: "PreToolUse",
  tool_name: "Edit",
  tool_input: { file_path },
});
const decision = (output) => output?.hookSpecificOutput.permissionDecision;

test("asks before pushing a version branch", () => {
  assert.equal(decision(decide(bash("git push"), repo("version/a-scroll"))), "ask");
  assert.equal(
    decision(decide(bash("git push origin version/b-card"), repo("main"))),
    "ask",
  );
});

test("lets main and wiki pushes through", () => {
  assert.equal(decide(bash("git push origin main"), repo("main")), null);
  assert.equal(decide(bash("git push"), repo("master")), null);
});

test("denies wrangler deploy off main and asks on main", () => {
  assert.equal(decision(decide(bash("npx wrangler deploy"), repo("version/c-terminal"))), "deny");
  assert.equal(decision(decide(bash("npx wrangler deploy"), repo("main"))), "ask");
});

test("allows dry runs and Pages deploys", () => {
  assert.equal(decide(bash("npx wrangler deploy --dry-run"), repo("version/g-travel")), null);
  assert.equal(decide(bash("npx wrangler pages deploy dist"), repo("version/c-terminal")), null);
});

test("denies editing a shared file off content", () => {
  const output = decide(edit("/repo/src/content/site.ts"), repo("version/a-scroll"));
  assert.equal(decision(output), "deny");
  assert.match(output.hookSpecificOutput.permissionDecisionReason, /content branch/);
});

test("allows shared edits on content and ordinary edits anywhere", () => {
  assert.equal(decide(edit("/repo/src/content/site.ts"), repo("content")), null);
  assert.equal(decide(edit("/repo/src/pages/index.astro"), repo("version/a-scroll")), null);
});

test("ignores other events and tools", () => {
  assert.equal(decide({ hook_event_name: "Stop" }, repo("main")), null);
  assert.equal(
    decide({ hook_event_name: "PreToolUse", tool_name: "Read", tool_input: {} }, repo("main")),
    null,
  );
});

test("shared file list matches scripts/check-shared.mjs", () => {
  const source = readFileSync(new URL("../scripts/check-shared.mjs", import.meta.url), "utf8");
  const checked = [...source.matchAll(/path: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...SHARED_FILES].sort(), [...checked].sort());
});

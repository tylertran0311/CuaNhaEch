// Keeps AGENTS.md (the project's instruction file) under 50 lines. Runs as a Claude Code hook:
// - PostToolUse on Edit|Write: when the edited file is AGENTS.md and it is over the limit, tells Claude to compact it now.
// - SessionStart: when AGENTS.md has grown past the limit (by hand or by `next dev`), tells Claude to compact it first.
import { readFileSync } from "node:fs";
import { join, basename } from "node:path";

const LIMIT = 50;

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch {}

const event = input.hook_event_name ?? "";
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = join(root, "AGENTS.md");

if (event === "PostToolUse") {
  const edited = input.tool_input?.file_path ?? input.tool_response?.filePath ?? "";
  if (basename(edited).toLowerCase() !== "agents.md") process.exit(0);
}

let text;
try { text = readFileSync(file, "utf8"); } catch { process.exit(0); }
const lines = text.replace(/\r?\n$/, "").split(/\r?\n/).length;
if (lines <= LIMIT) process.exit(0);

const msg =
  `AGENTS.md has ${lines} lines (limit ${LIMIT}). Compact it now to under ${LIMIT} lines: merge and shorten rules, ` +
  `drop duplicates and anything docs/design-system.md already says, keep every rule's meaning. ` +
  `Keep the "This is NOT the Next.js you know" block written by \`next dev\` as it is. Tell the user what you cut.`;

if (event === "PostToolUse") {
  console.log(JSON.stringify({ decision: "block", reason: msg }));
} else {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: event || "SessionStart", additionalContext: msg } }));
}

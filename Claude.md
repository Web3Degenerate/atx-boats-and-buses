# Project Instructions

## Workflow
1. Before starting any task, read the relevant parts of the codebase and write 
   a plan to todo.md with checkable todo items.
2. Check in with me to verify the plan before writing any code.
3. Work through the todo items one at a time, marking each complete as you go.
4. Give me a brief high-level explanation of each change as you make it.
5. When finished, add a Review section to todo.md summarizing what changed and why.

## Code Philosophy
- Make every change as small and targeted as possible.
- Only touch code directly relevant to the task. Minimize side effects.
- Always find and fix root causes — no workarounds or temporary patches.
- When in doubt, do less and confirm with me.

## Obsidian Vault
My Obsidian vault is located at: /Users/web3dev/Documents/ai-brain

When I ask you to take notes, log decisions, or document anything:
- Create or edit markdown files in the vault above
- Use [[wikilinks]] for cross-references between notes
- Place project notes in: /Users/web3dev/Documents/ai-brain/Projects/<project-name>/
- Place one-off reference notes in: /Users/web3dev/Documents/ai-brain/Notes/
- Use frontmatter for metadata, e.g.:
  ---
  date: 2026-04-01
  tags: [project-name, decisions]
  ---

## Picking the right models for workflows and subagents
Rankings, higher = better. Cost reflects what I actually pay (OpenAI has really generous limits), not list price. Intelligence is how hard a problem you can hand the model unsupervised. Taste covers UI/UX, code quality, API design, and copy.

| Model    | Cost | Intelligence | Taste |
| -------- | ---: | -----------: | ----: |
| gpt-5.5  |    9 |            8 |     5 |
| sonnet-5 |    5 |            5 |     7 |
| opus-4.8 |    4 |            7 |     8 |
| fable-5  |    2 |            9 |     9 |


How to apply:

These are defaults, not limits. You have standing permission to override them: if a cheaper model's output doesn't meet the bar, rerun or redo the work with a smarter model without asking. Judge the output, not the price tag. Escalating costs less than shipping mediocre work.
Cost is a tie-breaker only; when axes conflict for anything that ships, intelligence › taste › cost.
Bulk/mechanical work (clear-spec implementation, data analysis, migrations): gpt-5.5 — it's effectively free.
Anything user-facing (UI, copy, API design) needs taste ≥ 7.
Reviews of plans/implementations: fable-5 or opus-4.8, optionally gpt-5.5 as an extra independent perspective.
Never use Haiku.
Mechanics: gpt-5.5 is handled natively by the Codex plugin (openai-codex) inside Claude Code, which automatically adopts my user-level configuration from ~/.codex/config.toml (currently pinned to gpt-5.5, reasoning effort high). Avoid writing custom bash wrappers around the codex CLI; use the plugin's built-in commands and skills:

/codex:review — non-destructive, read-only code-quality assessment. Supports --base <ref> for branch analysis and --background for heavy runs.
/codex:adversarial-review — skeptical design review that pressure-tests tradeoffs, auth, and reliability. Append focus text at the end to steer it (e.g. /codex:adversarial-review focus on the auth flow).

/codex:rescue — subcontract active debugging, multi-file refactoring, or implementation loops to Codex when a second pass is needed. Accepts --model <model|spark> and --effort <…>.
/codex:status / /codex:result / /codex:cancel — check, fetch, or abort asynchronous jobs started with --background.

Claude models (sonnet-5, opus-4.8, fable-5) run via the Agent/Workflow model parameter.
Using gpt-5.5 inside workflows and subagents:

Subagents and automated workflows should call the plugin's native slash commands or its codex-cli-runtime skill to delegate directly — no raw terminal wrappers.

For closed-loop QA, keep the review gate on via /codex:setup --enable-review-gate. This installs a Stop hook that has Codex challenge Claude's output before finalizing, catching broken code and weak design assumptions before they reach the main session. Note this runs on every stop, so it adds latency and token cost to each turn — worth it for unattended work, but it's an always-on tax, not a per-task opt-in.
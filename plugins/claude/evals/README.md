# color-space evals

Questions where an exact color number matters, each graded by regex against a cross-checked reference (the `description` in each prompt.md). Run from `plugins/claude`:

```sh
claude plugin eval . --allow-real-servers --allow-tools Bash "mcp__plugin_color-space_color-space__*"
```

Both arms get Bash, so the no-plugin baseline can compute in code; only the with-arm has the color-space MCP server. `used-color-space` is an indicator, not scored.

First run (2026-10-15, Claude Code 2.1.289, default model, 3 runs per arm): with the plugin 1.00 on every case; without it 1.00 on five cases and 0.89 on `hct-of-hex` (one run got the HCT chroma wrong) – mean Δ +0.02. On these single, well-known conversions the model mostly answers correctly from memory; the plugin pays off where memory runs out (see the follow-ups in `.work/todo.md`).

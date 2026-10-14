# Installing the color-space MCP server

No API key, no configuration, no network access needed. Requires Node.js 20.10 or newer.

Add this server to the MCP settings (for Cline: `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "color-space": {
      "command": "npx",
      "args": ["-y", "color-space", "mcp"]
    }
  }
}
```

Check it works: call the `convert` tool with `{ "color": "#ff8000", "to": "oklch" }` – the result's `values` start with 0.7319.

Tools: `convert` · `gamut` · `css` · `space` · `spaces` · `cube` · `shader` · `icc` · `code`. A color goes in as any CSS color string or as channel values with `from`.

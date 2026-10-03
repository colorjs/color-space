# mcp

## summary
I fetched the MCP Registry schema and source, the MCP spec (all five revisions), the MCPB spec/CLI, the Smithery CLI source and the client docs that were reachable. No repo file was edited.

Five findings matter most:
1. The registry's current server.json schema is dated 2025-12-11. The registry checks npm ownership by reading `mcpName` from registry.npmjs.org/<pkg>/<version>, and published color-space@3.1.0 has no `mcpName`.
2. The latest MCP protocol is now 2026-07-28. It is stateless: there is no `initialize` step, `server/discover` is mandatory, every result needs a `resultType` field, and `tools/list` needs caching hints (`ttlMs`, `cacheScope`).
3. Most clients still speak the older handshake-based protocol. The official TypeScript SDK 1.32.0 (published today) tops out at 2025-11-25. The installed Claude Code 2.1.288 binary contains code that probes `server/discover` first and falls back to `initialize` if that fails.
4. Today's mcp.js still works with these clients (it answers `server/discover` with "method not found", so they fall back), but it has gaps. It always answers protocol 2025-03-26, so it never reaches the versions that added tool titles and structured output. Its tools have no titles, annotations or output schemas. `convert` rejects batches and returns out-of-gamut values with no flag (oklch(0.7 0.25 150) → rgb R=-86.3).
5. After the next npm release the package has three bins, so a bare `npx color-space@X` runs cli.js, which prints usage and exits with code 1. The registry entry therefore must pass the positional argument "mcp", which is the registry's own documented "MCP inside a CLI tool" pattern.

I wrote and tested a prototype server that handles both the old and new protocol, with six tools and outputs checked against both spec schemas. I also built and validated an MCP bundle (.mcpb) and a draft server.json that the registry's validator accepts.

## recommendation
1. **Pick a registry name and wire it into the release.**
   - Recommended name: `io.github.colorjs/color-space`. GitHub OIDC grants it with no secrets and no org-Owner check, and release.yml already has `id-token: write`. The branded alternative is `io.color-space/color-space` (DNS TXT, or `/.well-known` plus a private-key secret).
   - Add `"mcpName"` to package.json.
   - Commit research/proto/server.json at the repo root, keeping `version` equal to package.json in CI and keeping `packageArguments` positional "mcp".
   - In release.yml, after `npm publish --tag latest`, run `mcp-publisher login github-oidc` then `mcp-publisher publish`. Order matters: the registry checks `mcpName` on the already-published npm version.

2. **Rework mcp.js to serve both protocol eras, following research/proto/mcp.js.**
   - Old handshake: echo any version in ['2025-11-25','2025-06-18','2025-03-26','2024-11-05'], else answer '2025-11-25'.
   - 2026-07-28: add `server/discover`, `resultType`, `ttlMs`/`cacheScope` on `tools/list`, -32022 for unsupported versions, and `serverInfo` in result `_meta`.
   - On every tool: add `title`, annotations (`readOnlyHint` true, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false) and `additionalProperties: false`. Give every tool except `cube` an object-rooted `outputSchema` plus `structuredContent`, keeping the JSON text block for older clients.
   - Errors: "did you mean" suggestions returned as `isError` tool results.

3. **Extend the tool set.**
   - Add `gamut` (membership only, the same ladder as the site's gamut pill) and `css` (reuse the site's `fmt`/`CSSABLE` notation rather than adding a third copy; lift it into the package).
   - Extend `spaces` with query and class filters, and `convert` with batches and an `inRange` flag.
   - Skip ΔE, parsing and gamut mapping; they are outside the library's scope.

4. **Unify every one-liner on `npx -y color-space mcp`.** This means README, llms.txt (currently `--package color-space color-space-mcp`, which breaks once that bin is retired as planned in .work/todo.md), and cli.js usage. Add a README "Agents" block with the configs for Claude Code, a root .mcp.json (works for Claude Code and VS Code), Claude Desktop, Cursor (install link), VS Code (`code --add-mcp`), Zed and Windsurf.

5. **Ship a .mcpb on each GitHub release.**
   - Build it with esbuild into a single file, using a v0.3 manifest and a 512×512 icon.
   - Add it as a second `packages[]` entry (`registryType` mcpb, with `fileSha256`).
   - Use the same bundle for Smithery (`smithery mcp publish ./color-space.mcpb`) and for one-click install in Claude Desktop.
   - Add `glama.json` with the maintainers list.
   - PulseMCP and GitHub's MCP registry are reported (search results only) to pull from the official registry.

6. **Update the repo alongside.** test/mcp.js currently pins four tools and 2025-03-26; regenerate types/mcp.d.ts; update the cli.js usage line.

## files
['<session-scratch>/research/mcp.json', '<session-scratch>/research/proto/mcp.js', '<session-scratch>/research/proto/server.json', '<session-scratch>/research/mcpb/manifest.json', '<session-scratch>/research/mcpb/server/index.mjs', '<session-scratch>/research/mcpb/color-space.mcpb', '<session-scratch>/research/mcpb/icon.png', '<session-scratch>/research/src/', '<session-scratch>/research/cc-probe/.mcp.json']

## facts
- [fetched-primary] Current official MCP Registry server.json schema version: 2025-12-11 (CurrentSchemaURL https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json); 2025-07-09, 2025-09-16, 2025-09-29, 2025-10-17 also return 200; registry docs still say 'currently in preview' (https://raw.githubusercontent.com/modelcontextprotocol/registry/main/pkg/model/constants.go; static.modelcontextprotocol.io)
- [fetched-primary] server.json required fields and key limits: required [name, description, version]; name pattern ^[a-zA-Z0-9.-]+/[a-zA-Z0-9._-]+$ (3-200 chars); description maxLength 100; package version may not be 'latest' or a range; Package requires registryType, identifier, transport (server.schema.json 2025-12-11 definitions.ServerDetail / Package)
- [fetched-primary] npm ownership verification rule: Registry GETs registry.npmjs.org/<identifier>/<version>; that version's mcpName must equal the server.json name. Error text: "NPM package '%s' is missing required 'mcpName' field. Add this to your package.json: \"mcpName\": \"%s\"". The version field is mandatory for npm packages. (registry internal/validators/registries/npm.go; docs quickstart.mdx Step 1)
- [fetched-primary] Published npm color-space@3.1.0 is not registry-ready: bin = {color-space-mcp: mcp.js} only; no mcpName field (https://registry.npmjs.org/color-space/latest)
- [computed] packageArguments 'mcp' is required after the next release: Under npm exec's rule, with three bins the one matching the package name (cli.js) runs; cli.js with no arguments prints usage and exits 1. So server.json needs packageArguments [{type:'positional', value:'mcp'}], the same as the registry's 'Embedded MCP inside a CLI tool' (snyk) example. (npm/cli docs npm-exec.md; cli.js; registry generic-server-json.md)
- [computed] `npx -y color-space mcp` works for both the current and the next package shape: Ran it against 3.1.0 with the official SDK 1.32.0 client: initialize, tools/list and convert all OK. Gotcha: the SDK's StdioClientTransport passes a minimal environment by default, so behind a proxy npx hung until env:process.env was passed. (scratchpad/tools/probe-sdk.mjs runs)
- [fetched-primary] GitHub OIDC namespace grant: A token from a workflow in colorjs/color-space is granted io.github.colorjs/*, with no org-role check. Interactive GitHub OAuth/PAT login only grants the org namespace to org Owners. release.yml already has id-token: write. (registry auth/github_oidc.go buildPermissions; authentication.mdx)
- [fetched-primary] Domain namespace option: color-space.io reverses to io.color-space. DNS TXT on the apex grants io.color-space/* plus subdomains. An HTTP file at /.well-known/mcp-registry-auth grants the exact domain only. upload-pages-artifact@v3 (used in pages.yml) keeps dotfiles; v4+ excludes them unless include-hidden-files: true. Live serving was not checked because the site is blocked from the sandbox. (registry auth/common.go, http.go, dns.go; actions/upload-pages-artifact action.yml v3/v4/main)
- [computed] Draft server.json passes registry validation: mcp-publisher 1.8.1 `validate` against registry.modelcontextprotocol.io returned valid for both io.github.colorjs/color-space and io.color-space/color-space. `validate` does NOT check npm ownership: 3.1.0, which has no mcpName, also passed. (research/proto/server.json + mcp-publisher binary from GitHub releases)
- [fetched-primary] No color-space entry exists in the official registry: Search for 'color-space' returned 0 results. Related servers already listed: io.github.aimsise/color-engine-mcp, com.gumballtools/color-companion, io.github.RNVizion/rnv-color-mcp. (https://registry.modelcontextprotocol.io/v0.1/servers?search=...)
- [fetched-primary] Latest MCP protocol revision: 2026-07-28: docs.json labels it 'Version 2026-07-28 (latest)', and schema/draft LATEST_PROTOCOL_VERSION is '2026-07-28' (modelcontextprotocol/modelcontextprotocol docs/docs.json, schema/draft/schema.ts)
- [fetched-primary] 2026-07-28 changes that affect a tools-only stdio server: No initialize/notifications/initialized; each request carries _meta io.modelcontextprotocol/protocolVersion and clientCapabilities (missing → -32602); server/discover MUST exist; every result needs resultType 'complete'; tools/list MUST carry ttlMs and cacheScope; ping and logging/setLevel removed; unsupported version → -32022 with data {supported, requested}; outputSchema may be any 2020-12 schema; tools SHOULD be listed in deterministic order (specification/2026-07-28/changelog.mdx, basic/versioning.mdx, basic/index.mdx, server/discover.mdx, schema.ts)
- [fetched-primary] How a server can support both old and new clients: A request carrying modern _meta is served statelessly; an initialize request selects legacy semantics. A dual-era client probes server/discover on stdio and falls back to initialize on any non-modern error or timeout. (specification/2026-07-28/basic/versioning.mdx and transports/stdio.mdx)
- [fetched-primary] Older-protocol constraints and version negotiation: Under 2025-11-25, Tool.outputSchema must have type 'object' at the root and structuredContent must be an object; ajv confirms the 2025-11-25 schema rejects an array-rooted outputSchema. Negotiation rule: echo the client's version if supported, else offer the server's latest. (schema/2025-11-25/schema.ts + schema.json; 2025-11-25 basic/lifecycle.mdx)
- [fetched-primary] When tool-metadata features were introduced: Annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint, title) in 2025-03-26; outputSchema/structuredContent and the Tool title field in 2025-06-18; icons, tool-name guidance, Implementation.description/websiteUrl, and validation errors as isError in 2025-11-25 (specification changelogs 2025-03-26 / 2025-06-18 / 2025-11-25)
- [fetched-primary] What the official TypeScript SDK supports: @modelcontextprotocol/sdk 1.32.0: LATEST_PROTOCOL_VERSION '2025-11-25', supported back to 2024-10-07, no server/discover. Its client throws if a tool with an outputSchema returns no structuredContent (unless isError), and validates structuredContent with ajv. (npm tarball dist/esm/types.js, client/index.js)
- [computed] Claude Code 2.1.288 already supports both protocol eras: Binary contains '2026-07-28', server/discover probe logic, and strings such as 'treating the server as pre-2026-07-28' and 'Version negotiation failed: the transport was closed during the server/discover probe' (/opt/claude-code/bin/claude strings)
- [computed] Current mcp.js protocol behaviour: Always answers protocolVersion 2025-03-26; server/discover → -32601. Tools have no title, annotations or outputSchema, and return text only. (mcp.js + raw stdio probe)
- [computed] Current convert misses batches and gamut warnings: values [255,128,0,0,255,128] → isError 'rgb takes 3 values'. oklch(0.7 0.25 150)→rgb returns [-86.31, 197.23, 55.22] with no flag. Library batches return Float64Array, which needs Array.from before JSON.stringify. (raw stdio probe + node)
- [computed] Prototype dual-era server works in both eras: research/proto/mcp.js with tools convert (batch + inRange), gamut, css, space, spaces (query/encoding/referred/dynamic filters) and cube. Legacy era: all outputs passed the SDK 1.32.0 client's own validation. Modern era: discover, tools/list and tools/call are valid against the 2026-07-28 schema.json; -32022 and -32602 paths verified. Legacy results are valid against the 2025-11-25 schema.json. (scratchpad/tools/probe-proto.mjs, probe-modern.mjs)
- [computed] Prototype sample outputs: gamut oklch(0.7 0.25 150): smallest display-p3 (p3 [0.1612, 0.7599, 0.3015]). css oklch(0.7 0.15 150): #4cb86a, rgb(76 184 106), lab(67.09% -45.23 29.75). spaces encoding=perceptual: 52 results. Misspelled 'okclh' → 'did you mean oklch, oklab, okhsl?' (prototype run)
- [fetched-primary] MCPB manifest format: MANIFEST.md says 'Current version: 0.3' (2025-12-02); the 2.1.2 CLI also ships v0.4 (adds server.type uv). Required: name, version, description, author, server {type node|python|binary, entry_point, mcp_config{command,args,env}}. Tool entries allow only {name, description}. Node ships with Claude for macOS/Windows. (https://raw.githubusercontent.com/anthropics/mcpb/main/MANIFEST.md, README.md; @anthropic-ai/mcpb 2.1.2 schemas)
- [computed] Test .mcpb bundle builds, validates and runs: The esbuild-bundled repo mcp.js is one 561 kB file with JSON imports inlined. `mcpb validate` passes (warning: recommended icon size 512×512; the site icon is 240×240). `mcpb pack` produced a 195.7 kB bundle with sha256 07fe623227dc9bfc544c8746c348aa012ac175ab57a6816ab0baf5c24eabfadb. The unpacked server answered the SDK client. (research/mcpb/)
- [fetched-primary] Smithery's current publish path: The smithery CLI (npm 1.2.0) publishes a URL or a .mcpb: `smithery mcp publish ./server.mcpb -n org/server`, max 25 MB. smithery.yaml is parsed only for {name (3-39 chars), target local|remote}. The old startCommand-stdio form is absent from the CLI schema. (smithery-ai/cli README; smithery@1.2.0 dist/index.js)
- [search-snippet] Glama listing: glama.json at the repo root: {"$schema":"https://glama.ai/mcp/schemas/server.json","maintainers":["<gh user>"]}. Listing requires its sandbox build to start the server and answer introspection. (integromat/make-mcp-server/glama.json (shape); glama.ai/mcp/methodology (requirements))
- [search-snippet] PulseMCP, mcp.so and GitHub MCP Registry intake: PulseMCP: manual submit plus auto-ingest of the official registry (snippet). GitHub MCP Registry sources from the official registry (snippet). mcp.so: conflicting snippets, so unverified. (web search snippets)
- [computed] Claude Code config: `claude mcp add color-space -- npx -y color-space mcp` (-s user|project). The project scope writes .mcp.json {"mcpServers":{"color-space":{"type":"stdio","command":"npx","args":["-y","color-space","mcp"],"env":{}}}} (local claude 2.1.288 run in scratch)
- [fetched-primary] Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS), %APPDATA%\Claude\claude_desktop_config.json (Windows): {"mcpServers":{"color-space":{"command":"npx","args":["-y","color-space","mcp"]}}} (modelcontextprotocol docs/docs/2026-07-28/develop/connect-local-servers.mdx)
- [fetched-primary] VS Code config: .vscode/mcp.json {"servers":{"color-space":{"type":"stdio","command":"npx","args":[...]}}}. A portable root .mcp.json {"mcpServers":{...}} is now preferred, and current docs call .vscode/mcp.json 'deprecated'. `code --add-mcp '{"name":"color-space","command":"npx","args":["-y","color-space","mcp"]}'` (microsoft/vscode-docs main docs/agent-customization/mcp-servers.md, docs/agents/reference/mcp-configuration.md)
- [search-snippet] Cursor config and install link: .cursor/mcp.json or ~/.cursor/mcp.json with mcpServers. Install link: cursor://anysphere.cursor-deeplink/mcp/install?name=color-space&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImNvbG9yLXNwYWNlIiwibWNwIl19 (cursor.com/docs/mcp and /mcp/install-links (snippets); base64 computed)
- [search-snippet] Windsurf config: ~/.codeium/windsurf/mcp_config.json with mcpServers {command, args, env} (Windsurf docs (snippet))
- [fetched-primary] Zed config: settings.json "context_servers": {"color-space": {"command":"npx","args":["-y","color-space","mcp"],"env":{}}} (zed-industries/zed docs/src/ai/mcp.md)
- [search-snippet] Gemini CLI and Codex CLI configs: Gemini settings.json mcpServers {command, args, env} (fetched). Codex: `codex mcp add color-space -- npx -y color-space mcp` or the [mcp_servers.color-space] command/args TOML table (snippet). (google-gemini/gemini-cli docs/tools/mcp-server.md; Codex articles)

## skeptic overall
I could not refute 13 of the 14 MCP claims. Twelve held up against primary sources or my own runs; claim 14 is mostly supported but not fully re-checked. One claim has a factual error: upload-pages-artifact v4 has no `include-hidden-files` input. It always drops dotfiles; only the action's main branch has the opt-in. The domain-namespace facts in that claim are correct.

Other gaps:
- **Claim 14:** my fetch of the 2025-11-25 schema and lifecycle page was denied. I did not re-run the ajv check. I backed it up with the 2026 changelog's "loosen" item and the official SDK 1.32.0 source.
- **Claim 7:** I backed up the interactive Owner-only rule from the registry's common.go, not from authentication.mdx or github_at.go, which were denied.

Things I found beyond the researcher:
- `mcp-publisher validate` makes no npm call at all. It passed version 3.2.0, which isn't on npm.
- SDK 1.32.0, the npm latest, still tops out at protocol 2025-11-25.
- Repository id 27033552 is correct.
- 2026-07-28 still requires inputSchema to be object-rooted.
- About 20 color MCP servers are already in the registry.

Prototype issue: research/mcpb/manifest.json and proto/server.json both describe "CSS strings, gamut checks". But the .mcpb bundles the repo's mcp.js, which has only 4 tools (convert, space, spaces, cube). The descriptions only fit once the prototype's css and gamut tools ship.

**Problem in the repo you need to fix:** to test the next package shape I ran `npm pack --ignore-scripts --pack-destination <scratch>` in /home/user/color-space. The `prepare` script still ran (all regenerated at 22:48:41-43, in prepare's order):
- types/*.d.ts, data.json, dist/*: gitignored.
- wasm/binary.js: tracked, and it now differs from HEAD (`git status`: ` M wasm/binary.js`). git status was clean just before.

My attempt to restore it (`git checkout -- wasm/binary.js`, then rewrite dist/color-space.wasm from those bytes) was denied by the permission classifier, so I left the repo as is. Please run `git checkout -- wasm/binary.js`. If dist/color-space.wasm must match HEAD, regenerate it from the restored base64 the way scripts/build-wasm.js does. Several later read-only fetches were also denied, which is why claims 8 and 14 have gaps.

My scratch files are in <session-scratch>/research/skeptic-mcp/: the fetched sources, the validate variants in val/, the bin-rule stubs in binprobe/ and the local tarball in localpack/. My probe script is scratchpad/tools/skeptic-probe.mjs.

## refuted
- REFUTED: Domain namespace option: color-space.io reverses to io.color-space; DNS TXT on apex grants io.color-space/* plus subdomains; HTTP /.well-known/mcp-registry-auth grants exact domain only; upload-pages-artifact@v3 keeps dotfiles; v4+ excludes them unless include-hidden-files: true → Registry facts stand: io.color-space; DNS TXT at the apex grants io.color-space/* and io.color-space.*; HTTP /.well-known/mcp-registry-auth grants io.color-space/* only. upload-pages-artifact@v3 (current pages.yml) keeps _site/.well-known. @v4 drops ALL dotfiles with no way to opt out. Only the action's main branch (and presumably a later release, not verified) adds `include-hidden-files: true`. Do not move to v4 if relying on the HTTP proof; DNS TXT avoids the question. | Registry side confirmed (fetched-primary). common.go ReverseString splits on '.' and reverses, so color-space.io becomes io.color-space. BuildPermissions grants '<rev>/*' plus '<rev>.*' when includeSubdomains. dns.go sets allowSubdomains := true, does LookupTXT on the domain itself and errors if the record sits under a selector ('requires the record at the apex domain'). http.go fetches https://%s/.well-known/mcp-registry-auth with allowSubdomains := false. The repo's pages.yml:48 uses actions/u

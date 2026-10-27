/**
 * WebMCP: the MCP server's tools for an agent working in this tab – the same verified conversions
 * `npx color-space mcp` serves (mcp.js: TOOLS, call), with nothing to install – beside the page's own
 * tools, which act on what the person sees. The page imports this only where the browser offers
 * document.modelContext (Chrome's origin trial, from Chrome 149; locally chrome://flags/#enable-webmcp-testing).
 * Not `icc`: its result is a binary profile an agent can't hand over here – the dossier's download is
 * the page's way to it.
 * @see https://developer.chrome.com/docs/ai/webmcp
 * @see https://developer.chrome.com/docs/ai/webmcp/imperative-api
 * @see https://github.com/webmachinelearning/webmcp
 */
import { TOOLS, call } from '../../mcp.js'

/** @param {...{ name: string, description: string, inputSchema: object, annotations?: object, execute: Function }} page the page's own tools */
export default (...page) => {
	const lib = TOOLS.filter((t) => t.name !== 'icc').map(({ name, description, inputSchema, annotations }) =>
		({ name, description, inputSchema, annotations, execute: (a) => call(name, a ?? {}) }))
	for (const t of [...lib, ...page])   // a refusal (NotAllowedError, a schema Chrome rejects) costs that tool, never the rest
		Promise.resolve().then(() => document.modelContext.registerTool(t)).catch((e) => console.warn(`WebMCP: ${t.name} not registered –`, e))
}

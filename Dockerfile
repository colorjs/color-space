# The MCP server as an image (Docker MCP Catalog, Glama): stdio by default,
# Streamable HTTP with `--http <port>`. Zero runtime dependencies – only data.json
# is generated; HLSL/MSL from the `shader` tool need the optional naga-wasm (not here).
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN node scripts/generate-data.js
USER node
ENTRYPOINT ["node", "mcp.js"]

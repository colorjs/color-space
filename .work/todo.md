* [x] Make the atlas cool.
* [x] Pick a palette - multiple stops from an image

* [ ] JZ v1 build wasm

* [ ] Website video
  * [ ] 205 spaces, dossier for each
  * [ ] Creating a gradient in oklch via plane curves
  * [ ] Analyzing image palette
  * [ ] Exploring palettes, gradients composition
  * [ ] JS, WASM, LUT, ICC

* [ ] Plugins – deferred until the Figma plugin is published and has installs (review 2026-10-18)
  * [ ] Penpot plugin
  * [ ] Framer, Sketch plugins
  * [ ] Photoshop, Illustrator UXP
  * [ ] Corel draw?
  * [ ] PhotoCraft and other alternatives?
  * [ ] Resolve, film

* [ ] VS Code plugin

* [x] Figma plugin:
  * [x] Screenshots, text, donation button, icon
  * [x] Hook: pick color in any color-space
  * [x] Video:
    * multiple selections display multiple colors: strokes, fills, multiple layers; snapping to nearest.
    * gradients display lines mapped via srgb and allow editing on color plane
    * images display stats with optional snapping
    * 200+ color spaces, categories. Oklch.
    * quantization to tailwind or others, with oklch and color in tooltip
    * zoomable/scrollable plane, switchable axes, wheel/triangle modes, resizable
    * hovered color tooltip, p3/rec2020/out of bounds
    * sniper mode, one-axis mode (shift), snapping, measuring distance to colors via alt - during the drag and before
    * palette: draggable for merge, select layers from tooltip
    * offline, developer code, variables?
  * [x] Website change to promote plugins
  * [x] Translations
  * [ ] Publish

* [ ] MCP registers – the open ones deferred until an eval shows where the server pays off (plugins/claude/evals: +0.02 on common conversions); no paid listings (review 2026-10-18)
  1. [x] Claude plugin directory	https://claude.ai/directory/manage	Submit new → Plugin bundle. Repo colorjs/color-space, Plugin path plugins/claude. Needs a paid plan and your GitHub connected.
  2. [ ] Smithery	https://smithery.ai/new	Log in. For a local server it wants an MCPB bundle (smithery mcp publish) or a hosted URL.
  3. [x] mcpservers.org	https://mcpservers.org/submit	Free form. Registry name: io.github.colorjs/color-space. Remote: no.
  4. [x] MCP Market	https://mcpmarket.com/submit	Paste the repo URL. Free (4–6 weeks) or $29 (24 hours).
  5. [ ] mcp.so	https://mcp.so/submit	The form shows $39. Their FAQ mentions a free GitHub-issue route, but I couldn't confirm it; try that first.
  6. [ ] Cursor Marketplace	https://cursor.com/marketplace/publish	Publisher form with manual review. They may want it wrapped as a Cursor plugin.
  7. [ ] GitHub MCP Registry	https://github.com/mcp	Check it a day after the registry entry exists. If color-space is missing, email partnerships@github.com.
  8. [x] Glama	https://glama.ai/mcp/servers	Check after the registry entry. If it's missing, use "Add Server" (GitHub login). glama.json already names you as maintainer.
  9. [x] LobeHub	https://lobehub.com/mcp	Submission flow unclear; check the page.
  10. [x]	mcp.directory	https://mcp.directory/submit	Web form.

* [ ] transition to fully reactive sprae (preact-signals?) to compare reactivity and size

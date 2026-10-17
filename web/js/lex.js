// The code plates' tokens: one lexer for each grammar a plate speaks – JS and the JSON in it (// and /* */ comments),
// Python (#), shaders, HTML – as [start, end, type] offsets into the plate's own text, which lighthigh paints through
// the CSS Custom Highlight API (no span per token). A URL's // (after a colon) is no comment; a template literal is the
// shader it holds, read as code, not as one string; a string ends on its own line
const KW = { js: 'import|from|export|default|const|let|await|async|function|return|new|with|of', py: 'import|from|as|def|return|for|in|if|else|with', gl: 'fn|let|var|const|return|struct|uniform|in|out|inout|precision|highp|if|else|for|void' }
const COMMENT = { py: '#.*', html: '<!--[\\s\\S]*?-->' }, RE = {}
const re = (g) => new RegExp(`(${COMMENT[g] ?? '(?<!:)//.*|/\\*[\\s\\S]*?\\*/'})|('(?:\\\\.|[^'\\\\\\n])*'|"(?:\\\\.|[^"\\\\\\n])*")${KW[g] ? `|\\b(?:${KW[g]})\\b` : ''}`, 'g')
/** tokens of `src` in grammar `g` (js · py · gl · html; any other reads as js without its words), in order, never overlapping */
export const lex = (src, g = 'js') => Array.from(src.matchAll(RE[g] ??= re(g)), (m) => [m.index, m.index + m[0].length, m[1] ? 'comment' : m[2] ? 'string' : 'keyword'])
export default lex

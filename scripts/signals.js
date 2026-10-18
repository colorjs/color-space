#!/usr/bin/env node
/**
 * Who chose color-space – the deliberate signals, not the transitive download count.
 * Most npm downloads are old majors pulled through plotly.js → color-normalize →
 * color-rgba 2.x; nobody there picked the library. This prints what someone did pick:
 * the current major's share, its direct dependents, outside issues and outside code
 * that links the atlas. Public APIs only (npm, deps.dev); GitHub through `gh` if present.
 * Run: npm run signals
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const major = pkg.version.split('.')[0], repo = pkg.repository, owner = repo.split('/')[0]
const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json() }
const gh = (...args) => { try { return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })) } catch { return null } }
const pct = (a, b) => b ? `${(100 * a / b).toFixed(1)}%` : '–'

const { downloads } = await get(`https://api.npmjs.org/versions/${pkg.name}/last-week`)
const total = Object.values(downloads).reduce((a, b) => a + b, 0)
const cur = Object.entries(downloads).filter(([v]) => v.split('.')[0] === major)
const curSum = cur.reduce((a, [, n]) => a + n, 0)
console.log(`npm, last week: ${total.toLocaleString()} downloads, v${major}: ${curSum.toLocaleString()} (${pct(curSum, total)})`)
console.log('  ' + Object.entries(downloads).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([v, n]) => `${v} ${n.toLocaleString()}`).join(' · '))

const deps = []
for (const [v] of cur) {
	try { const d = await get(`https://api.deps.dev/v3alpha/systems/npm/packages/${pkg.name}/versions/${v}:dependents`); if (d.directDependentCount) deps.push(`${v} ${d.directDependentCount}`) } catch {}
}
console.log(`direct dependents of v${major} (deps.dev): ${deps.join(' · ') || 'none indexed'}`)

const issues = gh('api', `repos/${repo}/issues?state=all&per_page=100&since=${new Date(Date.now() - 90 * 864e5).toISOString()}`)
if (issues) {
	const me = gh('api', 'user')?.login   // the one running this, the maintainer
	const outside = issues.filter(i => i.user.login !== me && i.user.type !== 'Bot')
	console.log(`issues and pull requests from others, last 90 days: ${outside.length}${outside.length ? '\n' + outside.map(i => `  #${i.number} ${i.user.login}: ${i.title}`).join('\n') : ''}`)
	const r = gh('api', `repos/${repo}`)
	if (r) console.log(`stars ${r.stargazers_count} · forks ${r.forks_count} · open issues ${r.open_issues_count}`)
	const code = gh('search', 'code', 'color-space.io', '--limit', '50', '--json', 'repository,path')
	if (code) {
		const ext = code.filter(c => ![owner, me].includes(c.repository.nameWithOwner.split('/')[0]))
		console.log(`outside code that links color-space.io: ${ext.length}${ext.length ? '\n' + ext.map(c => `  ${c.repository.nameWithOwner} ${c.path}`).join('\n') : ''}`)
	}
} else console.log('GitHub: install and log in to `gh` for issues, stars and code references')
console.log('site: space-page sessions and LUT/ICC downloads are in Umami (cloud.umami.is), queries in Search Console')

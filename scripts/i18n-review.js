// Review English edits without changing which translations ship. Git supplies the
// comparison, so locale files need neither fingerprints nor review-version fields.
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const DIRS = ['web/i18n', 'plugins/figma/src/i18n', 'plugins/vscode/src/i18n']
// The comparison base may precede the migration from {t, h} to plain strings.
const text = (value) => typeof value === 'string' ? value : value?.t
const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const changes = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
	.filter((key) => key !== '@meta' && text(before[key]) !== text(after[key])).sort()

export function review(before, after, locales = {}) {
	const keys = changes(before, after)
	if (!keys.length) return 'No English strings changed.\n'
	return keys.map((key) => {
		const a = text(before[key]), b = text(after[key]), unchanged = [], missing = []
		if (b !== undefined) for (const [code, locale] of Object.entries(locales)) {
			const tr = text(locale.after[key])
			if (!tr) missing.push(code)
			else if (tr === text(locale.before[key])) unchanged.push(code)
		}
		return `<details><summary>${escape(key)} (${a === undefined ? 'added' : b === undefined ? 'removed' : 'changed'})</summary>\n\n` +
			`<pre>Before: ${escape(a ?? '(missing)')}\nAfter: ${escape(b ?? '(removed)')}</pre>\n\n` +
			(unchanged.length ? `Review unchanged translations: ${unchanged.join(', ')}.\n\n` : '') +
			(missing.length ? `Missing translations: ${missing.join(', ')}.\n\n` : '') + '</details>\n'
	}).join('\n')
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const root = fileURLToPath(new URL('../', import.meta.url))
	const base = process.env.I18N_BASE || 'HEAD^'
	const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })
	const paths = new Set(/^0+$/.test(base) ? [] : git('ls-tree', '-r', '--name-only', base, '--', ...DIRS).trim().split('\n'))
	const before = (path) => paths.has(path) ? JSON.parse(git('show', `${base}:${path}`)) : {}
	const after = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))
	let count = 0, report = '## Translation review\n\nExisting valid translations stay visible. Review the English changes below; a translation edit is not proof of review.\n\n'
	for (const dir of DIRS) {
		const path = `${dir}/en.json`, a = before(path), b = after(path)
		const locales = Object.fromEntries(readdirSync(new URL(`../${dir}/`, import.meta.url))
			.filter((f) => f.endsWith('.json') && f !== 'en.json').sort()
			.map((f) => [f.slice(0, -5), { before: before(`${dir}/${f}`), after: after(`${dir}/${f}`) }]))
		count += changes(a, b).length
		report += `### ${dir}\n\n${review(a, b, locales)}\n`
	}
	console.log(report)
	if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
	if (process.env.GITHUB_ACTIONS && count) console.log(`::warning title=Translation review::${count} English strings changed. See the job summary for text changes and translations to review.`)
}
